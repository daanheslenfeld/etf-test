"""Order placement and status endpoints with production safety guards."""
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.schemas import (
    OrderRequest, OrderResponse, OrdersResponse, OrderStatus,
    UserContext, OrderSide
)
from middleware.auth import require_trading_approved, get_client_ip
from services.ib_client import get_ib_client
from services.audit import get_audit_service
from services.safety import get_safety_service
from config import get_settings, TradingMode
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["Orders"])


class SafetyCheckRequest(BaseModel):
    """Request to check order safety before submission."""
    symbol: str
    conid: int
    side: str
    quantity: int
    order_type: str = "MKT"
    estimated_price: Optional[float] = None


class SafetyCheckResponse(BaseModel):
    """Response from safety check."""
    allowed: bool
    reason: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_type: Optional[str] = None
    warnings: list = []
    trading_mode: str
    is_live: bool


class UserLimitsResponse(BaseModel):
    """User's current trading limits and stats."""
    date: str
    order_count: int
    max_orders: int
    total_exposure: float
    max_exposure: float
    orders_remaining: int
    exposure_remaining: float
    max_order_size: int
    max_order_value: float
    trading_mode: str
    is_live: bool


@router.get("/safety/limits", response_model=UserLimitsResponse)
async def get_user_limits(
    user: UserContext = Depends(require_trading_approved)
) -> UserLimitsResponse:
    """Get current user's trading limits and daily stats."""
    settings = get_settings()
    safety = get_safety_service()

    stats = safety.get_user_daily_stats(user.customer_id)
    limits = safety.get_user_limits(user.customer_id)

    return UserLimitsResponse(
        date=stats["date"],
        order_count=stats["order_count"],
        max_orders=stats["max_orders"],
        total_exposure=stats["total_exposure"],
        max_exposure=stats["max_exposure"],
        orders_remaining=stats["orders_remaining"],
        exposure_remaining=stats["exposure_remaining"],
        max_order_size=limits.max_order_size,
        max_order_value=limits.max_order_value,
        trading_mode=settings.trading_mode.value,
        is_live=settings.trading_mode == TradingMode.LIVE
    )


@router.post("/safety/check", response_model=SafetyCheckResponse)
async def check_order_safety(
    check: SafetyCheckRequest,
    user: UserContext = Depends(require_trading_approved)
) -> SafetyCheckResponse:
    """
    Pre-check if an order would pass safety limits.

    Call this before submission to get confirmation requirements.
    """
    settings = get_settings()
    safety = get_safety_service()
    is_live = settings.trading_mode == TradingMode.LIVE

    # Estimate order value
    estimated_value = (check.estimated_price or 100.0) * check.quantity

    result = await safety.check_order_safety(
        customer_id=user.customer_id,
        ib_account_id=user.ib_account_id,
        symbol=check.symbol,
        side=check.side,
        quantity=check.quantity,
        order_type=check.order_type,
        estimated_value=estimated_value,
        is_live_mode=is_live
    )

    return SafetyCheckResponse(
        allowed=result.allowed,
        reason=result.reason,
        requires_confirmation=result.requires_confirmation,
        confirmation_type=result.confirmation_type,
        warnings=result.warnings,
        trading_mode=settings.trading_mode.value,
        is_live=is_live
    )


@router.post("/order", response_model=OrderResponse)
async def place_order(
    request: Request,
    order: OrderRequest,
    confirmed: bool = False,
    user: UserContext = Depends(require_trading_approved)
) -> OrderResponse:
    """
    Place an order to buy or sell an ETF.

    Safety guards:
    - Per-user order size and value limits
    - Daily exposure limits
    - Double-submission prevention
    - Live trading requires explicit confirmation
    - Full audit logging with user, account, and order details
    """
    settings = get_settings()
    ib_client = get_ib_client()
    audit = get_audit_service()
    safety = get_safety_service()
    client_ip = get_client_ip(request)
    is_live = settings.trading_mode == TradingMode.LIVE
    trading_mode = settings.trading_mode.value

    # ==========================================================================
    # SAFETY CHECK: Block live trading unless explicitly enabled
    # ==========================================================================
    if is_live and not settings.is_live_trading_enabled():
        logger.error(f"BLOCKED: Live trading not enabled - user={user.customer_id}")
        await audit.log_safety_block(
            customer_id=user.customer_id,
            ib_account_id=user.ib_account_id,
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
            reason="Live trading not enabled on server",
            trading_mode=trading_mode,
            ip_address=client_ip
        )
        return OrderResponse(
            success=False,
            message="Live trading is not enabled. Contact administrator.",
            details={"error": "LIVE_TRADING_BLOCKED", "trading_mode": trading_mode}
        )

    # ==========================================================================
    # Estimate order value for safety checks
    # ==========================================================================
    # Try to get current price from market data
    market_data = ib_client.get_all_market_data()
    etf_data = None
    for conid, data in market_data.items():
        if data.get("symbol") == order.symbol or conid == order.conid:
            etf_data = data
            break

    estimated_price = 100.0  # Default fallback
    if etf_data:
        estimated_price = etf_data.get("last") or etf_data.get("bid") or estimated_price

    if order.limit_price:
        estimated_price = order.limit_price

    estimated_value = estimated_price * order.quantity

    # ==========================================================================
    # SAFETY CHECKS: Per-user limits
    # ==========================================================================
    safety_result = await safety.check_order_safety(
        customer_id=user.customer_id,
        ib_account_id=user.ib_account_id,
        symbol=order.symbol,
        side=order.side.value,
        quantity=order.quantity,
        order_type=order.order_type.value,
        estimated_value=estimated_value,
        is_live_mode=is_live
    )

    if not safety_result.allowed:
        logger.warning(f"Order blocked by safety: {safety_result.reason}")
        await audit.log_safety_block(
            customer_id=user.customer_id,
            ib_account_id=user.ib_account_id,
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
            reason=safety_result.reason,
            trading_mode=trading_mode,
            ip_address=client_ip
        )
        return OrderResponse(
            success=False,
            message=safety_result.reason,
            details={
                "error": "SAFETY_LIMIT_EXCEEDED",
                "trading_mode": trading_mode,
                "is_live": is_live
            }
        )

    # ==========================================================================
    # CONFIRMATION CHECK: Require confirmation for risky orders
    # ==========================================================================
    if safety_result.requires_confirmation and not confirmed:
        return OrderResponse(
            success=False,
            message=f"Confirmation required: {safety_result.confirmation_type}",
            details={
                "error": "CONFIRMATION_REQUIRED",
                "confirmation_type": safety_result.confirmation_type,
                "warnings": safety_result.warnings,
                "trading_mode": trading_mode,
                "is_live": is_live
            }
        )

    # ==========================================================================
    # DOUBLE SUBMISSION PREVENTION
    # ==========================================================================
    await safety.mark_order_pending(
        customer_id=user.customer_id,
        ib_account_id=user.ib_account_id,
        symbol=order.symbol,
        side=order.side.value,
        quantity=order.quantity,
        order_type=order.order_type.value
    )

    # ==========================================================================
    # Connection checks
    # ==========================================================================
    if not ib_client.is_connected():
        return OrderResponse(
            success=False,
            message="IB Gateway not connected",
            details={"error": "NOT_CONNECTED", "trading_mode": trading_mode}
        )

    if not ib_client.is_ready_for_orders():
        return OrderResponse(
            success=False,
            message="IB Gateway not ready for orders",
            details={"error": "NOT_READY", "trading_mode": trading_mode}
        )

    # Validate ETF is in allowed list
    mvp_etfs = ib_client.get_mvp_etfs()
    allowed_conids = [etf["conid"] for etf in mvp_etfs]

    if order.conid not in allowed_conids:
        raise HTTPException(
            status_code=400,
            detail=f"ETF with conid {order.conid} is not available for trading"
        )

    request_payload = order.model_dump()

    try:
        # Place order via IB Gateway
        result = await ib_client.place_order(
            account_id=user.ib_account_id,
            conid=order.conid,
            side=order.side.value,
            quantity=order.quantity,
            order_type=order.order_type.value,
            limit_price=order.limit_price,
            stop_price=order.stop_price
        )

        # Check for errors
        if result.get("error"):
            await audit.log_order_error(
                customer_id=user.customer_id,
                broker_account_id=user.broker_account_id,
                ib_account_id=user.ib_account_id,
                symbol=order.symbol,
                side=order.side.value,
                quantity=order.quantity,
                order_type=order.order_type.value,
                trading_mode=trading_mode,
                error_message=result.get("message", "Unknown error"),
                request_payload=request_payload,
                ip_address=client_ip
            )
            return OrderResponse(
                success=False,
                message=result.get("message", "Order failed"),
                details={**result, "trading_mode": trading_mode, "is_live": is_live}
            )

        # Handle order confirmation if required by IB
        if isinstance(result, list) and len(result) > 0:
            first_result = result[0]
            if "id" in first_result and "message" in first_result:
                confirm_result = await ib_client.confirm_order(first_result["id"])
                result = confirm_result

        # Extract order ID
        order_id = None
        if isinstance(result, list) and len(result) > 0:
            order_id = str(result[0].get("order_id", result[0].get("orderId", "")))
        elif isinstance(result, dict):
            order_id = str(result.get("order_id", result.get("orderId", "")))

        # Record successful order in safety service
        await safety.record_order_executed(
            customer_id=user.customer_id,
            ib_account_id=user.ib_account_id,
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
            order_type=order.order_type.value,
            order_id=order_id or "unknown",
            estimated_value=estimated_value
        )

        # Log successful order with full audit trail
        await audit.log_order_placed(
            customer_id=user.customer_id,
            broker_account_id=user.broker_account_id,
            ib_account_id=user.ib_account_id,
            order_id=order_id or "pending",
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
            order_type=order.order_type.value,
            trading_mode=trading_mode,
            request_payload=request_payload,
            response_payload=result if isinstance(result, dict) else {"result": result},
            ip_address=client_ip,
            safety_warnings=safety_result.warnings
        )

        details = result if isinstance(result, dict) else {"result": result}
        details["trading_mode"] = trading_mode
        details["is_live"] = is_live

        mode_label = "LIVE" if is_live else "PAPER"
        return OrderResponse(
            success=True,
            order_id=order_id,
            message=f"[{mode_label}] Order placed: {order.side.value} {order.quantity} {order.symbol}",
            details=details
        )

    except Exception as e:
        logger.error(f"Error placing order: {e}")
        await audit.log_order_error(
            customer_id=user.customer_id,
            broker_account_id=user.broker_account_id,
            ib_account_id=user.ib_account_id,
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
            order_type=order.order_type.value,
            trading_mode=trading_mode,
            error_message=str(e),
            request_payload=request_payload,
            ip_address=client_ip
        )
        raise HTTPException(status_code=500, detail=f"Error placing order: {str(e)}")


@router.get("/orders", response_model=OrdersResponse)
async def get_orders(
    user: UserContext = Depends(require_trading_approved)
) -> OrdersResponse:
    """
    Get status of recent orders for the current user's linked account.

    MULTI-USER ISOLATION: Only returns orders for the user's linked IB account.
    """
    ib_client = get_ib_client()

    raw_orders = await ib_client.get_orders()

    # Filter orders by user's account
    orders = []
    for raw in raw_orders:
        order_account = raw.get("acctId", raw.get("account", ""))
        if order_account and order_account != user.ib_account_id:
            continue

        orders.append(OrderStatus(
            order_id=str(raw.get("orderId", raw.get("order_id", ""))),
            symbol=raw.get("ticker", raw.get("symbol", "")),
            side=raw.get("side", ""),
            quantity=raw.get("totalSize", raw.get("quantity", 0)),
            filled_quantity=raw.get("filledQuantity", raw.get("filled", 0)),
            status=raw.get("status", "Unknown"),
            avg_fill_price=raw.get("avgPrice"),
            created_at=raw.get("lastExecutionTime")
        ))

    return OrdersResponse(
        orders=orders,
        count=len(orders)
    )
