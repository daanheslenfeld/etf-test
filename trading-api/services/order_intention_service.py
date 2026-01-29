"""Order Intention Service for batch trading system.

Manages order intentions (orders awaiting batch execution) with validation.
"""
import httpx
from decimal import Decimal
from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID
from config import get_settings
from services.virtual_portfolio_service import get_virtual_portfolio_service
import logging

logger = logging.getLogger(__name__)


class OrderIntentionError(Exception):
    """Custom exception for order intention errors."""

    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code  # e.g., "INSUFFICIENT_FUNDS", "INSUFFICIENT_SHARES"
        self.details = details or {}
        super().__init__(self.message)


class OrderIntentionService:
    """Service for managing order intentions."""

    # Cash buffer for BUY orders (to account for price movement)
    PRICE_BUFFER_PERCENT = Decimal("0.02")  # 2%

    def __init__(self):
        settings = get_settings()
        self.base_url = f"{settings.supabase_url}/rest/v1"
        # Use service_role key to bypass RLS for backend access
        api_key = settings.supabase_service_role_key or settings.supabase_key
        self.headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self._configured = bool(api_key)
        if not self._configured:
            logger.warning("OrderIntentionService not configured: missing supabase keys")

    def is_configured(self) -> bool:
        """Check if service is properly configured."""
        return self._configured

    async def create_intention(
        self,
        user_id: int,
        symbol: str,
        conid: int,
        side: str,
        quantity: int,
        order_type: str = "MKT",
        limit_price: Optional[Decimal] = None,
        estimated_price: Optional[Decimal] = None,
        isin: str = None,
        name: str = None
    ) -> dict:
        """
        Create a new order intention.

        Validations:
        - BUY: User has sufficient available cash (cash - reserved)
        - SELL: User has sufficient shares
        - Quantity must be positive

        Side effects:
        - BUY: Reserves estimated cash amount (price * qty * (1 + buffer))

        Args:
            user_id: User ID
            symbol: ETF symbol (e.g., "IWDA")
            conid: IB contract ID
            side: "BUY" or "SELL"
            quantity: Number of shares (must be positive integer)
            order_type: "MKT" or "LMT" (default: "MKT")
            limit_price: Required for LMT orders
            estimated_price: Current market price estimate
            isin: Optional ISIN
            name: Optional ETF name

        Returns:
            Created order intention record

        Raises:
            OrderIntentionError: On validation failure
        """
        if not self._configured:
            raise OrderIntentionError("Service not configured", code="NOT_CONFIGURED")

        # Validate side
        side = side.upper()
        if side not in ("BUY", "SELL"):
            raise OrderIntentionError(f"Invalid side: {side}", code="INVALID_SIDE")

        # Validate quantity
        if quantity <= 0:
            raise OrderIntentionError("Quantity must be positive", code="INVALID_QUANTITY")

        # Validate order type
        order_type = order_type.upper()
        if order_type not in ("MKT", "LMT"):
            raise OrderIntentionError(f"Invalid order type: {order_type}", code="INVALID_ORDER_TYPE")

        if order_type == "LMT" and limit_price is None:
            raise OrderIntentionError("Limit price required for LMT orders", code="MISSING_LIMIT_PRICE")

        portfolio_service = get_virtual_portfolio_service()

        # Calculate estimated value for BUY orders
        price_for_calculation = limit_price or estimated_price
        if price_for_calculation is None:
            raise OrderIntentionError(
                "Price estimate required for order validation",
                code="MISSING_PRICE"
            )

        estimated_value = Decimal(str(price_for_calculation)) * Decimal(quantity)
        reserved_amount = Decimal("0")

        if side == "BUY":
            # Add buffer for price movement
            reserved_amount = estimated_value * (1 + self.PRICE_BUFFER_PERCENT)

            # Check available cash
            available = await portfolio_service.get_cash_balance(user_id)
            if available < reserved_amount:
                raise OrderIntentionError(
                    f"Insufficient funds. Available: {available}, Required: {reserved_amount}",
                    code="INSUFFICIENT_FUNDS",
                    details={
                        "available": float(available),
                        "required": float(reserved_amount),
                        "shortfall": float(reserved_amount - available)
                    }
                )

            # Reserve the cash
            success = await portfolio_service.reserve_cash(user_id, reserved_amount)
            if not success:
                raise OrderIntentionError(
                    "Failed to reserve cash for order",
                    code="RESERVE_FAILED"
                )

        elif side == "SELL":
            # Check available shares
            holding = await portfolio_service.get_holding(user_id, symbol)
            if not holding:
                raise OrderIntentionError(
                    f"No shares of {symbol} to sell",
                    code="NO_HOLDING"
                )

            available_qty = Decimal(str(holding["quantity"]))
            if available_qty < quantity:
                raise OrderIntentionError(
                    f"Insufficient shares. Have: {available_qty}, Selling: {quantity}",
                    code="INSUFFICIENT_SHARES",
                    details={
                        "available": float(available_qty),
                        "required": quantity,
                        "shortfall": quantity - float(available_qty)
                    }
                )

        # Create the intention record
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    json={
                        "user_id": user_id,
                        "symbol": symbol,
                        "conid": conid,
                        "isin": isin,
                        "name": name,
                        "side": side,
                        "quantity": quantity,
                        "order_type": order_type,
                        "limit_price": float(limit_price) if limit_price else None,
                        "estimated_price": float(price_for_calculation),
                        "estimated_value": float(estimated_value),
                        "reserved_amount": float(reserved_amount),
                        "status": "pending",
                        "submitted_at": datetime.now(timezone.utc).isoformat()
                    }
                )
                response.raise_for_status()
                data = response.json()
                result = data[0] if isinstance(data, list) else data
                logger.info(f"Created order intention {result['id']} for user {user_id}: {side} {quantity} {symbol}")
                return result

        except httpx.HTTPStatusError as e:
            # Rollback the reservation
            if side == "BUY" and reserved_amount > 0:
                await portfolio_service.release_reserved_cash(user_id, reserved_amount)
            logger.error(f"HTTP error creating intention: {e.response.status_code}")
            raise OrderIntentionError(
                f"Database error: {e.response.status_code}",
                code="DATABASE_ERROR"
            )
        except Exception as e:
            # Rollback the reservation
            if side == "BUY" and reserved_amount > 0:
                await portfolio_service.release_reserved_cash(user_id, reserved_amount)
            logger.error(f"Error creating intention: {e}")
            raise OrderIntentionError(f"Unexpected error: {e}", code="UNKNOWN_ERROR")

    async def cancel_intention(self, user_id: int, intention_id: str) -> bool:
        """
        Cancel a pending order intention.

        Validations:
        - Order belongs to user
        - Order is still pending

        Side effects:
        - BUY: Releases reserved cash

        Args:
            user_id: User ID
            intention_id: Order intention ID (UUID string)

        Returns:
            True if successfully cancelled

        Raises:
            OrderIntentionError: On validation failure
        """
        if not self._configured:
            raise OrderIntentionError("Service not configured", code="NOT_CONFIGURED")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get the intention
                response = await client.get(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={
                        "id": f"eq.{intention_id}",
                        "user_id": f"eq.{user_id}",
                        "select": "*"
                    }
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    raise OrderIntentionError(
                        "Order not found or does not belong to you",
                        code="NOT_FOUND"
                    )

                intention = data[0]

                # Check status
                if intention["status"] != "pending":
                    raise OrderIntentionError(
                        f"Cannot cancel order with status: {intention['status']}",
                        code="INVALID_STATUS",
                        details={"current_status": intention["status"]}
                    )

                # Update status to cancelled
                response = await client.patch(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={"id": f"eq.{intention_id}"},
                    json={
                        "status": "cancelled",
                        "cancelled_at": datetime.now(timezone.utc).isoformat(),
                        "status_message": "Cancelled by user"
                    }
                )
                response.raise_for_status()

                # Release reserved cash for BUY orders
                if intention["side"] == "BUY" and intention.get("reserved_amount"):
                    portfolio_service = get_virtual_portfolio_service()
                    reserved = Decimal(str(intention["reserved_amount"]))
                    await portfolio_service.release_reserved_cash(
                        user_id, reserved, order_id=intention_id
                    )

                logger.info(f"Cancelled order intention {intention_id} for user {user_id}")
                return True

        except OrderIntentionError:
            raise
        except Exception as e:
            logger.error(f"Error cancelling intention: {e}")
            raise OrderIntentionError(f"Failed to cancel: {e}", code="CANCEL_FAILED")

    async def get_intention(self, user_id: int, intention_id: str) -> Optional[dict]:
        """Get a specific order intention for a user."""
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={
                        "id": f"eq.{intention_id}",
                        "user_id": f"eq.{user_id}",
                        "select": "*"
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting intention: {e}")
            return None

    async def get_user_intentions(
        self,
        user_id: int,
        status: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[dict]:
        """
        Get all intentions for a user.

        Args:
            user_id: User ID
            status: Optional status filter (pending, cancelled, filled, etc.)
            limit: Max results
            offset: Pagination offset

        Returns:
            List of order intention records
        """
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "user_id": f"eq.{user_id}",
                    "select": "*",
                    "order": "submitted_at.desc",
                    "limit": limit,
                    "offset": offset
                }

                if status:
                    params["status"] = f"eq.{status}"

                response = await client.get(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                return response.json() or []
        except Exception as e:
            logger.error(f"Error getting user intentions: {e}")
            return []

    async def get_pending_intentions(self) -> List[dict]:
        """
        Get ALL pending intentions across all users.

        Used by batch execution service.

        Returns:
            List of all pending order intentions
        """
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={
                        "status": "eq.pending",
                        "select": "*",
                        "order": "submitted_at.asc"
                    }
                )
                response.raise_for_status()
                return response.json() or []
        except Exception as e:
            logger.error(f"Error getting pending intentions: {e}")
            return []

    async def update_intention_status(
        self,
        intention_id: str,
        status: str,
        message: str = None,
        batch_id: str = None,
        aggregated_order_id: str = None,
        filled_quantity: float = None,
        fill_price: float = None,
        fill_value: float = None
    ) -> bool:
        """
        Update intention status after batch processing.

        Args:
            intention_id: Order intention ID
            status: New status
            message: Status message
            batch_id: Batch execution ID
            aggregated_order_id: Aggregated order ID
            filled_quantity: Filled quantity
            fill_price: Fill price
            fill_value: Total fill value

        Returns:
            True if successful
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                update_data = {"status": status}

                if message:
                    update_data["status_message"] = message
                if batch_id:
                    update_data["batch_id"] = batch_id
                if aggregated_order_id:
                    update_data["aggregated_order_id"] = aggregated_order_id
                if filled_quantity is not None:
                    update_data["filled_quantity"] = filled_quantity
                if fill_price is not None:
                    update_data["fill_price"] = fill_price
                if fill_value is not None:
                    update_data["fill_value"] = fill_value
                if status in ("filled", "partially_filled"):
                    update_data["executed_at"] = datetime.now(timezone.utc).isoformat()

                response = await client.patch(
                    f"{self.base_url}/order_intentions",
                    headers=self.headers,
                    params={"id": f"eq.{intention_id}"},
                    json=update_data
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error updating intention status: {e}")
            return False

    async def get_pending_summary(self) -> dict:
        """
        Get summary of all pending orders for next batch.

        Returns:
            {
                "total_users": int,
                "total_intentions": int,
                "by_symbol": [
                    {"symbol": str, "buy_qty": int, "sell_qty": int, "net_qty": int},
                    ...
                ],
                "estimated_total_value": float
            }
        """
        pending = await self.get_pending_intentions()

        if not pending:
            return {
                "total_users": 0,
                "total_intentions": 0,
                "by_symbol": [],
                "estimated_total_value": 0
            }

        # Aggregate by symbol
        symbol_agg = {}
        user_ids = set()
        total_value = 0

        for intention in pending:
            user_ids.add(intention["user_id"])
            symbol = intention["symbol"]
            quantity = intention["quantity"]
            side = intention["side"]
            value = intention.get("estimated_value", 0) or 0

            if symbol not in symbol_agg:
                symbol_agg[symbol] = {"buy_qty": 0, "sell_qty": 0}

            if side == "BUY":
                symbol_agg[symbol]["buy_qty"] += quantity
                total_value += value
            else:
                symbol_agg[symbol]["sell_qty"] += quantity
                total_value += value

        by_symbol = [
            {
                "symbol": symbol,
                "buy_qty": data["buy_qty"],
                "sell_qty": data["sell_qty"],
                "net_qty": data["buy_qty"] - data["sell_qty"]
            }
            for symbol, data in sorted(symbol_agg.items())
        ]

        return {
            "total_users": len(user_ids),
            "total_intentions": len(pending),
            "by_symbol": by_symbol,
            "estimated_total_value": total_value
        }


# Singleton instance
_order_intention_service: Optional[OrderIntentionService] = None


def get_order_intention_service() -> OrderIntentionService:
    """Get or create OrderIntentionService singleton."""
    global _order_intention_service
    if _order_intention_service is None:
        _order_intention_service = OrderIntentionService()
    return _order_intention_service
