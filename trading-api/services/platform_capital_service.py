"""Platform Capital Service - Tracks broker-level capital vs virtual allocations.

Provides a centralized view of:
- broker_total_equity: total account value at LYNX/IB
- broker_available_cash: liquid cash in the broker account
- assigned_cash_total: sum of all virtual account allocations
- unassigned_cash: broker_available_cash - assigned_cash_total
"""
import httpx
import logging
from config import get_settings

logger = logging.getLogger(__name__)


class PlatformCapitalService:
    """Syncs and reads the platform_capital singleton table."""

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

    async def sync_from_ib(
        self,
        broker_total_equity: float,
        broker_available_cash: float,
        ib_connected: bool = True,
    ) -> dict:
        """Sync platform capital with latest IB data.

        Calls the sync_platform_capital RPC which recomputes assigned_cash_total
        from virtual_accounts and updates the singleton row.
        """
        if not self._configured:
            logger.warning("PlatformCapitalService not configured")
            return {}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.rpc_url}/sync_platform_capital",
                    headers=self.headers,
                    json={
                        "p_broker_total_equity": round(broker_total_equity, 2),
                        "p_broker_available_cash": round(broker_available_cash, 2),
                        "p_ib_connected": ib_connected,
                    },
                )
                if response.status_code >= 400:
                    logger.error(f"sync_platform_capital failed: {response.text}")
                    return {}
                result = response.json()
                logger.debug(f"Platform capital synced: {result}")
                return result if isinstance(result, dict) else {}
        except Exception as e:
            logger.error(f"Error syncing platform capital: {e}")
            return {}

    async def get_platform_capital(self) -> dict:
        """Read the current platform capital snapshot."""
        if not self._configured:
            return {}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.rest_url}/platform_capital",
                    headers=self.headers,
                    params={"id": "eq.1", "select": "*"},
                )
                if response.status_code >= 400:
                    logger.error(f"get_platform_capital failed: {response.text}")
                    return {}
                rows = response.json()
                if rows and len(rows) > 0:
                    row = rows[0]
                    return {
                        "broker_total_equity": float(row.get("broker_total_equity", 0)),
                        "broker_available_cash": float(row.get("broker_available_cash", 0)),
                        "assigned_cash_total": float(row.get("assigned_cash_total", 0)),
                        "unassigned_cash": float(row.get("unassigned_cash", 0)),
                        "ib_connected": row.get("ib_connected", False),
                        "last_synced_at": row.get("last_synced_at"),
                    }
                return {}
        except Exception as e:
            logger.error(f"Error reading platform capital: {e}")
            return {}


# Singleton instance
_platform_capital_service = None


def get_platform_capital_service() -> PlatformCapitalService:
    global _platform_capital_service
    if _platform_capital_service is None:
        _platform_capital_service = PlatformCapitalService()
    return _platform_capital_service
