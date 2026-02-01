"""Supabase database service using direct HTTP calls."""
import httpx
from config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SupabaseServiceError(Exception):
    """Custom exception for Supabase service errors."""

    def __init__(self, message: str, status_code: int = None, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class SupabaseService:
    """Service for interacting with Supabase database via REST API."""

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
            logger.warning("Supabase service not configured: missing supabase_key")
        elif not settings.supabase_service_role_key:
            logger.warning("Supabase service using anon key - RLS may block broker_links operations")

    def is_configured(self) -> bool:
        """Check if Supabase service is properly configured."""
        return self._configured

    async def get_customer_by_id(self, customer_id: int) -> Optional[dict]:
        """Get customer by ID."""
        if not self._configured:
            logger.debug("Supabase not configured, returning None for customer lookup")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/customers",
                    headers=self.headers,
                    params={"id": f"eq.{customer_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching customer {customer_id}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching customer {customer_id}: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Error fetching customer {customer_id}: {type(e).__name__}: {e}")
            return None

    async def get_broker_account(self, customer_id: int, broker: str = "LYNX") -> Optional[dict]:
        """Get linked broker account for a customer."""
        if not self._configured:
            logger.debug("Supabase not configured, returning None for broker account lookup")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
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
        except httpx.TimeoutException:
            logger.debug(f"Timeout getting broker account for customer {customer_id}")
            return None
        except httpx.HTTPStatusError as e:
            logger.debug(f"HTTP error getting broker account for customer {customer_id}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.debug(f"No broker account found for customer {customer_id}: {type(e).__name__}: {e}")
            return None

    async def link_broker_account(
        self,
        customer_id: int,
        account_id: str,
        broker: str = "LYNX",
        account_type: str = "paper"
    ) -> Optional[dict]:
        """
        Link a broker account to a customer.

        Args:
            customer_id: The customer's database ID
            account_id: The IB account ID (e.g., "DU0521473")
            broker: The broker name (default: "LYNX")
            account_type: "paper" or "live"

        Returns:
            The created/updated broker account record, or None on failure

        Raises:
            SupabaseServiceError: On database errors with detailed information
        """
        if not self._configured:
            logger.warning("Supabase not configured - cannot link broker account to database")
            # Return a mock response for dev mode
            return {
                "id": None,
                "customer_id": customer_id,
                "account_id": account_id,
                "broker": broker,
                "account_type": account_type,
                "status": "dev_mode"
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # First check if account exists for this customer
                existing = await self.get_broker_account(customer_id, broker)

                if existing:
                    # Update existing record
                    logger.info(f"Updating existing broker account {existing['id']} for customer {customer_id}")
                    response = await client.patch(
                        f"{self.base_url}/broker_accounts",
                        headers=self.headers,
                        params={"id": f"eq.{existing['id']}"},
                        json={
                            "account_id": account_id,
                            "account_type": account_type,
                            "status": "active"  # Reactivate if updating
                        }
                    )
                else:
                    # Insert new record
                    logger.info(f"Creating new broker account for customer {customer_id}: {account_id}")
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

                # Check response status
                if response.status_code >= 400:
                    error_text = response.text
                    logger.error(f"Failed to link broker account: HTTP {response.status_code}: {error_text}")

                    # Try to parse error details
                    error_details = {}
                    try:
                        error_details = response.json()
                    except Exception:
                        error_details = {"raw": error_text}

                    # Check for specific error types
                    if response.status_code == 409 or "duplicate" in error_text.lower():
                        raise SupabaseServiceError(
                            f"Broker account already exists for this customer",
                            status_code=response.status_code,
                            details=error_details
                        )
                    elif response.status_code == 400:
                        raise SupabaseServiceError(
                            f"Invalid data: {error_text}",
                            status_code=response.status_code,
                            details=error_details
                        )
                    elif response.status_code == 401 or response.status_code == 403:
                        raise SupabaseServiceError(
                            f"Database authentication failed",
                            status_code=response.status_code,
                            details=error_details
                        )
                    else:
                        raise SupabaseServiceError(
                            f"Database error: HTTP {response.status_code}",
                            status_code=response.status_code,
                            details=error_details
                        )

                response.raise_for_status()
                data = response.json()

                if not data:
                    logger.warning("Database returned empty response after link_broker_account")
                    # Try to fetch the record we just created/updated
                    return await self.get_broker_account(customer_id, broker)

                result = data[0] if isinstance(data, list) else data
                logger.info(f"Successfully linked broker account: {result.get('id')}")
                return result

        except SupabaseServiceError:
            # Re-raise our custom errors
            raise
        except httpx.TimeoutException:
            logger.error(f"Timeout linking broker account for customer {customer_id}")
            raise SupabaseServiceError(
                "Database timeout while linking broker account",
                status_code=504
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error linking broker account: {e.response.status_code} - {e.response.text}")
            raise SupabaseServiceError(
                f"Database HTTP error: {e.response.status_code}",
                status_code=e.response.status_code,
                details={"response": e.response.text}
            )
        except Exception as e:
            logger.error(f"Unexpected error linking broker account: {type(e).__name__}: {e}")
            raise SupabaseServiceError(
                f"Unexpected error: {type(e).__name__}: {e}",
                details={"exception_type": type(e).__name__}
            )

    async def update_trading_status(self, customer_id: int, status: str) -> bool:
        """Update customer trading status."""
        if not self._configured:
            logger.warning("Supabase not configured - cannot update trading status")
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(
                    f"{self.base_url}/customers",
                    headers=self.headers,
                    params={"id": f"eq.{customer_id}"},
                    json={"trading_status": status}
                )
                response.raise_for_status()
                return True
        except httpx.TimeoutException:
            logger.error(f"Timeout updating trading status for customer {customer_id}")
            return False
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error updating trading status: {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"Error updating trading status: {type(e).__name__}: {e}")
            return False

    async def get_all_customers_for_admin(self) -> list[dict]:
        """Get all customers with their trading status and broker accounts."""
        if not self._configured:
            logger.warning("Supabase not configured - returning empty customer list")
            return []

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
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
        except httpx.TimeoutException:
            logger.error("Timeout fetching customers for admin")
            return []
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching customers: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"Error fetching customers: {type(e).__name__}: {e}")
            return []

    # =========================================================================
    # Broker Links (per-user broker account linking)
    # =========================================================================

    async def get_broker_link(self, user_id: int, broker: str = "LYNX") -> Optional[dict]:
        """
        Get the broker link for a user.

        Args:
            user_id: The user's database ID
            broker: The broker name (default: "LYNX")

        Returns:
            The broker link record, or None if not found
        """
        if not self._configured:
            logger.debug("Supabase not configured, returning None for broker link lookup")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/broker_links",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "broker": f"eq.{broker}",
                        "select": "*"
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except httpx.TimeoutException:
            logger.error(f"Timeout getting broker link for user {user_id}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting broker link: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error getting broker link: {type(e).__name__}: {e}")
            return None

    async def get_active_broker_link(self, user_id: int, broker: str = "LYNX") -> Optional[dict]:
        """
        Get the active (linked) broker link for a user.

        Args:
            user_id: The user's database ID
            broker: The broker name (default: "LYNX")

        Returns:
            The broker link record if status is 'linked', None otherwise
        """
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/broker_links",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "broker": f"eq.{broker}",
                        "status": "eq.linked",
                        "select": "*"
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting active broker link: {type(e).__name__}: {e}")
            return None

    async def create_broker_link(
        self,
        user_id: int,
        ib_account_id: str,
        broker: str = "LYNX",
        status: str = "linked"
    ) -> Optional[dict]:
        """
        Create a new broker link for a user.

        Args:
            user_id: The user's database ID
            ib_account_id: The IB account ID (e.g., "DU0521473")
            broker: The broker name (default: "LYNX")
            status: Initial status (default: "linked")

        Returns:
            The created broker link record, or None on failure

        Raises:
            SupabaseServiceError: On database errors
        """
        if not self._configured:
            logger.warning("Supabase not configured - returning mock broker link")
            return {
                "id": "mock-uuid",
                "user_id": user_id,
                "broker": broker,
                "ib_account_id": ib_account_id,
                "status": status,
                "created_at": None,
                "updated_at": None
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.base_url}/broker_links",
                    headers=self.headers,
                    json={
                        "user_id": user_id,
                        "broker": broker,
                        "ib_account_id": ib_account_id,
                        "status": status
                    }
                )

                if response.status_code == 409 or (response.status_code >= 400 and "duplicate" in response.text.lower()):
                    raise SupabaseServiceError(
                        f"Broker link already exists for user {user_id}",
                        status_code=409
                    )

                response.raise_for_status()
                data = response.json()
                result = data[0] if isinstance(data, list) else data
                logger.info(f"Created broker link for user {user_id}: {result.get('id')}")
                return result

        except SupabaseServiceError:
            raise
        except httpx.TimeoutException:
            raise SupabaseServiceError("Database timeout creating broker link", status_code=504)
        except httpx.HTTPStatusError as e:
            raise SupabaseServiceError(
                f"Database error: {e.response.status_code}",
                status_code=e.response.status_code,
                details={"response": e.response.text}
            )
        except Exception as e:
            raise SupabaseServiceError(f"Unexpected error: {type(e).__name__}: {e}")

    async def update_broker_link(
        self,
        user_id: int,
        broker: str = "LYNX",
        ib_account_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> Optional[dict]:
        """
        Update an existing broker link.

        Args:
            user_id: The user's database ID
            broker: The broker name (default: "LYNX")
            ib_account_id: New IB account ID (optional)
            status: New status (optional)

        Returns:
            The updated broker link record, or None on failure
        """
        if not self._configured:
            logger.warning("Supabase not configured - cannot update broker link")
            return None

        update_data = {}
        if ib_account_id is not None:
            update_data["ib_account_id"] = ib_account_id
        if status is not None:
            update_data["status"] = status

        if not update_data:
            logger.warning("No fields to update for broker link")
            return await self.get_broker_link(user_id, broker)

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.patch(
                    f"{self.base_url}/broker_links",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "broker": f"eq.{broker}"
                    },
                    json=update_data
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return await self.get_broker_link(user_id, broker)

                result = data[0] if isinstance(data, list) else data
                logger.info(f"Updated broker link for user {user_id}")
                return result

        except httpx.TimeoutException:
            logger.error(f"Timeout updating broker link for user {user_id}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error updating broker link: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error updating broker link: {type(e).__name__}: {e}")
            return None

    async def upsert_broker_link(
        self,
        user_id: int,
        ib_account_id: str,
        broker: str = "LYNX",
        status: str = "linked"
    ) -> Optional[dict]:
        """
        Create or update a broker link (upsert).

        If a broker link exists for this user/broker, update it.
        Otherwise, create a new one.

        Args:
            user_id: The user's database ID
            ib_account_id: The IB account ID
            broker: The broker name (default: "LYNX")
            status: Status to set (default: "linked")

        Returns:
            The created/updated broker link record
        """
        existing = await self.get_broker_link(user_id, broker)

        if existing:
            return await self.update_broker_link(
                user_id=user_id,
                broker=broker,
                ib_account_id=ib_account_id,
                status=status
            )
        else:
            return await self.create_broker_link(
                user_id=user_id,
                ib_account_id=ib_account_id,
                broker=broker,
                status=status
            )

    async def disable_broker_link(self, user_id: int, broker: str = "LYNX") -> bool:
        """
        Disable a broker link (set status to 'disabled').

        Args:
            user_id: The user's database ID
            broker: The broker name (default: "LYNX")

        Returns:
            True if successful, False otherwise
        """
        result = await self.update_broker_link(user_id, broker, status="disabled")
        return result is not None

    async def unlink_broker(self, user_id: int, broker: str = "LYNX") -> bool:
        """
        Unlink a broker (set status to 'unlinked' and clear ib_account_id).

        Args:
            user_id: The user's database ID
            broker: The broker name (default: "LYNX")

        Returns:
            True if successful, False otherwise
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.patch(
                    f"{self.base_url}/broker_links",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "broker": f"eq.{broker}"
                    },
                    json={
                        "ib_account_id": None,
                        "status": "unlinked"
                    }
                )
                response.raise_for_status()
                logger.info(f"Unlinked broker for user {user_id}")
                return True
        except Exception as e:
            logger.error(f"Error unlinking broker: {type(e).__name__}: {e}")
            return False

    async def get_user_by_ib_account(self, ib_account_id: str, broker: str = "LYNX") -> Optional[dict]:
        """
        Find the user who has linked a specific IB account.

        Args:
            ib_account_id: The IB account ID to look up
            broker: The broker name (default: "LYNX")

        Returns:
            The broker link record with user info, or None if not found
        """
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/broker_links",
                    headers=self.headers,
                    params={
                        "ib_account_id": f"eq.{ib_account_id}",
                        "broker": f"eq.{broker}",
                        "status": "eq.linked",
                        "select": "*"
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error finding user by IB account: {type(e).__name__}: {e}")
            return None


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service singleton."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
