"""Account management endpoints with multi-user isolation."""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict
from models.schemas import (
    LinkAccountRequest, LinkAccountResponse, SessionStatusResponse,
    UserContext
)
from middleware.auth import get_current_user, require_trading_approved, require_broker_linked, get_client_ip
from services.ib_client import get_ib_client, reconnect_ib_client
from services.supabase_service import get_supabase_service, SupabaseServiceError
from services.audit import get_audit_service
import logging
import re
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["Account"])

# In-memory storage for LOCAL_DEV_MODE when database is not available
# Maps customer_id -> {"ib_account_id": str, "account_type": str}
_dev_mode_linked_accounts: Dict[int, dict] = {}


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


class SelectAccountRequest(BaseModel):
    """Request to select a specific IB account to link."""
    account_id: str


@router.post("/broker/link", response_model=BrokerLinkResponse)
async def link_broker_account_simple(
    request: Request,
    account_selection: Optional[SelectAccountRequest] = None,
    user: UserContext = Depends(get_current_user)
) -> BrokerLinkResponse:
    """
    Link a LYNX/IB account to the current user.

    MULTI-USER ISOLATION: Each user links their OWN IB account.
    The account must be available in the connected IB Gateway.

    Without request body: Auto-selects the first available account.
    With request body {"account_id": "DU..."}: Links the specified account.

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

    # Get available accounts from IB Gateway
    available_accounts = await ib_client.get_accounts()
    if not available_accounts:
        primary = ib_client.get_primary_account()
        if primary:
            available_accounts = [primary]

    if not available_accounts:
        raise HTTPException(
            status_code=503,
            detail="IB Gateway connected but no accounts available. Please ensure you are logged in to IB Gateway."
        )

    # Determine which account to link
    if account_selection and account_selection.account_id:
        ib_account = account_selection.account_id.strip().upper()
        # Validate the requested account is available
        if ib_account not in available_accounts:
            raise HTTPException(
                status_code=400,
                detail=f"Account {ib_account} is not available in the connected IB Gateway. Available: {available_accounts}"
            )
    else:
        # Auto-select first available
        ib_account = available_accounts[0]

    # Determine account type based on prefix
    if ib_account.startswith("DU") or ib_account.startswith("DF"):
        account_type = "paper"
    else:
        account_type = "live"

    logger.info(f"User {user.customer_id} linking IB account: {ib_account} (type: {account_type})")

    # For LOCAL_DEV_MODE (customer_id=0 or no database), use in-memory storage
    db = get_supabase_service()
    if user.customer_id == 0 or not db.is_configured():
        _dev_mode_linked_accounts[user.customer_id] = {
            "ib_account_id": ib_account,
            "account_type": account_type
        }
        logger.info(f"Dev mode: Account {ib_account} linked in-memory for user {user.customer_id}")
        return BrokerLinkResponse(
            linked=True,
            account_id=ib_account,
            account_type=account_type,
            message=f"Account {ib_account} linked successfully (local mode)"
        )

    # Link the account in database for real users
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save broker account: {e.message}"
        )
    except Exception as e:
        logger.error(f"Error saving to database: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save broker account: {str(e)}"
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
    """
    Get the current user's trading account information.

    MULTI-USER ISOLATION: Only shows this user's linked account.
    No automatic fallback to IB Gateway's primary account.
    """
    ib_client = get_ib_client()

    # STRICT: Only use the user's own linked account
    ib_account_id = user.ib_account_id

    return {
        "customer_id": user.customer_id,
        "email": user.email,
        "trading_status": user.trading_status.value,
        "broker_account_linked": ib_account_id is not None,
        "ib_account_id": ib_account_id,
        "ib_gateway_connected": ib_client.is_connected(),
        "ready_for_orders": ib_client.is_ready_for_orders() and ib_account_id is not None
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
    Get comprehensive account summary including:
    - Cash balance (available for trading)
    - Portfolio value (sum of position market values)
    - Total value (net liquidation)
    - Unrealized P&L (absolute and percentage)
    - Buying power

    MULTI-USER ISOLATION: Only returns data for the user's linked account.
    """
    ib_client = get_ib_client()

    if not ib_client.is_connected():
        return {
            "connected": False,
            "cash_balance": 0,
            "available_funds": 0,
            "portfolio_value": 0,
            "total_value": 0,
            "unrealized_pnl": 0,
            "unrealized_pnl_percent": 0,
            "buying_power": 0,
            "currency": "EUR",
            "data_stale": True,
            "message": "IB Gateway not connected"
        }

    ib_account_id = user.ib_account_id

    if not ib_account_id:
        return {
            "connected": True,
            "cash_balance": 0,
            "available_funds": 0,
            "portfolio_value": 0,
            "total_value": 0,
            "unrealized_pnl": 0,
            "unrealized_pnl_percent": 0,
            "buying_power": 0,
            "currency": "EUR",
            "data_stale": False,
            "message": "No broker account linked. Please link your LYNX account first."
        }

    try:
        # Get account values from IB
        account_values = await ib_client.get_account_values(ib_account_id)

        # Log available tags for debugging
        if account_values:
            logger.info(f"IB account tags available: {list(account_values.keys())}")

        # Core values - IB uses various tag names for cash
        # Common IB tags: TotalCashValue, AvailableFunds, CashBalance, NetLiquidation
        cash_balance = float(
            account_values.get("TotalCashValue") or
            account_values.get("CashBalance") or
            account_values.get("TotalCashBalance") or
            account_values.get("SettledCash") or
            0
        )
        available_funds = float(
            account_values.get("AvailableFunds") or
            account_values.get("BuyingPower") or
            cash_balance
        )
        buying_power = float(account_values.get("BuyingPower") or available_funds)
        net_liquidation = float(account_values.get("NetLiquidation") or 0)
        gross_position_value = float(
            account_values.get("GrossPositionValue") or
            account_values.get("StockMarketValue") or
            0
        )

        # P&L values
        unrealized_pnl = float(account_values.get("UnrealizedPnL", 0))
        realized_pnl = float(account_values.get("RealizedPnL", 0))

        # Calculate P&L percentage (relative to cost basis)
        total_cost = gross_position_value - unrealized_pnl if gross_position_value > 0 else 0
        unrealized_pnl_percent = (unrealized_pnl / total_cost * 100) if total_cost > 0 else 0

        # Get positions with market data for accurate portfolio value
        positions = await ib_client.get_positions(ib_account_id)
        market_data = ib_client.get_all_market_data()

        calculated_portfolio_value = 0
        calculated_unrealized_pnl = 0
        total_cost_basis = 0
        positions_with_prices = 0
        positions_without_prices = 0

        for pos in positions:
            qty = float(pos.get("position", 0))
            avg_cost = float(pos.get("avgCost", 0))
            conid = pos.get("conid")

            if qty == 0:
                continue

            cost_basis = qty * avg_cost
            total_cost_basis += cost_basis

            # Try to get market price
            market_price = None
            if conid and conid in market_data:
                md = market_data[conid]
                market_price = md.get("last") or md.get("bid") or md.get("ask")

            if market_price and market_price > 0:
                market_value = qty * market_price
                calculated_portfolio_value += market_value
                calculated_unrealized_pnl += (market_value - cost_basis)
                positions_with_prices += 1
            else:
                # Fallback: use cost basis as market value
                calculated_portfolio_value += cost_basis
                positions_without_prices += 1

        # Use calculated values if we have market data, otherwise use IB values
        final_portfolio_value = calculated_portfolio_value if positions_with_prices > 0 else gross_position_value
        final_unrealized_pnl = calculated_unrealized_pnl if positions_with_prices > 0 else unrealized_pnl
        final_pnl_percent = (final_unrealized_pnl / total_cost_basis * 100) if total_cost_basis > 0 else 0

        # Mark data as potentially stale if we're missing prices
        data_stale = positions_without_prices > 0 and positions_with_prices == 0

        return {
            "connected": True,
            "account_id": ib_account_id,
            "cash_balance": cash_balance,
            "available_funds": available_funds,
            "buying_power": buying_power,
            "portfolio_value": final_portfolio_value,
            "total_value": net_liquidation if net_liquidation > 0 else (cash_balance + final_portfolio_value),
            "unrealized_pnl": final_unrealized_pnl,
            "unrealized_pnl_percent": round(final_pnl_percent, 2),
            "realized_pnl": realized_pnl,
            "currency": "EUR",
            "data_stale": data_stale,
            "positions_with_prices": positions_with_prices,
            "positions_without_prices": positions_without_prices
        }
    except Exception as e:
        logger.error(f"Error getting account summary for {ib_account_id}: {e}")
        return {
            "connected": True,
            "cash_balance": 0,
            "available_funds": 0,
            "portfolio_value": 0,
            "total_value": 0,
            "unrealized_pnl": 0,
            "unrealized_pnl_percent": 0,
            "buying_power": 0,
            "currency": "EUR",
            "data_stale": True,
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
