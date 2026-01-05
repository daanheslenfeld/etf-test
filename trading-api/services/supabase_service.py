"""Supabase database service."""
from supabase import create_client, Client
from config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for interacting with Supabase database."""

    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )

    async def get_customer_by_id(self, customer_id: int) -> Optional[dict]:
        """Get customer by ID."""
        try:
            response = self.client.table("customers").select("*").eq("id", customer_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching customer {customer_id}: {e}")
            return None

    async def get_broker_account(self, customer_id: int, broker: str = "LYNX") -> Optional[dict]:
        """Get linked broker account for a customer."""
        try:
            response = (
                self.client.table("broker_accounts")
                .select("*")
                .eq("customer_id", customer_id)
                .eq("broker", broker)
                .single()
                .execute()
            )
            return response.data
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
            response = (
                self.client.table("broker_accounts")
                .upsert({
                    "customer_id": customer_id,
                    "broker": broker,
                    "account_id": account_id,
                    "account_type": account_type,
                    "status": "pending"
                }, on_conflict="customer_id,broker")
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error linking broker account: {e}")
            return None

    async def update_trading_status(self, customer_id: int, status: str) -> bool:
        """Update customer trading status."""
        try:
            self.client.table("customers").update({
                "trading_status": status
            }).eq("id", customer_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating trading status: {e}")
            return False

    async def get_all_customers_for_admin(self) -> list[dict]:
        """Get all customers with their trading status and broker accounts."""
        try:
            response = (
                self.client.table("customers")
                .select("id, first_name, last_name, email, trading_status, role, created_at")
                .order("created_at", desc=True)
                .execute()
            )
            return response.data or []
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
