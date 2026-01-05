"""Supabase database service using direct HTTP calls."""
import httpx
from config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for interacting with Supabase database via REST API."""

    def __init__(self):
        settings = get_settings()
        self.base_url = f"{settings.supabase_url}/rest/v1"
        self.headers = {
            "apikey": settings.supabase_key,
            "Authorization": f"Bearer {settings.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def get_customer_by_id(self, customer_id: int) -> Optional[dict]:
        """Get customer by ID."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/customers",
                    headers=self.headers,
                    params={"id": f"eq.{customer_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error fetching customer {customer_id}: {e}")
            return None

    async def get_broker_account(self, customer_id: int, broker: str = "LYNX") -> Optional[dict]:
        """Get linked broker account for a customer."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/broker_accounts",
                    headers=self.headers,
                    params={
                        "customer_id": f"eq.{customer_id}",
                        "broker": f"eq.{broker}",
                        "select": "*"
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.debug(f"No broker account found for customer {customer_id}: {e}")
            return None

    async def link_broker_account(
        self,
        customer_id: int,
        account_id: str,
        broker: str = "LYNX",
        account_type: str = "paper"
    ) -> Optional[dict]:
        """Link a broker account to a customer."""
        try:
            async with httpx.AsyncClient() as client:
                # First check if account exists
                existing = await self.get_broker_account(customer_id, broker)

                if existing:
                    # Update existing
                    response = await client.patch(
                        f"{self.base_url}/broker_accounts",
                        headers=self.headers,
                        params={"id": f"eq.{existing['id']}"},
                        json={
                            "account_id": account_id,
                            "account_type": account_type,
                            "status": "pending"
                        }
                    )
                else:
                    # Insert new
                    response = await client.post(
                        f"{self.base_url}/broker_accounts",
                        headers=self.headers,
                        json={
                            "customer_id": customer_id,
                            "broker": broker,
                            "account_id": account_id,
                            "account_type": account_type,
                            "status": "pending"
                        }
                    )

                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error linking broker account: {e}")
            return None

    async def update_trading_status(self, customer_id: int, status: str) -> bool:
        """Update customer trading status."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/customers",
                    headers=self.headers,
                    params={"id": f"eq.{customer_id}"},
                    json={"trading_status": status}
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error updating trading status: {e}")
            return False

    async def get_all_customers_for_admin(self) -> list[dict]:
        """Get all customers with their trading status and broker accounts."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/customers",
                    headers=self.headers,
                    params={
                        "select": "id,first_name,last_name,email,trading_status,role,created_at",
                        "order": "created_at.desc"
                    }
                )
                response.raise_for_status()
                return response.json() or []
        except Exception as e:
            logger.error(f"Error fetching customers: {e}")
            return []


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service singleton."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
