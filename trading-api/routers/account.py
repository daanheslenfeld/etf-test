"""Account management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request
from models.schemas import (
    LinkAccountRequest, LinkAccountResponse, SessionStatusResponse,
    UserContext
)
from middleware.auth import get_current_user, require_trading_approved, get_client_ip
from services.ib_client import get_ib_client
from services.supabase_service import get_supabase_service
from services.audit import get_audit_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["Account"])


@router.get("/session/status", response_model=SessionStatusResponse)
async def get_session_status(
    user: UserContext = Depends(require_trading_approved)
) -> SessionStatusResponse:
    """
    Check the status of the IB Gateway connection.

    Returns authentication and connection status.
    """
    ib_client = get_ib_client()
    status = await ib_client.check_auth_status()

    return SessionStatusResponse(
        authenticated=status.get("authenticated", False),
        connected=status.get("connected", False),
        competing=status.get("competing", False),
        message=status.get("message", "")
    )


@router.post("/account/link", response_model=LinkAccountResponse)
async def link_broker_account(
    request: Request,
    account_data: LinkAccountRequest,
    user: UserContext = Depends(get_current_user)
) -> LinkAccountResponse:
    """
    Link a LYNX/IB account to the current user.

    This stores the IB account ID for the user. The user must still
    be approved by an admin before they can trade.
    """
    db = get_supabase_service()
    audit = get_audit_service()

    # Validate account ID format (IB paper accounts start with "DU")
    account_id = account_data.account_id.strip().upper()

    if account_data.account_type == "paper" and not account_id.startswith("DU"):
        raise HTTPException(
            status_code=400,
            detail="Paper trading account IDs typically start with 'DU'. Please verify your account ID."
        )

    # Link the account
    result = await db.link_broker_account(
        customer_id=user.customer_id,
        account_id=account_id,
        broker="LYNX",
        account_type=account_data.account_type
    )

    if not result:
        raise HTTPException(
            status_code=500,
            detail="Failed to link broker account"
        )

    # Log the action
    await audit.log_action(
        customer_id=user.customer_id,
        action="account_linked",
        broker_account_id=result.get("id"),
        ip_address=get_client_ip(request)
    )

    return LinkAccountResponse(
        success=True,
        message=f"Account {account_id} linked successfully. Awaiting admin approval for trading.",
        broker_account_id=result.get("id")
    )


@router.get("/account/info")
async def get_account_info(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """
    Get the current user's trading account information.
    """
    return {
        "customer_id": user.customer_id,
        "email": user.email,
        "trading_status": user.trading_status.value,
        "broker_account_linked": user.broker_account_id is not None,
        "ib_account_id": user.ib_account_id
    }
