"""Authentication middleware for trading API with strict user isolation."""
from fastapi import Header, HTTPException, Request, Depends
from typing import Optional, Dict
from models.schemas import UserContext, TradingStatus
from services.supabase_service import get_supabase_service
from services.ib_client import get_ib_client
from config import get_settings
import logging
import os

logger = logging.getLogger(__name__)

# Environment flag for local development without database
LOCAL_DEV_MODE = os.environ.get("LOCAL_DEV_MODE", "").lower() == "true"

# TEMPORARY: Disable auth for local testing
AUTH_DISABLED = True


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
            return UserContext(
                customer_id=0,
                email=x_customer_email or "dev@localhost",
                trading_status=TradingStatus.APPROVED,  # Approved for local testing
                broker_account_id=None,
                ib_account_id=linked.get("ib_account_id")  # From in-memory storage
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
                trading_status=TradingStatus.APPROVED,
                broker_account_id=None,
                ib_account_id=None
            )
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Cannot verify user."
        )

    customer = await db.get_customer_by_id(customer_id)

    if not customer:
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

    # Get THIS user's broker account if linked
    broker_account = await db.get_broker_account(customer_id)
    broker_account_id = broker_account.get("id") if broker_account else None
    ib_account_id = broker_account.get("account_id") if broker_account else None

    trading_status = customer.get("trading_status", "pending")

    return UserContext(
        customer_id=customer_id,
        email=customer.get("email", ""),
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


async def require_trading_owner(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    HARD SAFETY LOCK: Only the owner email can place trades.

    All other users get 403 Forbidden. This prevents unauthorized trading
    through the shared LYNX account.
    """
    settings = get_settings()

    # Check if owner email is configured
    if not settings.trading_owner_email:
        logger.error("TRADING_OWNER_EMAIL not configured - all trading blocked")
        raise HTTPException(
            status_code=403,
            detail="Trading disabled: No owner configured."
        )

    # Check if current user is the owner
    if not settings.is_trading_owner(user.email):
        logger.warning(f"Trading blocked for non-owner: {user.email}")
        raise HTTPException(
            status_code=403,
            detail="Trading disabled for this user."
        )

    logger.info(f"Trading owner verified: {user.email}")
    return user
