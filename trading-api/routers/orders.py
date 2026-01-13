"""Order placement and status endpoints with production safety guards."""
from fastapi import APIRouter, Depends, Request, HTTPException
from datetime import datetime
from models.schemas import (
    OrderRequest, OrderResponse, OrdersResponse, OrderStatus,
    UserContext, OrderSide
)
from middleware.auth import require_trading_approved, get_client_ip
from services.ib_client import get_ib_client
from services.audit import get_audit_service
from config import get_settings, TradingMode
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["Orders"])


@router.post("/order", response_model=OrderResponse)
async def place_order(
    request: Request,
    order: OrderRequest,
    user: UserContext = Depends(require_trading_approved)
) -> OrderResponse:
    """
    Place a market order to buy or sell an ETF.

    Safety guards:
    - Live trading blocked unless explicitly confirmed
    - All orders logged with environment info
    - Connection verified before submission
    """
    settings = get_settings()
    ib_client = get_ib_client()
    audit = get_audit_service()
    client_ip = get_client_ip(request)

    # ==========================================================================
    # SAFETY CHECK: Block live trading unless explicitly enabled
    # ==========================================================================
    if settings.trading_mode == TradingMode.LIVE:
        if not settings.is_live_trading_enabled():
            logger.error(f"BLOCKED: Live trading attempt without confirmation - {order.side.value} {order.quantity} {order.symbol}")
            return OrderResponse(
                success=False,
                message="Live trading is not enabled. Set LIVE_TRADING_CONFIRMATION environment variable.",
                details={"error": "LIVE_TRADING_BLOCKED", "mode": "live"}
            )

    # ==========================================================================
    # Log order attempt with full context
    # ==========================================================================
    order_context = {
        "timestamp": datetime.now().isoformat(),
        "trading_mode": settings.trading_mode.value,
        "customer_id": user.customer_id,
        "ib_account": user.ib_account_id,
        "symbol": order.symbol,
        "conid": order.conid,
        "side": order.side.value,
        "quantity": order.quantity,
        "order_type": order.order_type.value,
        "limit_price": order.limit_price,
        "stop_price": order.stop_price,
        "client_ip": client_ip,
    }

    if settings.log_orders:
        logger.info(f"ORDER ATTEMPT: {order_context}")

    # ==========================================================================
    # Connection checks
    # ==========================================================================
    if not ib_client.is_connected():
        logger.error(f"Order rejected: IB Gateway not connected - {order_context}")
        return OrderResponse(
            success=False,
            message="IB Gateway is not connected. Please ensure IB Gateway is running and connected.",
            details={"error": "NOT_CONNECTED"}
        )

    if not ib_client.is_ready_for_orders():
        logger.error(f"Order rejected: IB Gateway not ready - {order_context}")
        return OrderResponse(
            success=False,
            message="IB Gateway is connected but not ready for orders. Waiting for nextValidId.",
            details={"error": "NOT_READY"}
        )

    # Validate ETF is in our allowed list
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
                symbol=order.symbol,
                side=order.side.value,
                quantity=order.quantity,
                error_message=result.get("message", "Unknown error"),
                request_payload=request_payload,
                ip_address=client_ip
            )
            return OrderResponse(
                success=False,
                message=result.get("message", "Order failed"),
                details=result
            )

        # Handle order confirmation if required
        # IB may return a reply_id that needs confirmation
        if isinstance(result, list) and len(result) > 0:
            first_result = result[0]

            # Check if confirmation is needed
            if "id" in first_result and "message" in first_result:
                # This is a confirmation request
                confirm_result = await ib_client.confirm_order(first_result["id"])
                result = confirm_result

        # Extract order ID from result
        order_id = None
        if isinstance(result, list) and len(result) > 0:
            order_id = str(result[0].get("order_id", result[0].get("orderId", "")))
        elif isinstance(result, dict):
            order_id = str(result.get("order_id", result.get("orderId", "")))

        # Log successful order
        await audit.log_order_placed(
            customer_id=user.customer_id,
            broker_account_id=user.broker_account_id,
            order_id=order_id or "pending",
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
            request_payload=request_payload,
            response_payload=result if isinstance(result, dict) else {"result": result},
            ip_address=client_ip
        )

        # Add trading mode to success response
        details = result if isinstance(result, dict) else {"result": result}
        details["trading_mode"] = settings.trading_mode.value

        if settings.log_orders:
            logger.info(f"ORDER SUCCESS: order_id={order_id}, {order_context}")

        return OrderResponse(
            success=True,
            order_id=order_id,
            message=f"Order placed successfully: {order.side.value} {order.quantity} {order.symbol} [{settings.trading_mode.value.upper()}]",
            details=details
        )

    except Exception as e:
        logger.error(f"Error placing order: {e}")
        await audit.log_order_error(
            customer_id=user.customer_id,
            broker_account_id=user.broker_account_id,
            symbol=order.symbol,
            side=order.side.value,
            quantity=order.quantity,
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
    Get status of recent orders.

    Returns orders from the current trading session.
    """
    ib_client = get_ib_client()

    raw_orders = await ib_client.get_orders()

    orders = []
    for raw in raw_orders:
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
