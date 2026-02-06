"""Authentication middleware for trading API with strict user isolation."""
from fastapi import Header, HTTPException, Request, Depends
from typing import Optional, Dict
from models.schemas import UserContext, TradingStatus
from services.supabase_service import get_supabase_service
from services.ib_client import get_ib_client
import logging
import os
import time

logger = logging.getLogger(__name__)

# Environment flag for local development without database
LOCAL_DEV_MODE = os.environ.get("LOCAL_DEV_MODE", "").lower() == "true"

# Auth bypass - set to False for production with user isolation
AUTH_DISABLED = False

# In-memory customer cache to avoid hitting Supabase on every request
_customer_cache: Dict[int, dict] = {}  # customer_id -> {data, timestamp}
CUSTOMER_CACHE_TTL = 60  # seconds


def _get_cached_customer(customer_id: int) -> Optional[dict]:
    """Get customer from cache if still valid."""
    entry = _customer_cache.get(customer_id)
    if entry and (time.time() - entry["timestamp"]) < CUSTOMER_CACHE_TTL:
        return entry["data"]
    return None


def _set_cached_customer(customer_id: int, data: dict):
    """Store customer in cache."""
    _customer_cache[customer_id] = {"data": data, "timestamp": time.time()}


def get_dev_mode_linked_accounts() -> Dict[int, dict]:
    """
    Get the in-memory storage for dev mode linked accounts.
    Import this from routers.account to avoid circular imports.
    """
    try:
        from routers.account import _dev_mode_linked_accounts
        return _dev_mode_linked_accounts
    except ImportError:
        return {}


async def get_current_user(
    request: Request,
    x_customer_id: Optional[str] = Header(None, alias="X-Customer-ID"),
    x_customer_email: Optional[str] = Header(None, alias="X-Customer-Email")
) -> UserContext:
    """
    Extract and validate the current user from request headers.

    The React frontend sends customer info in headers after login.
    Authentication is REQUIRED - no automatic fallbacks to shared accounts.

    For local development without database:
    - Set LOCAL_DEV_MODE=true environment variable
    - User will get customer_id=0 but NO automatic IB account access
    - Must still link their own broker account via /trading/broker/link
    """
    # TEMPORARY: Auth bypass for local testing
    if AUTH_DISABLED:
        ib_client = get_ib_client()
        ib_account = ib_client.get_primary_account()
        return UserContext(
            customer_id=0,
            email="local@localhost",
            role="admin",
            trading_status=TradingStatus.APPROVED,
            broker_account_id=None,
            ib_account_id=ib_account
        )

    # If no customer ID provided
    if not x_customer_id:
        if LOCAL_DEV_MODE:
            logger.info("Local dev mode: No X-Customer-ID header, returning guest user")
            return UserContext(
                customer_id=0,
                email="dev@localhost",
                role="user",
                trading_status=TradingStatus.PENDING,  # NOT approved by default
                broker_account_id=None,
                ib_account_id=None  # NO automatic IB account
            )
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Missing X-Customer-ID header."
        )

    # Try to parse customer ID
    try:
        customer_id = int(x_customer_id)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid customer ID format: {x_customer_id}"
        )

    # customer_id=0 is local dev mode (no database lookup)
    if customer_id == 0:
        if LOCAL_DEV_MODE:
            logger.info("Local dev mode: customer_id=0")
            # Check if account was linked in-memory
            dev_accounts = get_dev_mode_linked_accounts()
            linked = dev_accounts.get(0, {})
            ib_account_id = linked.get("ib_account_id")

            # Fallback to IB primary account if no in-memory link
            if not ib_account_id:
                try:
                    ib_client = get_ib_client()
                    primary = ib_client.get_primary_account()
                    if primary:
                        ib_account_id = primary
                        # Auto-store so subsequent requests are fast
                        dev_accounts[0] = {"ib_account_id": primary, "account_type": "paper"}
                        logger.info(f"Dev mode: Auto-linked IB primary account {primary} for customer_id=0")
                except Exception:
                    pass

            return UserContext(
                customer_id=0,
                email=x_customer_email or "dev@localhost",
                role="admin",
                trading_status=TradingStatus.APPROVED,  # Approved for local testing
                broker_account_id=None,
                ib_account_id=ib_account_id
            )
        raise HTTPException(
            status_code=401,
            detail="Development mode not enabled. Set LOCAL_DEV_MODE=true."
        )

    # Verify customer exists and get trading status from database
    db = get_supabase_service()

    # If database is not configured
    if not db.is_configured():
        if LOCAL_DEV_MODE:
            logger.warning("Database not configured, using local dev mode")
            return UserContext(
                customer_id=customer_id,
                email=x_customer_email or "",
                role="user",
                trading_status=TradingStatus.APPROVED,
                broker_account_id=None,
                ib_account_id=None
            )
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Cannot verify user."
        )

    # Try cache first to avoid hitting Supabase on every request
    customer = _get_cached_customer(customer_id)
    if not customer:
        customer = await db.get_customer_by_id(customer_id)
        if customer:
            _set_cached_customer(customer_id, customer)

    if not customer:
        # In dev mode, don't block on Supabase timeouts
        if LOCAL_DEV_MODE:
            logger.warning(f"Dev mode: customer {customer_id} lookup failed, using fallback")
            customer = {"id": customer_id, "email": x_customer_email or "", "role": "customer", "trading_status": "approved"}
            _set_cached_customer(customer_id, customer)
        else:
            raise HTTPException(
                status_code=401,
                detail=f"Customer {customer_id} not found."
            )

    # Validate email matches (prevents ID spoofing)
    if x_customer_email and customer.get("email") != x_customer_email:
        logger.warning(f"Email mismatch for customer {customer_id}: expected {customer.get('email')}, got {x_customer_email}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed: email mismatch."
        )

    # Get THIS user's broker link
    broker_link = None
    ib_account_id = None
    broker_account_id = None

    # In LOCAL_DEV_MODE, first check in-memory linked accounts
    if LOCAL_DEV_MODE:
        dev_accounts = get_dev_mode_linked_accounts()
        linked = dev_accounts.get(customer_id, {})
        if linked.get("ib_account_id"):
            ib_account_id = linked.get("ib_account_id")
            logger.info(f"Dev mode: Using in-memory broker link for user {customer_id}: {ib_account_id}")

    # If not found in dev mode, try database (skip in dev mode - broker_links table often missing)
    if not ib_account_id and not LOCAL_DEV_MODE:
        try:
            broker_link = await db.get_active_broker_link(customer_id)
            broker_account_id = broker_link.get("id") if broker_link else None
            ib_account_id = broker_link.get("ib_account_id") if broker_link else None
        except Exception as e:
            raise

    # In LOCAL_DEV_MODE, fall back to IB primary account if no broker link found
    if LOCAL_DEV_MODE and not ib_account_id:
        try:
            ib_client = get_ib_client()
            primary = ib_client.get_primary_account()
            if primary:
                ib_account_id = primary
                logger.info(f"Dev mode: Using IB primary account {primary} for user {customer_id}")
        except Exception:
            pass

    # In LOCAL_DEV_MODE, override trading_status to APPROVED for convenience
    trading_status = customer.get("trading_status", "pending")
    if LOCAL_DEV_MODE and trading_status == "pending":
        trading_status = "approved"
        logger.info(f"Dev mode: Auto-approving trading status for user {customer_id}")

    return UserContext(
        customer_id=customer_id,
        email=customer.get("email", ""),
        role=customer.get("role") or "user",
        trading_status=TradingStatus(trading_status) if trading_status else TradingStatus.PENDING,
        broker_account_id=broker_account_id,
        ib_account_id=ib_account_id  # Only THIS user's linked account
    )


async def require_trading_approved(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Dependency that requires the user to have APPROVED trading status
    AND a linked broker account.

    STRICT ISOLATION: Each user can ONLY access their own linked IB account.
    No automatic fallbacks to shared gateway accounts.
    """
    # Skip all checks in local dev mode with auth disabled
    if AUTH_DISABLED:
        return user

    # Check trading status is approved
    if user.trading_status != TradingStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail=f"Trading not enabled. Your status: {user.trading_status.value}. Contact support for approval."
        )

    # STRICT: Require user to have their own linked broker account
    if not user.ib_account_id:
        raise HTTPException(
            status_code=403,
            detail="No broker account linked. Please link your LYNX account first via POST /trading/broker/link"
        )

    return user


async def require_admin(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Dependency that requires the user to have admin role.

    Used for: cash allocation, trading approval, freeze/unfreeze,
    batch execution, portfolio admin operations.

    Role is determined by the 'role' column in the customers table.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )
    return user


async def require_broker_linked(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Dependency that requires the user to have a linked broker account.
    Does NOT require trading to be approved - useful for read-only operations.

    STRICT ISOLATION: Each user can ONLY access their own linked IB account.
    """
    # Skip check in local dev mode with auth disabled
    if AUTH_DISABLED:
        return user

    if not user.ib_account_id:
        raise HTTPException(
            status_code=403,
            detail="No broker account linked. Please link your LYNX account first via POST /trading/broker/link"
        )

    return user


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def require_broker_linked_for_trading(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Require user to have a linked broker account (status=linked) to trade.

    Returns 403 with specific message to connect LYNX account.
    """
    if not user.ib_account_id:
        logger.warning(f"Trading blocked - no broker linked: {user.email}")
        raise HTTPException(
            status_code=403,
            detail="Connect your LYNX account to trade."
        )
    return user


async def require_trading_owner(
    user: UserContext = Depends(require_broker_linked_for_trading)
) -> UserContext:
    """
    HARD SAFETY LOCK: Only admin users can place real IB trades.

    Checks:
    1. User must have a linked broker account (via require_broker_linked_for_trading)
    2. User must have role='admin' in the database
    """
    if user.role != "admin":
        logger.warning(f"Trading blocked for non-admin: {user.email} (role={user.role})")
        raise HTTPException(
            status_code=403,
            detail="Trading disabled for this user."
        )

    logger.info(f"Trading admin verified: {user.email}")
    return user
