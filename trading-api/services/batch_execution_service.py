"""Batch Execution Service for batch trading system.

Orchestrates batch order aggregation, execution via IB Gateway, and fill allocation.
"""
import httpx
from decimal import Decimal
from typing import Optional, List, Dict
from datetime import datetime, timezone
from collections import defaultdict
from config import get_settings
from services.order_intention_service import get_order_intention_service
from services.virtual_portfolio_service import get_virtual_portfolio_service
import logging
import math

logger = logging.getLogger(__name__)


class BatchExecutionError(Exception):
    """Custom exception for batch execution errors."""

    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class BatchExecutionService:
    """Service for orchestrating batch order execution."""

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
            logger.warning("BatchExecutionService not configured: missing supabase keys")

    def is_configured(self) -> bool:
        """Check if service is properly configured."""
        return self._configured

    # =========================================================================
    # BATCH MANAGEMENT
    # =========================================================================

    async def create_batch(self, scheduled_at: datetime = None) -> dict:
        """
        Create a new batch execution record.

        Args:
            scheduled_at: Scheduled execution time (default: now)

        Returns:
            Created batch record with ID
        """
        if not self._configured:
            raise BatchExecutionError("Service not configured", code="NOT_CONFIGURED")

        if scheduled_at is None:
            scheduled_at = datetime.now(timezone.utc)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/batch_executions",
                    headers=self.headers,
                    json={
                        "scheduled_at": scheduled_at.isoformat(),
                        "status": "pending"
                    }
                )
                response.raise_for_status()
                data = response.json()
                result = data[0] if isinstance(data, list) else data
                logger.info(f"Created batch execution {result['id']}")
                return result

        except Exception as e:
            logger.error(f"Error creating batch: {e}")
            raise BatchExecutionError(f"Failed to create batch: {e}", code="CREATE_FAILED")

    async def get_batch(self, batch_id: str) -> Optional[dict]:
        """Get a batch execution record."""
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/batch_executions",
                    headers=self.headers,
                    params={"id": f"eq.{batch_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting batch: {e}")
            return None

    async def update_batch_status(
        self,
        batch_id: str,
        status: str,
        error_message: str = None,
        stats: dict = None
    ) -> bool:
        """Update batch execution status."""
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                update_data = {"status": status}

                if status == "running":
                    update_data["started_at"] = datetime.now(timezone.utc).isoformat()
                elif status in ("completed", "failed", "partial"):
                    update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

                if error_message:
                    update_data["error_message"] = error_message

                if stats:
                    update_data.update(stats)

                response = await client.patch(
                    f"{self.base_url}/batch_executions",
                    headers=self.headers,
                    params={"id": f"eq.{batch_id}"},
                    json=update_data
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error updating batch status: {e}")
            return False

    # =========================================================================
    # ORDER AGGREGATION
    # =========================================================================

    async def aggregate_orders(self, batch_id: str) -> List[dict]:
        """
        Aggregate pending intentions into orders by symbol and side.

        Process:
        1. Get all pending intentions
        2. Group by (symbol, side)
        3. Create aggregated_order records
        4. Update intentions with batch_id and status='aggregated'

        Args:
            batch_id: Batch execution ID

        Returns:
            List of aggregated orders to execute
        """
        intention_service = get_order_intention_service()

        # Get all pending intentions
        pending = await intention_service.get_pending_intentions()

        if not pending:
            logger.info("No pending intentions to aggregate")
            await self.update_batch_status(batch_id, "completed", stats={
                "total_intentions": 0,
                "total_aggregated_orders": 0,
                "total_users": 0
            })
            return []

        # Group by (symbol, conid, side)
        groups: Dict[tuple, List[dict]] = defaultdict(list)
        user_ids = set()

        for intention in pending:
            key = (intention["symbol"], intention["conid"], intention["side"])
            groups[key].append(intention)
            user_ids.add(intention["user_id"])

        aggregated_orders = []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for (symbol, conid, side), intentions in groups.items():
                    total_quantity = sum(i["quantity"] for i in intentions)

                    # Create aggregated order record
                    response = await client.post(
                        f"{self.base_url}/aggregated_orders",
                        headers=self.headers,
                        json={
                            "batch_id": batch_id,
                            "symbol": symbol,
                            "conid": conid,
                            "side": side,
                            "total_quantity": total_quantity
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    agg_order = data[0] if isinstance(data, list) else data

                    # Update intentions with batch_id and aggregated_order_id
                    for intention in intentions:
                        await intention_service.update_intention_status(
                            intention_id=intention["id"],
                            status="aggregated",
                            batch_id=batch_id,
                            aggregated_order_id=agg_order["id"]
                        )

                    agg_order["intentions"] = intentions
                    aggregated_orders.append(agg_order)
                    logger.info(f"Aggregated {len(intentions)} intentions for {side} {total_quantity} {symbol}")

                # Update batch stats
                total_value = sum(
                    i.get("estimated_value", 0) or 0
                    for intentions in groups.values()
                    for i in intentions
                )

                await self.update_batch_status(batch_id, "running", stats={
                    "total_intentions": len(pending),
                    "total_aggregated_orders": len(aggregated_orders),
                    "total_users": len(user_ids),
                    "total_value": total_value
                })

        except Exception as e:
            logger.error(f"Error aggregating orders: {e}")
            await self.update_batch_status(batch_id, "failed", error_message=str(e))
            raise BatchExecutionError(f"Aggregation failed: {e}", code="AGGREGATION_FAILED")

        return aggregated_orders

    # =========================================================================
    # ORDER EXECUTION
    # =========================================================================

    async def execute_batch(self, batch_id: str) -> dict:
        """
        Execute all aggregated orders via IB Gateway.

        For each aggregated order:
        1. Place order via IB Gateway
        2. Wait for fill
        3. Record fill details
        4. Allocate fills to users

        Args:
            batch_id: Batch execution ID

        Returns:
            Execution summary
        """
        from services.ib_client import get_ib_client

        ib_client = get_ib_client()

        # Check IB connection
        if not ib_client.is_connected():
            logger.error("IB Gateway not connected, cannot execute batch")
            await self.update_batch_status(batch_id, "failed", error_message="IB Gateway not connected")
            raise BatchExecutionError("IB Gateway not connected", code="NOT_CONNECTED")

        # Aggregate orders first
        aggregated_orders = await self.aggregate_orders(batch_id)

        if not aggregated_orders:
            return {
                "batch_id": batch_id,
                "status": "completed",
                "orders_executed": 0,
                "fills": []
            }

        successful = 0
        partial = 0
        failed = 0
        results = []

        for agg_order in aggregated_orders:
            try:
                result = await self._execute_single_order(ib_client, agg_order)

                if result["status"] == "filled":
                    successful += 1
                    # Allocate fills to users
                    await self.allocate_fills(
                        aggregated_order_id=agg_order["id"],
                        intentions=agg_order["intentions"],
                        fill_price=result["fill_price"],
                        filled_quantity=result["filled_quantity"]
                    )
                elif result["status"] == "partial":
                    partial += 1
                    await self.allocate_fills(
                        aggregated_order_id=agg_order["id"],
                        intentions=agg_order["intentions"],
                        fill_price=result["fill_price"],
                        filled_quantity=result["filled_quantity"]
                    )
                else:
                    failed += 1
                    # Mark intentions as rejected
                    await self._reject_intentions(agg_order["intentions"], result.get("error", "Order rejected"))

                results.append(result)

            except Exception as e:
                logger.error(f"Error executing order {agg_order['id']}: {e}")
                failed += 1
                await self._reject_intentions(agg_order["intentions"], str(e))
                results.append({
                    "aggregated_order_id": agg_order["id"],
                    "status": "failed",
                    "error": str(e)
                })

        # Determine final batch status
        if failed == len(aggregated_orders):
            final_status = "failed"
        elif failed > 0 or partial > 0:
            final_status = "partial"
        else:
            final_status = "completed"

        await self.update_batch_status(batch_id, final_status, stats={
            "successful_fills": successful,
            "partial_fills": partial,
            "failed_orders": failed
        })

        return {
            "batch_id": batch_id,
            "status": final_status,
            "orders_executed": len(aggregated_orders),
            "successful": successful,
            "partial": partial,
            "failed": failed,
            "results": results
        }

    async def _execute_single_order(self, ib_client, agg_order: dict) -> dict:
        """Execute a single aggregated order via IB Gateway."""
        symbol = agg_order["symbol"]
        conid = agg_order["conid"]
        side = agg_order["side"]
        quantity = agg_order["total_quantity"]

        logger.info(f"Executing {side} {quantity} {symbol} (conid={conid})")

        try:
            # Update aggregated order with submitted timestamp
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.patch(
                    f"{self.base_url}/aggregated_orders",
                    headers=self.headers,
                    params={"id": f"eq.{agg_order['id']}"},
                    json={"submitted_at": datetime.now(timezone.utc).isoformat()}
                )

            # Place order via IB Gateway
            order_result = await ib_client.place_order(
                symbol=symbol,
                conid=conid,
                side=side.lower(),
                quantity=quantity,
                order_type="MKT"
            )

            if order_result.get("error"):
                return {
                    "aggregated_order_id": agg_order["id"],
                    "status": "failed",
                    "error": order_result["error"]
                }

            ib_order_id = order_result.get("orderId")
            fill_price = order_result.get("avgPrice") or order_result.get("lastFillPrice")
            filled_quantity = order_result.get("filledQuantity", quantity)

            # Update aggregated order with fill details
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.patch(
                    f"{self.base_url}/aggregated_orders",
                    headers=self.headers,
                    params={"id": f"eq.{agg_order['id']}"},
                    json={
                        "ib_order_id": str(ib_order_id),
                        "ib_status": "Filled",
                        "filled_quantity": filled_quantity,
                        "avg_fill_price": fill_price,
                        "total_fill_value": fill_price * filled_quantity if fill_price else None,
                        "filled_at": datetime.now(timezone.utc).isoformat()
                    }
                )

            status = "filled" if filled_quantity >= quantity else "partial"

            return {
                "aggregated_order_id": agg_order["id"],
                "status": status,
                "ib_order_id": ib_order_id,
                "filled_quantity": filled_quantity,
                "fill_price": fill_price,
                "total_value": fill_price * filled_quantity if fill_price else None
            }

        except Exception as e:
            logger.error(f"Error placing order: {e}")
            return {
                "aggregated_order_id": agg_order["id"],
                "status": "failed",
                "error": str(e)
            }

    async def _reject_intentions(self, intentions: List[dict], reason: str):
        """Reject all intentions in a list."""
        intention_service = get_order_intention_service()
        portfolio_service = get_virtual_portfolio_service()

        for intention in intentions:
            # Update status
            await intention_service.update_intention_status(
                intention_id=intention["id"],
                status="rejected",
                message=reason
            )

            # Release reserved cash for BUY orders
            if intention["side"] == "BUY" and intention.get("reserved_amount"):
                await portfolio_service.release_reserved_cash(
                    user_id=intention["user_id"],
                    amount=Decimal(str(intention["reserved_amount"])),
                    order_id=intention["id"]
                )

    # =========================================================================
    # FILL ALLOCATION
    # =========================================================================

    async def allocate_fills(
        self,
        aggregated_order_id: str,
        intentions: List[dict],
        fill_price: float,
        filled_quantity: int
    ) -> List[dict]:
        """
        Distribute fills to individual users pro-rata.

        Algorithm:
        1. Calculate each user's percentage: user_qty / total_qty
        2. Allocate filled shares proportionally
        3. Handle rounding (favor smaller orders first)
        4. Update user portfolios

        Args:
            aggregated_order_id: Aggregated order ID
            intentions: List of user intentions
            fill_price: Actual fill price
            filled_quantity: Total filled quantity

        Returns:
            List of fill allocation records
        """
        if not intentions or filled_quantity <= 0 or fill_price is None:
            return []

        total_requested = sum(i["quantity"] for i in intentions)
        fill_ratio = Decimal(filled_quantity) / Decimal(total_requested)

        # Sort by quantity ascending (smaller orders get rounding favor)
        sorted_intentions = sorted(intentions, key=lambda x: x["quantity"])

        allocations = []
        remaining = filled_quantity
        fill_price_decimal = Decimal(str(fill_price))

        intention_service = get_order_intention_service()
        portfolio_service = get_virtual_portfolio_service()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for i, intention in enumerate(sorted_intentions):
                    user_id = intention["user_id"]
                    requested = intention["quantity"]

                    # Calculate allocation
                    if i == len(sorted_intentions) - 1:
                        # Last user gets remainder
                        allocated = remaining
                    else:
                        # Pro-rata with floor rounding
                        allocated = int(math.floor(Decimal(requested) * fill_ratio))

                    remaining -= allocated
                    allocation_pct = Decimal(allocated) / Decimal(total_requested)
                    total_cost = fill_price_decimal * Decimal(allocated)

                    # Create fill allocation record
                    response = await client.post(
                        f"{self.base_url}/fill_allocations",
                        headers=self.headers,
                        json={
                            "aggregated_order_id": aggregated_order_id,
                            "order_intention_id": intention["id"],
                            "user_id": user_id,
                            "requested_quantity": requested,
                            "allocated_quantity": allocated,
                            "allocation_percentage": float(allocation_pct),
                            "fill_price": float(fill_price_decimal),
                            "total_cost": float(total_cost),
                            "applied_to_portfolio": False
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    allocation = data[0] if isinstance(data, list) else data

                    # Update intention with fill details
                    status = "filled" if allocated >= requested else "partially_filled"
                    await intention_service.update_intention_status(
                        intention_id=intention["id"],
                        status=status,
                        filled_quantity=allocated,
                        fill_price=float(fill_price_decimal),
                        fill_value=float(total_cost)
                    )

                    # Apply to portfolio
                    await self._apply_allocation_to_portfolio(
                        user_id=user_id,
                        intention=intention,
                        allocated_quantity=allocated,
                        fill_price=fill_price_decimal,
                        total_cost=total_cost,
                        allocation_id=allocation["id"]
                    )

                    allocation["applied_to_portfolio"] = True
                    allocations.append(allocation)

                    logger.info(
                        f"Allocated {allocated}/{requested} shares of {intention['symbol']} "
                        f"to user {user_id} at {fill_price}"
                    )

        except Exception as e:
            logger.error(f"Error allocating fills: {e}")
            raise BatchExecutionError(f"Allocation failed: {e}", code="ALLOCATION_FAILED")

        return allocations

    async def _apply_allocation_to_portfolio(
        self,
        user_id: int,
        intention: dict,
        allocated_quantity: int,
        fill_price: Decimal,
        total_cost: Decimal,
        allocation_id: str
    ):
        """Apply a fill allocation to a user's virtual portfolio."""
        portfolio_service = get_virtual_portfolio_service()

        symbol = intention["symbol"]
        conid = intention["conid"]
        side = intention["side"]
        reserved = Decimal(str(intention.get("reserved_amount", 0)))

        if side == "BUY":
            # Deduct cost from cash (from reserved)
            await portfolio_service.deduct_cash(
                user_id=user_id,
                amount=total_cost,
                from_reserved=True,
                order_id=intention["id"],
                description=f"Buy {allocated_quantity} {symbol} @ {fill_price}"
            )

            # Release excess reserved cash
            excess = reserved - total_cost
            if excess > 0:
                await portfolio_service.release_reserved_cash(
                    user_id=user_id,
                    amount=excess,
                    order_id=intention["id"]
                )

            # Add shares to holdings
            await portfolio_service.add_holding(
                user_id=user_id,
                symbol=symbol,
                conid=conid,
                quantity=Decimal(allocated_quantity),
                cost_basis=fill_price,
                isin=intention.get("isin"),
                name=intention.get("name")
            )

        elif side == "SELL":
            # Remove shares from holdings
            cost_basis = await portfolio_service.remove_holding(
                user_id=user_id,
                symbol=symbol,
                quantity=Decimal(allocated_quantity)
            )

            # Credit cash to portfolio
            await portfolio_service.credit_cash(
                user_id=user_id,
                amount=total_cost,
                order_id=intention["id"],
                description=f"Sell {allocated_quantity} {symbol} @ {fill_price}"
            )

        # Mark allocation as applied
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.patch(
                    f"{self.base_url}/fill_allocations",
                    headers=self.headers,
                    params={"id": f"eq.{allocation_id}"},
                    json={
                        "applied_to_portfolio": True,
                        "applied_at": datetime.now(timezone.utc).isoformat()
                    }
                )
        except Exception as e:
            logger.error(f"Error updating allocation applied status: {e}")

    # =========================================================================
    # BATCH HISTORY
    # =========================================================================

    async def get_batch_history(self, limit: int = 10) -> List[dict]:
        """Get recent batch executions."""
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/batch_executions",
                    headers=self.headers,
                    params={
                        "select": "*",
                        "order": "created_at.desc",
                        "limit": limit
                    }
                )
                response.raise_for_status()
                return response.json() or []
        except Exception as e:
            logger.error(f"Error getting batch history: {e}")
            return []

    async def get_last_batch(self) -> Optional[dict]:
        """Get the most recent batch execution."""
        history = await self.get_batch_history(limit=1)
        return history[0] if history else None


# Singleton instance
_batch_execution_service: Optional[BatchExecutionService] = None


def get_batch_execution_service() -> BatchExecutionService:
    """Get or create BatchExecutionService singleton."""
    global _batch_execution_service
    if _batch_execution_service is None:
        _batch_execution_service = BatchExecutionService()
    return _batch_execution_service
