"""Virtual Trading Accounts API endpoints.

Supports multiple virtual accounts per user. Each account has independent
cash balance, holdings, and order history. All real trades execute on the
shared LYNX/IB account.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List
from middleware.auth import get_current_user, require_trading_owner, require_trading_approved, get_client_ip
from models.schemas import UserContext
from models.virtual_account_schemas import (
    VirtualAccountCreate,
    VirtualAccountResponse,
    VirtualAccountListResponse,
    CashAllocationRequest,
    CashAllocationResponse,
    CashAllocationLogEntry,
    CashAllocationLogResponse,
    VirtualOrderRequest,
    VirtualOrderResponse,
    VirtualOrderStatus,
    VirtualOrderListResponse,
    VirtualPosition,
    VirtualPositionsResponse,
    VirtualTransactionItem,
    VirtualTransactionListResponse,
)
from services.virtual_account_service import get_virtual_account_service, VirtualAccountError
from services.virtual_order_service import get_virtual_order_service, VirtualOrderError
from services.virtual_portfolio_service import get_virtual_portfolio_service
from services.cash_allocation_service import get_cash_allocation_service, CashAllocationError
from services.ib_client import get_ib_client
import httpx
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/virtual-accounts", tags=["Virtual Accounts"])

# Yahoo Finance price cache for fallback when IB has no data
_yahoo_price_cache: dict = {}  # symbol -> {price, timestamp}
YAHOO_CACHE_TTL = 300  # 5 minutes

# Mapping: IB symbol -> Yahoo Finance symbol (for ETFs where they differ)
YAHOO_SYMBOL_MAP = {
    "VUAA": "VUAA.DE",
    "CAC": "CAC.PA",
    "IWDA": "IWDA.AS",
    "EMIM": "EMIM.AS",
    "SXRS": "SXRS.DE",
    "IWDP": "IWDP.AS",
    "VWCE": "VWCE.DE",
    "SXR8": "SXR8.DE",
    "VFEM": "VFEM.AS",
    "IMEU": "IMEU.AS",
}


async def _get_yahoo_price(symbol: str) -> Optional[float]:
    """Fetch last price from Yahoo Finance as fallback."""
    cached = _yahoo_price_cache.get(symbol)
    if cached and (time.time() - cached["timestamp"]) < YAHOO_CACHE_TTL:
        return cached["price"]

    yahoo_sym = YAHOO_SYMBOL_MAP.get(symbol, f"{symbol}.AS")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_sym}",
                params={"interval": "1d", "range": "1d"},
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if res.status_code == 200:
                data = res.json()
                result = data.get("chart", {}).get("result", [])
                if result:
                    price = result[0].get("meta", {}).get("regularMarketPrice")
                    if price and price > 0:
                        _yahoo_price_cache[symbol] = {"price": price, "timestamp": time.time()}
                        return price
    except Exception as e:
        logger.debug(f"Yahoo Finance fallback failed for {symbol}: {e}")
    return None


# =============================================================================
# HELPER
# =============================================================================

def _require_admin(user: UserContext) -> None:
    """Raise 403 if user is not an admin."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


# =============================================================================
# ACCOUNT MANAGEMENT
# =============================================================================

@router.post("", response_model=VirtualAccountResponse)
async def create_virtual_account(
    request: VirtualAccountCreate,
    user: UserContext = Depends(get_current_user)
) -> VirtualAccountResponse:
    """
    Create a new virtual trading account.

    Account starts with 0 cash. Admin must allocate cash separately.
    """
    _require_admin(user)

    service = get_virtual_account_service()
    try:
        account = await service.create_account(
            owner_id=user.customer_id,
            name=request.name,
            description=request.description,
        )
        return VirtualAccountResponse(**account)

    except VirtualAccountError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get("", response_model=VirtualAccountListResponse)
async def list_virtual_accounts(
    all_users: bool = Query(False, description="Admin: list all accounts across users"),
    user: UserContext = Depends(get_current_user)
) -> VirtualAccountListResponse:
    """
    List virtual accounts.

    By default lists current user's accounts. Admin can pass all_users=true.
    """
    service = get_virtual_account_service()

    if all_users:
        _require_admin(user)
        accounts = await service.get_all_accounts()
    else:
        accounts = await service.get_accounts(user.customer_id)

    return VirtualAccountListResponse(
        accounts=[VirtualAccountResponse(**a) for a in accounts],
        count=len(accounts)
    )


@router.get("/me", response_model=VirtualAccountResponse)
async def get_my_default_account(
    user: UserContext = Depends(get_current_user)
) -> VirtualAccountResponse:
    """
    Get the current user's default virtual account.

    Auto-creates one if the user has no virtual accounts.
    Used by the frontend to resolve the user's trading portfolio.
    """
    service = get_virtual_account_service()

    # Fast path: query accounts directly without fetching holdings
    try:
        import httpx as _httpx
        async with _httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{service.base_url}/virtual_accounts",
                headers=service.headers,
                params={
                    "owner_id": f"eq.{user.customer_id}",
                    "is_active": "eq.true",
                    "select": "*",
                    "order": "created_at.asc",
                    "limit": "1"
                }
            )
            response.raise_for_status()
            rows = response.json() or []
            if rows:
                account = service._build_account_dict(rows[0])
                return VirtualAccountResponse(**account)
    except Exception as e:
        logger.error(f"Fast path failed for user {user.customer_id}: {e}")
        # Retry once with the full service method before creating a new account
        try:
            accounts = await service.get_accounts(user.customer_id)
            if accounts:
                return VirtualAccountResponse(**accounts[0])
        except Exception as e2:
            logger.error(f"Fallback also failed for user {user.customer_id}: {e2}")
            raise HTTPException(status_code=503, detail="Unable to fetch account. Please try again.")

    # Only auto-create if user truly has no accounts (no rows returned above)
    try:
        account = await service.create_account(
            owner_id=user.customer_id,
            name="Portfolio",
            description="Default trading portfolio"
        )
        return VirtualAccountResponse(**account)
    except VirtualAccountError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create default account: {e.message}")


# =============================================================================
# ADMIN: CASH ALLOCATION
# =============================================================================

@router.get("/admin/cash-overview")
async def get_cash_overview(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """
    Admin overview: real LYNX cash vs allocated virtual cash.

    Shows total LYNX cash, how much is assigned to virtual accounts,
    how much is reserved for pending orders, and the unallocated remainder.
    free_cash = lynx_cash - total_assigned - total_reserved
    """
    _require_admin(user)

    # Fetch real LYNX cash
    ib_client = get_ib_client()
    lynx_cash = 0.0
    ib_connected = False
    try:
        if ib_client.is_connected() and user.ib_account_id:
            account_values = await ib_client.get_account_values(user.ib_account_id)
            lynx_cash = float(
                account_values.get("AvailableFunds") or
                account_values.get("AvailableFunds-S") or
                account_values.get("TotalCashValue") or
                account_values.get("CashBalance") or
                0
            )
            ib_connected = True
    except Exception as e:
        logger.error(f"Error fetching LYNX cash: {e}")

    # Fetch all virtual accounts with balances
    service = get_virtual_account_service()
    accounts = await service.get_all_accounts()

    total_assigned = sum(a.get("assigned_cash", 0) for a in accounts)
    total_reserved = sum(a.get("reserved_cash", 0) for a in accounts)
    total_available = sum(a.get("available_cash", 0) for a in accounts)
    unallocated = lynx_cash - total_assigned - total_reserved

    return {
        "lynx_cash": round(lynx_cash, 2),
        "ib_connected": ib_connected,
        "total_assigned": round(total_assigned, 2),
        "total_reserved": round(total_reserved, 2),
        "total_available": round(total_available, 2),
        "unallocated": round(max(0, unallocated), 2),
        "overallocated": unallocated < -0.01,
        "accounts": [
            {
                "id": a["id"],
                "owner_id": a["owner_id"],
                "owner_name": a.get("owner_name"),
                "name": a["name"],
                "is_active": a["is_active"],
                "is_frozen": a.get("is_frozen", False),
                "assigned_cash": a.get("assigned_cash", 0),
                "reserved_cash": a.get("reserved_cash", 0),
                "available_cash": a.get("available_cash", 0),
                "holdings_count": a.get("holdings_count", 0),
            }
            for a in accounts
        ]
    }


@router.post("/{account_id}/allocate", response_model=CashAllocationResponse)
async def allocate_cash(
    account_id: str,
    request: CashAllocationRequest,
    user: UserContext = Depends(get_current_user)
) -> CashAllocationResponse:
    """
    Allocate or deallocate cash for a virtual account. Admin only.

    Positive delta = allocate more cash. Negative delta = deallocate.
    Enforces: SUM(assigned + reserved) <= LYNX real cash (for positive delta).
    All mutations are atomic via PostgreSQL RPC with row-level locks.
    """
    _require_admin(user)

    # Fetch real LYNX cash for ceiling check
    ib_client = get_ib_client()
    lynx_cash = 0.0
    try:
        if ib_client.is_connected() and user.ib_account_id:
            account_values = await ib_client.get_account_values(user.ib_account_id)
            lynx_cash = float(
                account_values.get("AvailableFunds") or
                account_values.get("AvailableFunds-S") or
                account_values.get("TotalCashValue") or
                account_values.get("CashBalance") or
                0
            )
    except Exception as e:
        logger.error(f"Error fetching LYNX cash for allocation: {e}")
        raise HTTPException(status_code=503, detail="Cannot verify LYNX cash. IB Gateway may be disconnected.")

    if lynx_cash <= 0 and request.delta > 0:
        raise HTTPException(status_code=400, detail="Cannot allocate: LYNX cash is 0 or unavailable.")

    cash_service = get_cash_allocation_service()
    try:
        result = await cash_service.admin_allocate(
            account_id=account_id,
            admin_id=user.customer_id,
            delta=request.delta,
            lynx_cash=lynx_cash,
            description=request.description,
        )
        return CashAllocationResponse(
            success=True,
            assigned_cash=result.get("assigned_cash", 0),
            reserved_cash=result.get("reserved_cash", 0),
            available_cash=result.get("available_cash", 0),
            message=f"{'Allocated' if request.delta > 0 else 'Deallocated'} {abs(request.delta):.2f} EUR."
        )
    except CashAllocationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.delete("/{account_id}/allocate", response_model=CashAllocationResponse)
async def delete_cash_allocation(
    account_id: str,
    user: UserContext = Depends(get_current_user)
) -> CashAllocationResponse:
    """
    Delete (reset to zero) all cash allocated to a virtual account. Admin only.

    Fails if the account has reserved cash (pending orders).
    """
    _require_admin(user)

    cash_service = get_cash_allocation_service()
    account_cash = await cash_service.get_account_cash(account_id)

    if not account_cash:
        raise HTTPException(status_code=404, detail="Virtual account not found.")

    reserved = float(account_cash.get("reserved_cash", 0))
    if reserved > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete allocation: account has {reserved:.2f} EUR reserved for pending orders."
        )

    assigned = float(account_cash.get("assigned_cash", 0))
    if assigned == 0:
        return CashAllocationResponse(
            success=True,
            assigned_cash=0,
            reserved_cash=0,
            available_cash=0,
            message="Allocation already zero."
        )

    try:
        result = await cash_service.admin_allocate(
            account_id=account_id,
            admin_id=user.customer_id,
            delta=-assigned,
            lynx_cash=0,
            description="Cash allocation deleted (reset to zero)",
        )
        return CashAllocationResponse(
            success=True,
            assigned_cash=result.get("assigned_cash", 0),
            reserved_cash=result.get("reserved_cash", 0),
            available_cash=result.get("available_cash", 0),
            message=f"Deleted allocation of {assigned:.2f} EUR."
        )
    except CashAllocationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get("/admin/allocation-log/{account_id}", response_model=CashAllocationLogResponse)
async def get_allocation_log(
    account_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: UserContext = Depends(get_current_user)
) -> CashAllocationLogResponse:
    """Get cash allocation audit log for a virtual account. Admin only."""
    _require_admin(user)

    cash_service = get_cash_allocation_service()
    entries = await cash_service.get_allocation_log(account_id, limit=limit, offset=offset)

    return CashAllocationLogResponse(
        entries=[
            CashAllocationLogEntry(
                id=e["id"],
                admin_id=e["admin_id"],
                virtual_account_id=e["virtual_account_id"],
                action=e["action"],
                amount=e.get("amount"),
                old_assigned=e.get("old_assigned"),
                new_assigned=e.get("new_assigned"),
                old_reserved=e.get("old_reserved"),
                new_reserved=e.get("new_reserved"),
                old_available=e.get("old_available"),
                new_available=e.get("new_available"),
                description=e.get("description"),
                order_intention_id=str(e["order_intention_id"]) if e.get("order_intention_id") else None,
                created_at=e["created_at"],
            )
            for e in entries
        ],
        count=len(entries),
    )


@router.get("/{account_id}", response_model=VirtualAccountResponse)
async def get_virtual_account(
    account_id: str,
    user: UserContext = Depends(get_current_user)
) -> VirtualAccountResponse:
    """Get a virtual account with portfolio summary."""
    service = get_virtual_account_service()
    account = await service.get_account(account_id, user.customer_id)

    if not account:
        raise HTTPException(status_code=404, detail="Virtual account not found.")

    return VirtualAccountResponse(**account)


@router.delete("/{account_id}")
async def deactivate_virtual_account(
    account_id: str,
    user: UserContext = Depends(get_current_user)
) -> dict:
    """Deactivate a virtual account (soft delete). Admin only."""
    _require_admin(user)

    service = get_virtual_account_service()
    success = await service.deactivate_account(account_id, user.customer_id)

    if not success:
        raise HTTPException(status_code=404, detail="Account not found or already inactive.")

    return {"success": True, "message": "Account deactivated."}


# =============================================================================
# TRADING
# =============================================================================

@router.post("/{account_id}/order", response_model=VirtualOrderResponse)
async def place_virtual_order(
    account_id: str,
    order: VirtualOrderRequest,
    request: Request,
    confirmed: bool = Query(False),
    user: UserContext = Depends(require_trading_approved)
) -> VirtualOrderResponse:
    """
    Place an order from a virtual account.

    Validates virtual balance, then places a REAL order on the shared LYNX/IB account.
    Virtual portfolio is updated on success.

    Any approved user with a linked broker can trade via their virtual account.
    The virtual balance is the safety gate (can't spend more than allocated).
    """
    service = get_virtual_order_service()
    client_ip = get_client_ip(request)

    result = await service.place_virtual_order(
        user=user,
        virtual_account_id=account_id,
        symbol=order.symbol,
        conid=order.conid,
        side=order.side.value,
        quantity=order.quantity,
        order_type=order.order_type.value,
        limit_price=order.limit_price,
        stop_price=order.stop_price,
        estimated_price=order.estimated_price,
        client_ip=client_ip
    )

    if not result.success:
        # Return as successful HTTP response with success=false in body
        # (consistent with existing /trading/order behavior)
        return VirtualOrderResponse(
            success=False,
            virtual_account_id=account_id,
            virtual_account_name=result.virtual_account_name,
            message=result.message,
            details=result.details
        )

    return VirtualOrderResponse(
        success=True,
        order_id=result.order_id,
        virtual_account_id=account_id,
        virtual_account_name=result.virtual_account_name,
        message=result.message,
        details=result.details
    )


# =============================================================================
# ORDERS / POSITIONS / TRANSACTIONS
# =============================================================================

@router.get("/{account_id}/orders", response_model=VirtualOrderListResponse)
async def get_account_orders(
    account_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: UserContext = Depends(get_current_user)
) -> VirtualOrderListResponse:
    """Get order history for a virtual account."""
    # Verify ownership
    account_service = get_virtual_account_service()
    account = await account_service.get_account(account_id, user.customer_id)
    if not account:
        raise HTTPException(status_code=404, detail="Virtual account not found.")

    order_service = get_virtual_order_service()
    orders = await order_service.get_account_orders(
        user_id=user.customer_id,
        virtual_account_id=account_id,
        limit=limit,
        offset=offset
    )

    return VirtualOrderListResponse(
        orders=[
            VirtualOrderStatus(
                id=o["id"],
                virtual_account_id=account_id,
                symbol=o["symbol"],
                side=o["side"],
                quantity=o["quantity"],
                order_type=o.get("order_type", "MKT"),
                status=o["status"],
                filled_quantity=o.get("filled_quantity"),
                fill_price=o.get("fill_price"),
                fill_value=o.get("fill_value"),
                estimated_price=o.get("estimated_price"),
                estimated_value=o.get("estimated_value"),
                reserved_amount=o.get("reserved_amount"),
                submitted_at=o["submitted_at"],
                executed_at=o.get("executed_at")
            )
            for o in orders
        ],
        count=len(orders)
    )


@router.get("/{account_id}/positions", response_model=VirtualPositionsResponse)
async def get_account_positions(
    account_id: str,
    user: UserContext = Depends(get_current_user)
) -> VirtualPositionsResponse:
    """
    Get virtual holdings with live market prices.

    Enriches holdings with current price data from IB Gateway.
    """
    # Lightweight ownership check: query account row directly (no holdings sub-query)
    account_service = get_virtual_account_service()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{account_service.base_url}/virtual_accounts",
                headers=account_service.headers,
                params={
                    "id": f"eq.{account_id}",
                    "owner_id": f"eq.{user.customer_id}",
                    "select": "id,name,available_cash,assigned_cash,reserved_cash"
                }
            )
            response.raise_for_status()
            rows = response.json() or []
            if not rows:
                raise HTTPException(status_code=404, detail="Virtual account not found.")
            account_row = rows[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify account ownership: {e}")
        raise HTTPException(status_code=503, detail="Unable to verify account.")

    portfolio_service = get_virtual_portfolio_service()
    holdings = await portfolio_service.get_holdings(user.customer_id, virtual_account_id=account_id)

    # Get live prices
    ib_client = get_ib_client()
    market_data = ib_client.get_all_market_data()

    positions = []
    total_market_value = 0
    total_unrealized_pnl = 0

    for h in holdings:
        symbol = h["symbol"]
        conid = h["conid"]
        qty = float(h["quantity"])
        avg_cost = float(h["avg_cost_basis"])

        # Find live price from IB
        last_price = None
        for cid, data in market_data.items():
            if data.get("symbol") == symbol or cid == conid:
                last_price = data.get("last") or data.get("bid")
                break

        # Fallback to Yahoo Finance if IB has no data
        if not last_price:
            yahoo_price = await _get_yahoo_price(symbol)
            if yahoo_price:
                last_price = yahoo_price

        market_value = last_price * qty if last_price else None
        cost_value = avg_cost * qty
        unrealized_pnl = (market_value - cost_value) if market_value else None
        unrealized_pnl_pct = (unrealized_pnl / cost_value * 100) if unrealized_pnl and cost_value > 0 else None

        # Use market value if available, otherwise fall back to cost basis
        # so positions always count towards portfolio total
        display_market_value = market_value if market_value else cost_value
        total_market_value += display_market_value
        if unrealized_pnl:
            total_unrealized_pnl += unrealized_pnl

        positions.append(VirtualPosition(
            symbol=symbol,
            conid=conid,
            isin=h.get("isin"),
            name=h.get("name"),
            quantity=qty,
            avg_cost_basis=avg_cost,
            last_price=last_price if last_price else avg_cost,
            market_value=display_market_value,
            unrealized_pnl=unrealized_pnl if unrealized_pnl else 0,
            unrealized_pnl_pct=unrealized_pnl_pct if unrealized_pnl_pct else 0
        ))

    cash = float(account_row.get("available_cash", 0))
    total_portfolio = cash + total_market_value

    return VirtualPositionsResponse(
        virtual_account_id=account_id,
        virtual_account_name=account_row["name"],
        positions=positions,
        count=len(positions),
        total_market_value=total_market_value,
        total_unrealized_pnl=total_unrealized_pnl if total_unrealized_pnl else 0,
        cash_balance=cash,
        total_portfolio_value=total_portfolio
    )


@router.get("/{account_id}/transactions", response_model=VirtualTransactionListResponse)
async def get_account_transactions(
    account_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    type: Optional[str] = Query(None, description="Filter: deposit, withdrawal, buy, sell"),
    user: UserContext = Depends(get_current_user)
) -> VirtualTransactionListResponse:
    """Get transaction history for a virtual account."""
    # Verify ownership
    account_service = get_virtual_account_service()
    account = await account_service.get_account(account_id, user.customer_id)
    if not account:
        raise HTTPException(status_code=404, detail="Virtual account not found.")

    portfolio_service = get_virtual_portfolio_service()
    transactions = await portfolio_service.get_transactions(
        user_id=user.customer_id,
        limit=limit,
        offset=offset,
        type_filter=type,
        virtual_account_id=account_id
    )

    return VirtualTransactionListResponse(
        transactions=[
            VirtualTransactionItem(
                id=t["id"],
                type=t["type"],
                symbol=t.get("symbol"),
                quantity=t.get("quantity"),
                price=t.get("price"),
                amount=t["amount"],
                balance_after=t["balance_after"],
                description=t.get("description"),
                created_at=t["created_at"]
            )
            for t in transactions
        ],
        count=len(transactions),
        limit=limit,
        offset=offset
    )
