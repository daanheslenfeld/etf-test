"""Cash Allocation Service - Transactional cash operations via Supabase RPC.

All cash mutations go through PostgreSQL stored procedures for atomicity
and row-level locking. This replaces the non-transactional cash methods
in virtual_portfolio_service.py.
"""
import httpx
from decimal import Decimal
from typing import Optional
from config import get_settings
import logging

logger = logging.getLogger(__name__)


class CashAllocationError(Exception):
    """Raised when a cash allocation operation fails."""

    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class CashAllocationService:
    """Transactional cash allocation via Supabase RPC functions.

    Every cash mutation (allocate, reserve, fill, cancel, sell-credit) calls a
    PostgreSQL function that uses SELECT ... FOR UPDATE to prevent race conditions.
    """

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.supabase_url
        self.rpc_url = f"{self.base_url}/rest/v1/rpc"
        self.rest_url = f"{self.base_url}/rest/v1"
        api_key = settings.supabase_service_role_key or settings.supabase_key
        self.headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        self._configured = bool(api_key)
        if not self._configured:
            logger.warning("CashAllocationService not configured: missing supabase keys")

    async def _call_rpc(self, function_name: str, params: dict) -> dict:
        """Call a Supabase RPC function and return the JSONB result."""
        if not self._configured:
            raise CashAllocationError("Service not configured", code="NOT_CONFIGURED")

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.rpc_url}/{function_name}",
                headers=self.headers,
                json=params,
            )
            if response.status_code >= 400:
                error_text = response.text
                logger.error(f"RPC {function_name} failed ({response.status_code}): {error_text}")
                raise CashAllocationError(
                    f"RPC call failed: {error_text}",
                    code="RPC_ERROR",
                    details={"status": response.status_code, "body": error_text},
                )
            return response.json()

    # =========================================================================
    # ADMIN OPERATIONS
    # =========================================================================

    async def admin_allocate(
        self,
        account_id: str,
        admin_id: int,
        delta: float,
        lynx_cash: float,
        description: str = None,
    ) -> dict:
        """Admin allocate (+delta) or deallocate (-delta) cash.

        Args:
            account_id: Virtual account UUID
            admin_id: Admin's customer_id
            delta: Positive to allocate, negative to deallocate
            lynx_cash: Current LYNX real cash (for global ceiling check)
            description: Optional audit description

        Returns:
            {success, assigned_cash, reserved_cash, available_cash}

        Raises:
            CashAllocationError: On validation failure or DB error
        """
        result = await self._call_rpc("admin_allocate_cash", {
            "p_account_id": account_id,
            "p_admin_id": admin_id,
            "p_delta": round(delta, 2),
            "p_lynx_cash": round(lynx_cash, 2),
            "p_description": description,
        })

        if not result.get("success"):
            raise CashAllocationError(
                result.get("error", "Allocation failed"),
                code="ALLOCATION_FAILED",
            )

        logger.info(
            f"Admin {admin_id} {'allocated' if delta > 0 else 'deallocated'} "
            f"{abs(delta):.2f} EUR on account {account_id}"
        )
        return result

    # =========================================================================
    # ORDER LIFECYCLE OPERATIONS
    # =========================================================================

    async def reserve_for_order(
        self,
        account_id: str,
        amount: float,
        order_intention_id: str = None,
    ) -> dict:
        """Reserve cash for a BUY order submission.

        Atomically: available -= amount, reserved += amount.

        Raises:
            CashAllocationError: If insufficient available cash or account frozen.
        """
        result = await self._call_rpc("reserve_order_cash", {
            "p_account_id": account_id,
            "p_amount": round(amount, 2),
            "p_order_intention_id": order_intention_id,
        })

        if not result.get("success"):
            raise CashAllocationError(
                result.get("error", "Reserve failed"),
                code="RESERVE_FAILED",
            )

        logger.info(f"Reserved {amount:.2f} EUR on account {account_id}")
        return result

    async def settle_buy(
        self,
        account_id: str,
        reserved_amount: float,
        actual_cost: float,
        order_intention_id: str = None,
    ) -> dict:
        """Settle a BUY fill.

        Atomically: reserved -= reserved_amount, available += excess.
        If invariant violation detected, account is frozen.

        Raises:
            CashAllocationError: On invariant violation or DB error.
        """
        result = await self._call_rpc("settle_buy_fill", {
            "p_account_id": account_id,
            "p_reserved_amount": round(reserved_amount, 2),
            "p_actual_cost": round(actual_cost, 2),
            "p_order_intention_id": order_intention_id,
        })

        if not result.get("success"):
            raise CashAllocationError(
                result.get("error", "Buy settle failed"),
                code="SETTLE_FAILED",
            )

        excess = result.get("excess_returned", 0)
        logger.info(
            f"Settled buy on account {account_id}: "
            f"cost={actual_cost:.2f}, reserved={reserved_amount:.2f}, excess={excess:.2f}"
        )
        return result

    async def cancel_order(
        self,
        account_id: str,
        reserved_amount: float,
        order_intention_id: str = None,
    ) -> dict:
        """Release reserved cash on order cancel/reject.

        Atomically: reserved -= amount, available += amount.
        """
        result = await self._call_rpc("cancel_order_cash", {
            "p_account_id": account_id,
            "p_reserved_amount": round(reserved_amount, 2),
            "p_order_intention_id": order_intention_id,
        })

        if not result.get("success"):
            raise CashAllocationError(
                result.get("error", "Cancel release failed"),
                code="CANCEL_FAILED",
            )

        logger.info(f"Released {reserved_amount:.2f} EUR on account {account_id}")
        return result

    async def credit_sell(
        self,
        account_id: str,
        proceeds: float,
        order_intention_id: str = None,
    ) -> dict:
        """Credit sell proceeds to available cash.

        Atomically: available += proceeds.
        """
        result = await self._call_rpc("credit_sell_proceeds", {
            "p_account_id": account_id,
            "p_proceeds": round(proceeds, 2),
            "p_order_intention_id": order_intention_id,
        })

        if not result.get("success"):
            raise CashAllocationError(
                result.get("error", "Sell credit failed"),
                code="CREDIT_FAILED",
            )

        logger.info(f"Credited {proceeds:.2f} EUR sell proceeds on account {account_id}")
        return result

    # =========================================================================
    # READ OPERATIONS
    # =========================================================================

    async def get_account_cash(self, account_id: str) -> Optional[dict]:
        """Read current cash state of an account."""
        if not self._configured:
            return None

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.rest_url}/virtual_accounts",
                headers=self.headers,
                params={
                    "id": f"eq.{account_id}",
                    "select": "id,owner_id,name,is_active,is_frozen,assigned_cash,reserved_cash,available_cash",
                },
            )
            response.raise_for_status()
            data = response.json()
            return data[0] if data else None

    async def get_global_cash_summary(self) -> dict:
        """Sum of cash fields across all active accounts."""
        if not self._configured:
            return {"total_assigned": 0, "total_reserved": 0, "total_available": 0}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.rest_url}/virtual_accounts",
                headers=self.headers,
                params={
                    "is_active": "eq.true",
                    "select": "assigned_cash,reserved_cash,available_cash",
                },
            )
            response.raise_for_status()
            rows = response.json() or []

            return {
                "total_assigned": sum(float(r.get("assigned_cash", 0)) for r in rows),
                "total_reserved": sum(float(r.get("reserved_cash", 0)) for r in rows),
                "total_available": sum(float(r.get("available_cash", 0)) for r in rows),
            }

    async def get_allocation_log(
        self, account_id: str, limit: int = 50, offset: int = 0
    ) -> list:
        """Get cash allocation audit log for an account."""
        if not self._configured:
            return []

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.rest_url}/cash_allocation_log",
                headers=self.headers,
                params={
                    "virtual_account_id": f"eq.{account_id}",
                    "select": "*",
                    "order": "created_at.desc",
                    "limit": limit,
                    "offset": offset,
                },
            )
            response.raise_for_status()
            return response.json() or []


# Singleton
_cash_allocation_service: Optional[CashAllocationService] = None


def get_cash_allocation_service() -> CashAllocationService:
    global _cash_allocation_service
    if _cash_allocation_service is None:
        _cash_allocation_service = CashAllocationService()
    return _cash_allocation_service
