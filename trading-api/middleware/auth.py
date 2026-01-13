"""Authentication middleware for trading API."""
from fastapi import Header, HTTPException, Request, Depends
from typing import Optional
from models.schemas import UserContext, TradingStatus
from services.supabase_service import get_supabase_service
from services.ib_client import get_ib_client
import logging
import os

logger = logging.getLogger(__name__)


def get_dev_customer() -> UserContext:
    """
    Get the dev customer with the real IB account ID from the connected gateway.

    This is used when no customer headers are provided (e.g., Swagger testing).
    The account ID is automatically retrieved from the connected IB Gateway.

    Dev mode features:
    - customer_id=0 (indicates dev mode)
    - trading_status=APPROVED (allows immediate trading)
    - ib_account_id comes from connected IB Gateway
    """
    ib_client = get_ib_client()
    real_account = ib_client.get_primary_account()

    if real_account:
        logger.debug(f"Dev customer using real IB account: {real_account}")
    else:
        logger.warning("Dev customer: No IB account available (gateway not connected)")

    return UserContext(
        customer_id=0,
        email="dev@localhost",
        trading_status=TradingStatus.APPROVED,
        broker_account_id=None,
        ib_account_id=real_account  # Use real account from IB Gateway
    )


async def get_current_user(
    request: Request,
    x_customer_id: Optional[str] = Header(None, alias="X-Customer-ID"),
    x_customer_email: Optional[str] = Header(None, alias="X-Customer-Email")
) -> UserContext:
    """
    Extract and validate the current user from request headers.

    The React frontend sends customer info in headers after login.
    In dev mode, falls back to a dev customer if header is missing/invalid.
    """
    # If no customer ID provided, use dev fallback
    if not x_customer_id:
        logger.info("No X-Customer-ID header, using dev customer")
        return get_dev_customer()

    # Try to parse customer ID
    try:
        customer_id = int(x_customer_id)
    except ValueError:
        logger.warning(f"Invalid customer ID format: {x_customer_id}, using dev customer")
        return get_dev_customer()

    # Special case: customer_id=0 means explicit dev mode
    if customer_id == 0:
        logger.info("Explicit dev mode (customer_id=0)")
        return get_dev_customer()

    # Verify customer exists and get trading status
    db = get_supabase_service()

    # If database is not configured, use dev mode
    if not db.is_configured():
        logger.info("Database not configured, using dev customer")
        return get_dev_customer()

    customer = await db.get_customer_by_id(customer_id)

    if not customer:
        logger.warning(f"Customer {customer_id} not found, using dev customer")
        return get_dev_customer()

    # Check if email matches (basic security check) - skip in dev
    if x_customer_email and customer.get("email") != x_customer_email:
        logger.warning(f"Email mismatch for customer {customer_id}")
        # Don't fail, just log in dev mode

    # Get broker account if linked
    broker_account = await db.get_broker_account(customer_id)
    broker_account_id = broker_account.get("id") if broker_account else None
    ib_account_id = broker_account.get("account_id") if broker_account else None

    trading_status = customer.get("trading_status", "pending")

    return UserContext(
        customer_id=customer_id,
        email=customer.get("email", ""),
        trading_status=TradingStatus(trading_status) if trading_status else TradingStatus.PENDING,
        broker_account_id=broker_account_id,
        ib_account_id=ib_account_id
    )


async def require_trading_approved(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Dependency that requires the user to have APPROVED trading status.

    Use this for endpoints that require trading access.

    For dev mode (customer_id=0), this:
    - Allows trading if IB Gateway is connected
    - Uses the first available IB account automatically
    """
    # Dev mode handling
    if user.customer_id == 0:
        ib_client = get_ib_client()

        # Check if IB Gateway is connected
        if not ib_client.is_connected():
            raise HTTPException(
                status_code=503,
                detail="IB Gateway not connected. Please ensure IB Gateway is running and logged in."
            )

        # Get real account from IB Gateway if not already set
        if not user.ib_account_id:
            real_account = ib_client.get_primary_account()
            if not real_account:
                accounts = await ib_client.get_accounts()
                if accounts:
                    real_account = accounts[0]

            if real_account:
                # Return updated user context with real account
                return UserContext(
                    customer_id=0,
                    email="dev@localhost",
                    trading_status=TradingStatus.APPROVED,
                    broker_account_id=None,
                    ib_account_id=real_account
                )
            else:
                raise HTTPException(
                    status_code=503,
                    detail="No IB accounts available. Please ensure IB Gateway is logged in."
                )

        return user

    # Regular user flow
    if user.trading_status != TradingStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail=f"Trading not enabled. Your status: {user.trading_status.value}. Contact support for approval."
        )

    if not user.ib_account_id:
        # Try to get account from IB Gateway as fallback
        ib_client = get_ib_client()
        if ib_client.is_connected():
            real_account = ib_client.get_primary_account()
            if real_account:
                logger.info(f"Using IB Gateway account {real_account} for user {user.customer_id}")
                return UserContext(
                    customer_id=user.customer_id,
                    email=user.email,
                    trading_status=user.trading_status,
                    broker_account_id=user.broker_account_id,
                    ib_account_id=real_account
                )

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
