"""Account management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from models.schemas import (
    LinkAccountRequest, LinkAccountResponse, SessionStatusResponse,
    UserContext
)
from middleware.auth import get_current_user, require_trading_approved, get_client_ip
from services.ib_client import get_ib_client, reconnect_ib_client
from services.supabase_service import get_supabase_service, SupabaseServiceError
from services.audit import get_audit_service
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["Account"])


class BrokerLinkResponse(BaseModel):
    """Simple response for broker link endpoint."""
    linked: bool
    account_id: Optional[str] = None
    account_type: Optional[str] = None
    message: Optional[str] = None


def is_valid_ib_account_id(account_id: str) -> bool:
    """
    Validate IB account ID format.
    Permissive validation - accepts any alphanumeric 2-20 chars.
    """
    if not account_id:
        return False
    return bool(re.match(r'^[A-Z0-9]{2,20}$', account_id))


@router.get("/session/status", response_model=SessionStatusResponse)
async def get_session_status(
    user: UserContext = Depends(require_trading_approved)
) -> SessionStatusResponse:
    """Check the status of the IB Gateway connection."""
    ib_client = get_ib_client()
    status = await ib_client.check_auth_status()

    return SessionStatusResponse(
        authenticated=status.get("authenticated", False),
        connected=status.get("connected", False),
        competing=status.get("competing", False),
        message=status.get("message", "")
    )


@router.post("/broker/link", response_model=BrokerLinkResponse)
async def link_broker_account_simple(
    request: Request,
    user: UserContext = Depends(get_current_user)
) -> BrokerLinkResponse:
    """
    Link a LYNX/IB account to the current user.

    Auto-detects and links the first available IB account from the gateway.
    No request body or headers required - just call this endpoint.

    If IB Gateway is not connected, this will attempt to reconnect first.
    """
    ib_client = get_ib_client()

    # If not connected, attempt to reconnect
    if not ib_client.is_connected():
        logger.info("IB Gateway not connected, attempting to reconnect...")
        connected = await ib_client.connect()
        if not connected:
            logger.error("Failed to connect to IB Gateway")
            raise HTTPException(
                status_code=503,
                detail="Cannot connect to IB Gateway. Please ensure IB Gateway is running on 127.0.0.1:4001 and logged in."
            )
        logger.info("Successfully reconnected to IB Gateway")

    # Get the account from the connected IB Gateway
    ib_account = ib_client.get_primary_account()

    if not ib_account:
        # Try to get accounts list
        accounts = await ib_client.get_accounts()
        logger.info(f"Available IB accounts: {accounts}")
        if accounts:
            ib_account = accounts[0]

    if not ib_account:
        raise HTTPException(
            status_code=503,
            detail="IB Gateway connected but no accounts available. Please ensure you are logged in to IB Gateway."
        )

    # Determine account type based on prefix
    if ib_account.startswith("DU") or ib_account.startswith("DF"):
        account_type = "paper"
    else:
        account_type = "live"

    logger.info(f"Linking IB account: {ib_account} (type: {account_type})")

    # For dev mode (customer_id=0), skip database storage
    if user.customer_id == 0:
        logger.info(f"Dev mode: Account {ib_account} linked in-memory")
        return BrokerLinkResponse(
            linked=True,
            account_id=ib_account,
            account_type=account_type,
            message=f"Account {ib_account} linked successfully (dev mode)"
        )

    # Link the account in database for real users
    db = get_supabase_service()
    audit = get_audit_service()

    try:
        result = await db.link_broker_account(
            customer_id=user.customer_id,
            account_id=ib_account,
            broker="LYNX",
            account_type=account_type
        )

        if result:
            try:
                await audit.log_action(
                    customer_id=user.customer_id,
                    action="account_linked",
                    broker_account_id=result.get("id"),
                    ip_address=get_client_ip(request)
                )
            except Exception as audit_err:
                logger.warning(f"Failed to log audit action: {audit_err}")

        return BrokerLinkResponse(
            linked=True,
            account_id=ib_account,
            account_type=account_type,
            message=f"Account {ib_account} linked successfully"
        )

    except SupabaseServiceError as e:
        logger.error(f"Database error: {e.message}")
        # Still return success for the IB link, just warn about DB
        return BrokerLinkResponse(
            linked=True,
            account_id=ib_account,
            account_type=account_type,
            message=f"Account {ib_account} linked (database save failed: {e.message})"
        )
    except Exception as e:
        logger.error(f"Error saving to database: {e}")
        return BrokerLinkResponse(
            linked=True,
            account_id=ib_account,
            account_type=account_type,
            message=f"Account {ib_account} linked (database save failed)"
        )


@router.post("/account/link", response_model=LinkAccountResponse)
async def link_broker_account(
    request: Request,
    account_data: LinkAccountRequest,
    user: UserContext = Depends(get_current_user)
) -> LinkAccountResponse:
    """
    Link a LYNX/IB account to the current user (with explicit account_id).

    For auto-detection, use POST /trading/broker/link instead.
    """
    db = get_supabase_service()
    audit = get_audit_service()
    ib_client = get_ib_client()

    # If not connected, attempt to reconnect
    if not ib_client.is_connected():
        logger.info("IB Gateway not connected, attempting to reconnect...")
        await ib_client.connect()

    # Normalize account ID
    account_id = account_data.account_id.strip().upper()

    # If account_id is empty or "AUTO", use the first available IB account
    if not account_id or account_id == "AUTO":
        ib_account = ib_client.get_primary_account()
        if not ib_account:
            accounts = await ib_client.get_accounts()
            if accounts:
                ib_account = accounts[0]

        if not ib_account:
            raise HTTPException(
                status_code=503,
                detail="Cannot auto-detect account: IB Gateway not connected or no accounts available."
            )
        account_id = ib_account
        logger.info(f"Auto-detected IB account: {account_id}")

    # Validate account ID format
    if not is_valid_ib_account_id(account_id):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid account ID format: '{account_id}'. Must be alphanumeric, 2-20 characters."
        )

    # Determine account type
    account_type = account_data.account_type
    if account_id.startswith("DU") or account_id.startswith("DF"):
        account_type = "paper"

    # For dev mode, handle in-memory
    if user.customer_id == 0:
        logger.info(f"Dev mode: Account {account_id} linked in-memory")
        return LinkAccountResponse(
            success=True,
            message=f"Account {account_id} linked successfully (dev mode)",
            broker_account_id=None
        )

    # Link in database
    try:
        result = await db.link_broker_account(
            customer_id=user.customer_id,
            account_id=account_id,
            broker="LYNX",
            account_type=account_type
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to save broker account to database."
            )

        try:
            await audit.log_action(
                customer_id=user.customer_id,
                action="account_linked",
                broker_account_id=result.get("id"),
                ip_address=get_client_ip(request)
            )
        except Exception as audit_err:
            logger.warning(f"Failed to log audit action: {audit_err}")

        return LinkAccountResponse(
            success=True,
            message=f"Account {account_id} linked successfully.",
            broker_account_id=result.get("id")
        )

    except HTTPException:
        raise
    except SupabaseServiceError as e:
        logger.error(f"Database error: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=f"Database error: {e.message}")
    except Exception as e:
        logger.error(f"Error linking broker account: {e}")
        raise HTTPException(status_code=500, detail=f"Error linking broker account: {str(e)}")


@router.get("/account/info")
async def get_account_info(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """Get the current user's trading account information."""
    ib_client = get_ib_client()

    # For dev mode, get real account from IB Gateway
    ib_account_id = user.ib_account_id
    if user.customer_id == 0 and not ib_account_id:
        ib_account_id = ib_client.get_primary_account()

    return {
        "customer_id": user.customer_id,
        "email": user.email,
        "trading_status": user.trading_status.value,
        "broker_account_linked": user.broker_account_id is not None or ib_account_id is not None,
        "ib_account_id": ib_account_id,
        "ib_gateway_connected": ib_client.is_connected(),
        "ready_for_orders": ib_client.is_ready_for_orders()
    }


@router.get("/account/available")
async def get_available_accounts(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """Get list of available IB accounts from the connected gateway."""
    ib_client = get_ib_client()

    # Try to connect if not connected
    if not ib_client.is_connected():
        logger.info("IB Gateway not connected, attempting to connect...")
        await ib_client.connect()

    if not ib_client.is_connected():
        return {
            "connected": False,
            "accounts": [],
            "message": "IB Gateway not connected. Ensure IB Gateway is running on 127.0.0.1:4001"
        }

    accounts = await ib_client.get_accounts()
    primary = ib_client.get_primary_account()

    return {
        "connected": True,
        "accounts": accounts,
        "primary_account": primary,
        "message": f"Found {len(accounts)} account(s). Primary: {primary}"
    }


@router.get("/account/summary")
async def get_account_summary(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """
    Get account summary including cash balance and portfolio value.
    """
    ib_client = get_ib_client()

    if not ib_client.is_connected():
        return {
            "connected": False,
            "cash_balance": 0,
            "portfolio_value": 0,
            "total_value": 0,
            "message": "IB Gateway not connected"
        }

    # Get account ID
    ib_account_id = user.ib_account_id
    if user.customer_id == 0 and not ib_account_id:
        ib_account_id = ib_client.get_primary_account()

    if not ib_account_id:
        return {
            "connected": True,
            "cash_balance": 0,
            "portfolio_value": 0,
            "total_value": 0,
            "message": "No account linked"
        }

    try:
        # Get account values from IB
        account_values = await ib_client.get_account_values(ib_account_id)

        cash_balance = account_values.get("CashBalance", 0)
        portfolio_value = account_values.get("GrossPositionValue", 0)
        net_liquidation = account_values.get("NetLiquidation", 0)

        return {
            "connected": True,
            "account_id": ib_account_id,
            "cash_balance": float(cash_balance),
            "portfolio_value": float(portfolio_value),
            "total_value": float(net_liquidation),
            "currency": "EUR"
        }
    except Exception as e:
        logger.error(f"Error getting account summary: {e}")
        return {
            "connected": True,
            "cash_balance": 0,
            "portfolio_value": 0,
            "total_value": 0,
            "error": str(e)
        }


@router.post("/session/reconnect")
async def reconnect_session(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """
    Attempt to reconnect to IB Gateway.

    Use this if the connection was lost or needs to be reset.
    """
    logger.info(f"User {user.email} requested IB Gateway reconnection")

    success = await reconnect_ib_client()

    if success:
        ib_client = get_ib_client()
        accounts = await ib_client.get_accounts()
        return {
            "success": True,
            "message": "Successfully reconnected to IB Gateway",
            "connected": True,
            "ready_for_orders": ib_client.is_ready_for_orders(),
            "accounts": accounts,
            "primary_account": ib_client.get_primary_account()
        }
    else:
        return {
            "success": False,
            "message": "Failed to reconnect to IB Gateway. Ensure it's running on 127.0.0.1:4001",
            "connected": False,
            "ready_for_orders": False
        }
