"""Authentication middleware for trading API."""
from fastapi import Header, HTTPException, Request, Depends
from typing import Optional
from models.schemas import UserContext, TradingStatus
from services.supabase_service import get_supabase_service
import logging

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request,
    x_customer_id: Optional[str] = Header(None, alias="X-Customer-ID"),
    x_customer_email: Optional[str] = Header(None, alias="X-Customer-Email")
) -> UserContext:
    """
    Extract and validate the current user from request headers.

    The React frontend sends customer info in headers after login.
    In production, this should be JWT-based authentication.
    """
    if not x_customer_id:
        raise HTTPException(
            status_code=401,
            detail="Missing X-Customer-ID header. Please log in."
        )

    try:
        customer_id = int(x_customer_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid customer ID format"
        )

    # Verify customer exists and get trading status
    db = get_supabase_service()
    customer = await db.get_customer_by_id(customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # Check if email matches (basic security check)
    if x_customer_email and customer.get("email") != x_customer_email:
        raise HTTPException(
            status_code=403,
            detail="Email mismatch"
        )

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
    """
    if user.trading_status != TradingStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail=f"Trading not enabled. Your status: {user.trading_status.value}. Contact support for approval."
        )

    if not user.ib_account_id:
        raise HTTPException(
            status_code=403,
            detail="No broker account linked. Please link your LYNX account first."
        )

    return user


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
