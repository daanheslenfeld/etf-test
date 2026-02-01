"""Virtual Account Service for multi-account trading.

Manages virtual trading accounts: CRUD, account summaries.
Cash is tracked directly on virtual_accounts (assigned_cash, reserved_cash, available_cash).
All cash mutations go through CashAllocationService (RPC functions).
"""
import httpx
from typing import Optional, List
from config import get_settings
from services.virtual_portfolio_service import get_virtual_portfolio_service
import logging

logger = logging.getLogger(__name__)


class VirtualAccountError(Exception):
    """Custom exception for virtual account errors."""

    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class VirtualAccountService:
    """Service for managing virtual trading accounts.

    Cash fields (assigned_cash, reserved_cash, available_cash) live on the
    virtual_accounts table. Holdings live on virtual_holdings via the
    portfolio service.
    """

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
        if not self._configured:
            logger.warning("VirtualAccountService not configured: missing supabase keys")

    def is_configured(self) -> bool:
        return self._configured

    async def create_account(
        self,
        owner_id: int,
        name: str,
        description: str = None,
    ) -> dict:
        """Create a new virtual trading account.

        Account starts with assigned_cash=0, reserved_cash=0, available_cash=0.
        Also creates the associated virtual_portfolio row for holdings tracking.
        """
        if not self._configured:
            raise VirtualAccountError("Service not configured", code="NOT_CONFIGURED")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/virtual_accounts",
                    headers=self.headers,
                    json={
                        "owner_id": owner_id,
                        "name": name,
                        "description": description
                    }
                )
                response.raise_for_status()
                data = response.json()
                account = data[0] if isinstance(data, list) else data
                account_id = account["id"]

                logger.info(f"Created virtual account {account_id} for user {owner_id}: {name}")

                # Create associated portfolio row (for holdings tracking)
                portfolio_service = get_virtual_portfolio_service()
                await portfolio_service.get_portfolio(owner_id, virtual_account_id=account_id)

                return await self.get_account(account_id, owner_id)

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error creating virtual account: {e.response.status_code}")
            raise VirtualAccountError(
                f"Failed to create account: {e.response.status_code}",
                code="CREATE_FAILED"
            )
        except VirtualAccountError:
            raise
        except Exception as e:
            logger.error(f"Error creating virtual account: {e}")
            raise VirtualAccountError(f"Failed to create account: {e}", code="CREATE_FAILED")

    def _build_account_dict(self, account: dict, holdings_count: int = 0, owner_name: str = None) -> dict:
        """Build standard account response dict from a virtual_accounts row."""
        assigned = float(account.get("assigned_cash", 0))
        reserved = float(account.get("reserved_cash", 0))
        available = float(account.get("available_cash", 0))

        return {
            "id": account["id"],
            "owner_id": account["owner_id"],
            "owner_name": owner_name,
            "name": account["name"],
            "description": account.get("description"),
            "is_active": account["is_active"],
            "is_frozen": account.get("is_frozen", False),
            # New cash model
            "assigned_cash": assigned,
            "reserved_cash": reserved,
            "available_cash": available,
            # Backward compatibility aliases
            "cash_balance": available,
            "reserved_balance": reserved,
            "available_balance": available,
            "holdings_count": holdings_count,
            "created_at": account.get("created_at"),
            "updated_at": account.get("updated_at"),
        }

    async def get_account(self, account_id: str, owner_id: int = None) -> Optional[dict]:
        """Get a virtual account with cash and holdings summary.

        Cash is read directly from virtual_accounts columns.
        Holdings count is fetched from virtual_portfolio_service.
        """
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"id": f"eq.{account_id}", "select": "*"}
                if owner_id is not None:
                    params["owner_id"] = f"eq.{owner_id}"

                response = await client.get(
                    f"{self.base_url}/virtual_accounts",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return None

                account = data[0]

                # Get holdings count
                portfolio_service = get_virtual_portfolio_service()
                holdings = await portfolio_service.get_holdings(
                    account["owner_id"],
                    virtual_account_id=account_id
                )

                return self._build_account_dict(account, holdings_count=len(holdings))

        except Exception as e:
            logger.error(f"Error getting virtual account {account_id}: {e}")
            return None

    async def get_accounts(self, owner_id: int) -> List[dict]:
        """List all active virtual accounts for a user."""
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/virtual_accounts",
                    headers=self.headers,
                    params={
                        "owner_id": f"eq.{owner_id}",
                        "is_active": "eq.true",
                        "select": "*",
                        "order": "created_at.asc"
                    }
                )
                response.raise_for_status()
                accounts = response.json() or []

                result = []
                portfolio_service = get_virtual_portfolio_service()
                for account in accounts:
                    holdings = await portfolio_service.get_holdings(
                        owner_id,
                        virtual_account_id=account["id"]
                    )
                    result.append(self._build_account_dict(account, holdings_count=len(holdings)))

                return result

        except Exception as e:
            logger.error(f"Error listing virtual accounts for user {owner_id}: {e}")
            return []

    async def get_all_accounts(self) -> List[dict]:
        """List ALL active virtual accounts (admin view) with owner names."""
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/virtual_accounts",
                    headers=self.headers,
                    params={
                        "is_active": "eq.true",
                        "select": "*",
                        "order": "created_at.asc"
                    }
                )
                response.raise_for_status()
                accounts = response.json() or []

                # Fetch owner names from customers table
                owner_ids = list({a["owner_id"] for a in accounts})
                owner_names = {}
                if owner_ids:
                    names_response = await client.get(
                        f"{self.base_url}/customers",
                        headers=self.headers,
                        params={
                            "id": f"in.({','.join(str(oid) for oid in owner_ids)})",
                            "select": "id,first_name,last_name"
                        }
                    )
                    if names_response.status_code == 200:
                        for c in (names_response.json() or []):
                            first = c.get("first_name") or ""
                            last = c.get("last_name") or ""
                            owner_names[c["id"]] = f"{first} {last}".strip() or None

                result = []
                portfolio_service = get_virtual_portfolio_service()
                for account in accounts:
                    try:
                        holdings = await portfolio_service.get_holdings(
                            account["owner_id"],
                            virtual_account_id=account["id"]
                        )
                        holdings_count = len(holdings)
                    except Exception:
                        holdings_count = 0

                    result.append(self._build_account_dict(
                        account,
                        holdings_count=holdings_count,
                        owner_name=owner_names.get(account["owner_id"]),
                    ))

                return result

        except Exception as e:
            logger.error(f"Error listing all virtual accounts: {e}")
            return []

    async def deactivate_account(self, account_id: str, owner_id: int) -> bool:
        """Soft-delete a virtual account (set is_active=false)."""
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(
                    f"{self.base_url}/virtual_accounts",
                    headers=self.headers,
                    params={
                        "id": f"eq.{account_id}",
                        "owner_id": f"eq.{owner_id}"
                    },
                    json={"is_active": False}
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return False

                logger.info(f"Deactivated virtual account {account_id}")
                return True

        except Exception as e:
            logger.error(f"Error deactivating virtual account {account_id}: {e}")
            return False

    async def get_total_allocated_cash(self) -> float:
        """Get the sum of assigned_cash across all active virtual accounts."""
        if not self._configured:
            return 0.0

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/virtual_accounts",
                    headers=self.headers,
                    params={
                        "is_active": "eq.true",
                        "select": "assigned_cash"
                    }
                )
                response.raise_for_status()
                rows = response.json() or []
                return sum(float(r.get("assigned_cash", 0)) for r in rows)
        except Exception as e:
            logger.error(f"Error getting total allocated cash: {e}")
            return 0.0


# Singleton
_virtual_account_service: Optional[VirtualAccountService] = None


def get_virtual_account_service() -> VirtualAccountService:
    global _virtual_account_service
    if _virtual_account_service is None:
        _virtual_account_service = VirtualAccountService()
    return _virtual_account_service
