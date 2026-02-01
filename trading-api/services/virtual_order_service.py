"""Virtual Order Service - wraps real IB orders with virtual account logic.

Flow:
1. Validate virtual account ownership + active status
2. Validate virtual balance (cash for BUY, holdings for SELL)
3. Reserve virtual cash (BUY only)
4. Place REAL order via IB Gateway on shared account
5. On success: update virtual portfolio (deduct/credit, add/remove holding)
6. On failure: release reserved cash, record failed order
"""
import httpx
from decimal import Decimal
from typing import Optional
from datetime import datetime, timezone
from config import get_settings, TradingMode
from services.virtual_account_service import get_virtual_account_service, VirtualAccountError
from services.virtual_portfolio_service import get_virtual_portfolio_service
from services.cash_allocation_service import get_cash_allocation_service, CashAllocationError
from services.ib_client import get_ib_client
from services.safety import get_safety_service
from services.audit import get_audit_service
from models.schemas import UserContext
import logging

logger = logging.getLogger(__name__)

# Price buffer for BUY cash reservation (2% above estimated price)
PRICE_BUFFER_PERCENT = Decimal("0.02")


class VirtualOrderError(Exception):
    """Custom exception for virtual order errors."""

    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class VirtualOrderResult:
    """Result of a virtual order placement."""

    def __init__(
        self,
        success: bool,
        order_id: str = None,
        virtual_account_id: str = None,
        virtual_account_name: str = "",
        message: str = "",
        details: dict = None
    ):
        self.success = success
        self.order_id = order_id
        self.virtual_account_id = virtual_account_id
        self.virtual_account_name = virtual_account_name
        self.message = message
        self.details = details or {}


class VirtualOrderService:
    """Service for placing orders from virtual accounts."""

    def __init__(self):
        settings = get_settings()
        self.base_url = f"{settings.supabase_url}/rest/v1"
        api_key = settings.supabase_service_role_key or settings.supabase_key
        self.headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self._configured = bool(api_key)

    async def place_virtual_order(
        self,
        user: UserContext,
        virtual_account_id: str,
        symbol: str,
        conid: int,
        side: str,
        quantity: int,
        order_type: str = "MKT",
        limit_price: float = None,
        stop_price: float = None,
        estimated_price: float = None,
        client_ip: str = "unknown"
    ) -> VirtualOrderResult:
        """
        Place an order from a virtual account.

        This validates virtual balances, places a REAL IB order,
        then updates the virtual portfolio based on the result.
        """
        settings = get_settings()
        ib_client = get_ib_client()
        account_service = get_virtual_account_service()
        portfolio_service = get_virtual_portfolio_service()
        cash_service = get_cash_allocation_service()
        safety = get_safety_service()
        audit = get_audit_service()

        side = side.upper()
        order_type = order_type.upper()
        is_live = settings.trading_mode == TradingMode.LIVE
        trading_mode = settings.trading_mode.value
        reserved_amount = Decimal("0")
        intention_id = None

        # ======================================================================
        # 1. VALIDATE VIRTUAL ACCOUNT
        # ======================================================================
        account = await account_service.get_account(virtual_account_id, user.customer_id)
        if not account:
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                message="Virtual account not found or does not belong to you.",
                details={"error": "ACCOUNT_NOT_FOUND"}
            )

        if not account["is_active"]:
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account["name"],
                message="Virtual account is deactivated.",
                details={"error": "ACCOUNT_INACTIVE"}
            )

        if account.get("is_frozen", False):
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account["name"],
                message="Virtual account is frozen. Admin intervention required.",
                details={"error": "ACCOUNT_FROZEN"}
            )

        account_name = account["name"]

        # ======================================================================
        # 2. GET ESTIMATED PRICE
        # ======================================================================
        if not estimated_price:
            market_data = ib_client.get_all_market_data()
            for cid, data in market_data.items():
                if data.get("symbol") == symbol or cid == conid:
                    estimated_price = data.get("last") or data.get("bid") or 100.0
                    break
            if not estimated_price:
                estimated_price = 100.0

        if limit_price:
            price_for_calc = limit_price
        else:
            price_for_calc = estimated_price

        estimated_value = Decimal(str(price_for_calc)) * Decimal(quantity)

        # ======================================================================
        # 3. VALIDATE VIRTUAL BALANCE
        # ======================================================================
        if side == "BUY":
            reserved_amount = estimated_value * (1 + PRICE_BUFFER_PERCENT)

            # Reserve cash atomically via RPC (validates available >= amount)
            try:
                await cash_service.reserve_for_order(
                    account_id=virtual_account_id,
                    amount=float(reserved_amount),
                )
            except CashAllocationError as e:
                return VirtualOrderResult(
                    success=False,
                    virtual_account_id=virtual_account_id,
                    virtual_account_name=account_name,
                    message=f"Insufficient virtual funds: {e.message}",
                    details={
                        "error": "INSUFFICIENT_VIRTUAL_FUNDS",
                        "required": float(reserved_amount)
                    }
                )

        elif side == "SELL":
            holding = await portfolio_service.get_holding(
                user.customer_id, symbol, virtual_account_id
            )
            if not holding:
                return VirtualOrderResult(
                    success=False,
                    virtual_account_id=virtual_account_id,
                    virtual_account_name=account_name,
                    message=f"No virtual holdings of {symbol} in this account.",
                    details={"error": "NO_VIRTUAL_HOLDING"}
                )

            available_qty = Decimal(str(holding["quantity"]))
            if available_qty < quantity:
                return VirtualOrderResult(
                    success=False,
                    virtual_account_id=virtual_account_id,
                    virtual_account_name=account_name,
                    message=f"Insufficient shares. Have: {float(available_qty)}, Need: {quantity}",
                    details={
                        "error": "INSUFFICIENT_VIRTUAL_SHARES",
                        "available": float(available_qty),
                        "required": quantity
                    }
                )

        # ======================================================================
        # 4. RECORD ORDER INTENTION (pending)
        # ======================================================================
        try:
            intention_id = await self._create_order_intention(
                user_id=user.customer_id,
                virtual_account_id=virtual_account_id,
                symbol=symbol,
                conid=conid,
                side=side,
                quantity=quantity,
                order_type=order_type,
                limit_price=limit_price,
                estimated_price=price_for_calc,
                estimated_value=float(estimated_value),
                reserved_amount=float(reserved_amount)
            )
        except Exception as e:
            logger.error(f"Failed to create order intention: {e}")
            # Release reserved cash on failure
            if side == "BUY" and reserved_amount > 0:
                try:
                    await cash_service.cancel_order(
                        account_id=virtual_account_id,
                        reserved_amount=float(reserved_amount),
                    )
                except Exception as cancel_err:
                    logger.error(f"Failed to release cash after intention failure: {cancel_err}")
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account_name,
                message="Failed to record order.",
                details={"error": "INTENTION_FAILED"}
            )

        # ======================================================================
        # 5. SAFETY CHECKS (existing system)
        # ======================================================================
        if is_live and not settings.is_live_trading_enabled():
            await self._fail_intention(intention_id, "Live trading not enabled")
            if side == "BUY" and reserved_amount > 0:
                try:
                    await cash_service.cancel_order(
                        account_id=virtual_account_id,
                        reserved_amount=float(reserved_amount),
                        order_intention_id=intention_id,
                    )
                except Exception as cancel_err:
                    logger.error(f"Failed to release cash after live-trading block: {cancel_err}")
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account_name,
                message="Live trading is not enabled.",
                details={"error": "LIVE_TRADING_BLOCKED"}
            )

        safety_result = await safety.check_order_safety(
            customer_id=user.customer_id,
            ib_account_id=user.ib_account_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            order_type=order_type,
            estimated_value=float(estimated_value),
            is_live_mode=is_live
        )

        if not safety_result.allowed:
            await self._fail_intention(intention_id, safety_result.reason)
            if side == "BUY" and reserved_amount > 0:
                try:
                    await cash_service.cancel_order(
                        account_id=virtual_account_id,
                        reserved_amount=float(reserved_amount),
                        order_intention_id=intention_id,
                    )
                except Exception as cancel_err:
                    logger.error(f"Failed to release cash after safety block: {cancel_err}")
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account_name,
                message=safety_result.reason,
                details={"error": "SAFETY_BLOCKED"}
            )

        # ======================================================================
        # 6. PLACE REAL IB ORDER
        # ======================================================================
        if not ib_client.is_connected():
            await self._fail_intention(intention_id, "IB Gateway not connected")
            if side == "BUY" and reserved_amount > 0:
                try:
                    await cash_service.cancel_order(
                        account_id=virtual_account_id,
                        reserved_amount=float(reserved_amount),
                        order_intention_id=intention_id,
                    )
                except Exception as cancel_err:
                    logger.error(f"Failed to release cash after IB disconnect: {cancel_err}")
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account_name,
                message="IB Gateway not connected.",
                details={"error": "NOT_CONNECTED"}
            )

        try:
            result = await ib_client.place_order(
                account_id=user.ib_account_id,
                conid=conid,
                side=side,
                quantity=quantity,
                order_type=order_type,
                limit_price=limit_price,
                stop_price=stop_price
            )

            if result.get("error"):
                raise Exception(result.get("message", "IB order failed"))

        except Exception as e:
            error_msg = str(e)
            logger.error(f"IB order failed for virtual account {virtual_account_id}: {error_msg}")
            await self._fail_intention(intention_id, error_msg)
            if side == "BUY" and reserved_amount > 0:
                try:
                    await cash_service.cancel_order(
                        account_id=virtual_account_id,
                        reserved_amount=float(reserved_amount),
                        order_intention_id=intention_id,
                    )
                except Exception as cancel_err:
                    logger.error(f"Failed to release cash after IB order failure: {cancel_err}")
            await audit.log_order_error(
                customer_id=user.customer_id,
                broker_account_id=user.broker_account_id,
                ib_account_id=user.ib_account_id,
                symbol=symbol,
                side=side,
                quantity=quantity,
                order_type=order_type,
                trading_mode=trading_mode,
                error_message=f"[Virtual:{account_name}] {error_msg}",
                request_payload={"virtual_account_id": virtual_account_id},
                ip_address=client_ip
            )
            return VirtualOrderResult(
                success=False,
                virtual_account_id=virtual_account_id,
                virtual_account_name=account_name,
                message=f"IB order failed: {error_msg}",
                details={"error": "IB_ORDER_FAILED", "ib_error": error_msg}
            )

        # ======================================================================
        # 7. IB ORDER SUCCEEDED - UPDATE VIRTUAL PORTFOLIO
        # ======================================================================
        # Extract order details
        order_id = None
        if isinstance(result, list) and len(result) > 0:
            order_id = str(result[0].get("order_id", result[0].get("orderId", "")))
        elif isinstance(result, dict):
            order_id = str(result.get("order_id", result.get("orderId", "")))

        fill_price = None
        if isinstance(result, dict):
            fill_price = result.get("avgPrice") or result.get("lastFillPrice")

        # Use estimated price if no fill price yet (market order may not have immediate fill)
        actual_price = Decimal(str(fill_price)) if fill_price else Decimal(str(price_for_calc))
        actual_cost = actual_price * Decimal(quantity)

        if side == "BUY":
            # Settle buy: release reserved, return excess to available (atomic via RPC)
            await cash_service.settle_buy(
                account_id=virtual_account_id,
                reserved_amount=float(reserved_amount),
                actual_cost=float(actual_cost),
                order_intention_id=intention_id,
            )

            # Add shares to virtual holdings
            await portfolio_service.add_holding(
                user_id=user.customer_id,
                symbol=symbol,
                conid=conid,
                quantity=Decimal(quantity),
                cost_basis=actual_price,
                virtual_account_id=virtual_account_id
            )

        elif side == "SELL":
            # Remove shares from virtual holdings
            await portfolio_service.remove_holding(
                user_id=user.customer_id,
                symbol=symbol,
                quantity=Decimal(quantity),
                virtual_account_id=virtual_account_id
            )

            # Credit sell proceeds to available cash (atomic via RPC)
            await cash_service.credit_sell(
                account_id=virtual_account_id,
                proceeds=float(actual_cost),
                order_intention_id=intention_id,
            )

        # Update intention to filled
        await self._fill_intention(
            intention_id=intention_id,
            order_id=order_id,
            fill_price=float(actual_price),
            fill_quantity=quantity,
            fill_value=float(actual_cost)
        )

        # Record safety + audit
        await safety.record_order_executed(
            customer_id=user.customer_id,
            ib_account_id=user.ib_account_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            order_type=order_type,
            order_id=order_id or "unknown",
            estimated_value=float(estimated_value)
        )

        await audit.log_order_placed(
            customer_id=user.customer_id,
            broker_account_id=user.broker_account_id,
            ib_account_id=user.ib_account_id,
            order_id=order_id or "pending",
            symbol=symbol,
            side=side,
            quantity=quantity,
            order_type=order_type,
            trading_mode=trading_mode,
            request_payload={"virtual_account_id": virtual_account_id, "virtual_account_name": account_name},
            response_payload=result if isinstance(result, dict) else {"result": result},
            ip_address=client_ip,
            safety_warnings=safety_result.warnings
        )

        mode_label = "LIVE" if is_live else "PAPER"
        return VirtualOrderResult(
            success=True,
            order_id=order_id,
            virtual_account_id=virtual_account_id,
            virtual_account_name=account_name,
            message=f"[{mode_label}] [{account_name}] {side} {quantity} {symbol}",
            details={
                "ib_order_id": order_id,
                "fill_price": float(actual_price),
                "fill_value": float(actual_cost),
                "trading_mode": trading_mode,
                "is_live": is_live
            }
        )

    # ==========================================================================
    # ORDER INTENTION HELPERS
    # ==========================================================================

    async def _create_order_intention(
        self,
        user_id: int,
        virtual_account_id: str,
        symbol: str,
        conid: int,
        side: str,
        quantity: int,
        order_type: str,
        limit_price: float = None,
        estimated_price: float = None,
        estimated_value: float = None,
        reserved_amount: float = 0
    ) -> str:
        """Create an order intention record. Returns intention ID."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{self.base_url}/order_intentions",
                headers=self.headers,
                json={
                    "user_id": user_id,
                    "virtual_account_id": virtual_account_id,
                    "symbol": symbol,
                    "conid": conid,
                    "side": side,
                    "quantity": quantity,
                    "order_type": order_type,
                    "limit_price": limit_price,
                    "estimated_price": estimated_price,
                    "estimated_value": estimated_value,
                    "reserved_amount": reserved_amount,
                    "status": "pending",
                    "submitted_at": datetime.now(timezone.utc).isoformat()
                }
            )
            response.raise_for_status()
            data = response.json()
            result = data[0] if isinstance(data, list) else data
            return result["id"]

    async def _fail_intention(self, intention_id: str, reason: str):
        """Mark an order intention as rejected."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.patch(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={"id": f"eq.{intention_id}"},
                    json={
                        "status": "rejected",
                        "status_message": reason,
                        "executed_at": datetime.now(timezone.utc).isoformat()
                    }
                )
        except Exception as e:
            logger.error(f"Failed to update intention {intention_id}: {e}")

    async def _fill_intention(
        self,
        intention_id: str,
        order_id: str = None,
        fill_price: float = None,
        fill_quantity: int = None,
        fill_value: float = None
    ):
        """Mark an order intention as filled."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                update = {
                    "status": "filled",
                    "executed_at": datetime.now(timezone.utc).isoformat()
                }
                if fill_price is not None:
                    update["fill_price"] = fill_price
                if fill_quantity is not None:
                    update["filled_quantity"] = fill_quantity
                if fill_value is not None:
                    update["fill_value"] = fill_value
                if order_id:
                    update["status_message"] = f"IB order {order_id}"

                await client.patch(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={"id": f"eq.{intention_id}"},
                    json=update
                )
        except Exception as e:
            logger.error(f"Failed to update intention {intention_id}: {e}")

    async def get_account_orders(
        self,
        user_id: int,
        virtual_account_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> list[dict]:
        """Get order history for a virtual account."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "virtual_account_id": f"eq.{virtual_account_id}",
                        "select": "*",
                        "order": "submitted_at.desc",
                        "limit": limit,
                        "offset": offset
                    }
                )
                response.raise_for_status()
                return response.json() or []
        except Exception as e:
            logger.error(f"Error getting orders for virtual account {virtual_account_id}: {e}")
            return []


# Singleton
_virtual_order_service: Optional[VirtualOrderService] = None


def get_virtual_order_service() -> VirtualOrderService:
    global _virtual_order_service
    if _virtual_order_service is None:
        _virtual_order_service = VirtualOrderService()
    return _virtual_order_service
