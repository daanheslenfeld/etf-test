"""Virtual Portfolio endpoints for batch trading system.

User-facing endpoints to view and manage virtual portfolios.
All endpoints are isolated per user via authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from middleware.auth import get_current_user
from models.schemas import UserContext
from services.virtual_portfolio_service import get_virtual_portfolio_service, VirtualPortfolioError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/virtual", tags=["Virtual Portfolio"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class HoldingResponse(BaseModel):
    """Single holding response."""
    id: str
    symbol: str
    conid: int
    isin: Optional[str] = None
    name: Optional[str] = None
    quantity: float
    avg_cost_basis: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PortfolioResponse(BaseModel):
    """Complete portfolio response."""
    user_id: int
    cash_balance: float
    reserved_balance: float
    available_balance: float
    total_deposited: float
    total_withdrawn: float
    holdings: List[HoldingResponse]
    total_holdings_value: Optional[float] = None  # Requires market data
    total_value: Optional[float] = None  # cash + holdings
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TransactionResponse(BaseModel):
    """Transaction history item."""
    id: str
    type: str
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    amount: float
    balance_after: float
    description: Optional[str] = None
    created_at: str


class TransactionListResponse(BaseModel):
    """Transaction list response."""
    transactions: List[TransactionResponse]
    total: int
    limit: int
    offset: int


# =============================================================================
# ADMIN MODELS (for deposits/withdrawals)
# =============================================================================

class DepositRequest(BaseModel):
    """Deposit request (admin only)."""
    user_id: int
    amount: float = Field(..., gt=0, description="Amount to deposit")
    description: Optional[str] = None


class WithdrawRequest(BaseModel):
    """Withdraw request (admin only)."""
    user_id: int
    amount: float = Field(..., gt=0, description="Amount to withdraw")
    description: Optional[str] = None


class BalanceResponse(BaseModel):
    """Simple balance response."""
    success: bool
    new_balance: Optional[float] = None
    message: Optional[str] = None


# =============================================================================
# USER ENDPOINTS
# =============================================================================

@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    user: UserContext = Depends(get_current_user)
) -> PortfolioResponse:
    """
    Get current user's virtual portfolio.

    Returns cash balance, reserved amount, available balance, and all holdings.
    """
    service = get_virtual_portfolio_service()

    portfolio = await service.get_portfolio(user.customer_id)

    if not portfolio:
        # Create empty portfolio for new user
        return PortfolioResponse(
            user_id=user.customer_id,
            cash_balance=0,
            reserved_balance=0,
            available_balance=0,
            total_deposited=0,
            total_withdrawn=0,
            holdings=[]
        )

    return PortfolioResponse(
        user_id=portfolio["user_id"],
        cash_balance=portfolio["cash_balance"],
        reserved_balance=portfolio["reserved_balance"],
        available_balance=portfolio["available_balance"],
        total_deposited=portfolio["total_deposited"],
        total_withdrawn=portfolio["total_withdrawn"],
        holdings=[
            HoldingResponse(
                id=h["id"],
                symbol=h["symbol"],
                conid=h["conid"],
                isin=h.get("isin"),
                name=h.get("name"),
                quantity=h["quantity"],
                avg_cost_basis=h["avg_cost_basis"],
                created_at=h.get("created_at"),
                updated_at=h.get("updated_at")
            )
            for h in portfolio.get("holdings", [])
        ],
        created_at=portfolio.get("created_at"),
        updated_at=portfolio.get("updated_at")
    )


@router.get("/portfolio/holdings", response_model=List[HoldingResponse])
async def get_holdings(
    user: UserContext = Depends(get_current_user)
) -> List[HoldingResponse]:
    """
    Get current user's share holdings.

    Returns list of all holdings with quantity > 0.
    """
    service = get_virtual_portfolio_service()

    holdings = await service.get_holdings(user.customer_id)

    return [
        HoldingResponse(
            id=h["id"],
            symbol=h["symbol"],
            conid=h["conid"],
            isin=h.get("isin"),
            name=h.get("name"),
            quantity=h["quantity"],
            avg_cost_basis=h["avg_cost_basis"],
            created_at=h.get("created_at"),
            updated_at=h.get("updated_at")
        )
        for h in holdings
    ]


@router.get("/portfolio/transactions", response_model=TransactionListResponse)
async def get_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    type: Optional[str] = Query(None, description="Filter by type: deposit, withdrawal, buy, sell"),
    user: UserContext = Depends(get_current_user)
) -> TransactionListResponse:
    """
    Get current user's transaction history.

    Returns paginated list of all transactions.
    """
    service = get_virtual_portfolio_service()

    transactions = await service.get_transactions(
        user_id=user.customer_id,
        limit=limit,
        offset=offset,
        type_filter=type
    )

    return TransactionListResponse(
        transactions=[
            TransactionResponse(
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
        total=len(transactions),  # TODO: Get actual count
        limit=limit,
        offset=offset
    )


@router.get("/portfolio/balance")
async def get_balance(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """
    Get current user's available cash balance.

    Quick endpoint for checking if user can afford an order.
    """
    service = get_virtual_portfolio_service()

    balance = await service.get_cash_balance(user.customer_id)

    return {
        "available_balance": float(balance),
        "user_id": user.customer_id
    }


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@router.post("/admin/deposit", response_model=BalanceResponse)
async def admin_deposit(
    request: DepositRequest,
    user: UserContext = Depends(get_current_user)
) -> BalanceResponse:
    """
    Deposit funds to a user's virtual portfolio.

    ADMIN ONLY - Requires trading owner permission.
    """
    from config import get_settings
    settings = get_settings()

    # Only trading owner can deposit
    if not settings.is_trading_owner(user.email):
        raise HTTPException(
            status_code=403,
            detail="Admin access required for deposits."
        )

    service = get_virtual_portfolio_service()

    success = await service.deposit(
        user_id=request.user_id,
        amount=Decimal(str(request.amount)),
        description=request.description or f"Admin deposit by {user.email}"
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to process deposit."
        )

    # Get updated balance
    portfolio = await service.get_portfolio(request.user_id)
    new_balance = portfolio["cash_balance"] if portfolio else 0

    logger.info(f"Admin {user.email} deposited {request.amount} to user {request.user_id}")

    return BalanceResponse(
        success=True,
        new_balance=new_balance,
        message=f"Deposited {request.amount} EUR to user {request.user_id}"
    )


@router.post("/admin/withdraw", response_model=BalanceResponse)
async def admin_withdraw(
    request: WithdrawRequest,
    user: UserContext = Depends(get_current_user)
) -> BalanceResponse:
    """
    Withdraw funds from a user's virtual portfolio.

    ADMIN ONLY - Requires trading owner permission.
    Will fail if insufficient available funds.
    """
    from config import get_settings
    settings = get_settings()

    # Only trading owner can withdraw
    if not settings.is_trading_owner(user.email):
        raise HTTPException(
            status_code=403,
            detail="Admin access required for withdrawals."
        )

    service = get_virtual_portfolio_service()

    success = await service.withdraw(
        user_id=request.user_id,
        amount=Decimal(str(request.amount)),
        description=request.description or f"Admin withdrawal by {user.email}"
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Withdrawal failed. Insufficient available funds or invalid user."
        )

    # Get updated balance
    portfolio = await service.get_portfolio(request.user_id)
    new_balance = portfolio["cash_balance"] if portfolio else 0

    logger.info(f"Admin {user.email} withdrew {request.amount} from user {request.user_id}")

    return BalanceResponse(
        success=True,
        new_balance=new_balance,
        message=f"Withdrew {request.amount} EUR from user {request.user_id}"
    )


@router.get("/admin/portfolio/{user_id}", response_model=PortfolioResponse)
async def admin_get_portfolio(
    user_id: int,
    user: UserContext = Depends(get_current_user)
) -> PortfolioResponse:
    """
    Get any user's virtual portfolio.

    ADMIN ONLY - Requires trading owner permission.
    """
    from config import get_settings
    settings = get_settings()

    # Only trading owner can view other portfolios
    if not settings.is_trading_owner(user.email):
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    service = get_virtual_portfolio_service()

    portfolio = await service.get_portfolio(user_id)

    if not portfolio:
        raise HTTPException(
            status_code=404,
            detail=f"No portfolio found for user {user_id}"
        )

    return PortfolioResponse(
        user_id=portfolio["user_id"],
        cash_balance=portfolio["cash_balance"],
        reserved_balance=portfolio["reserved_balance"],
        available_balance=portfolio["available_balance"],
        total_deposited=portfolio["total_deposited"],
        total_withdrawn=portfolio["total_withdrawn"],
        holdings=[
            HoldingResponse(
                id=h["id"],
                symbol=h["symbol"],
                conid=h["conid"],
                isin=h.get("isin"),
                name=h.get("name"),
                quantity=h["quantity"],
                avg_cost_basis=h["avg_cost_basis"],
                created_at=h.get("created_at"),
                updated_at=h.get("updated_at")
            )
            for h in portfolio.get("holdings", [])
        ],
        created_at=portfolio.get("created_at"),
        updated_at=portfolio.get("updated_at")
    )
