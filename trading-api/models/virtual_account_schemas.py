"""Pydantic schemas for virtual trading accounts."""
from pydantic import BaseModel, Field
from typing import Optional, List
from models.schemas import OrderSide, OrderType


# =============================================================================
# ACCOUNT MANAGEMENT
# =============================================================================

class VirtualAccountCreate(BaseModel):
    """Request to create a virtual trading account. Account starts at 0 cash."""
    name: str = Field(..., min_length=1, max_length=100, description="Account name")
    description: Optional[str] = Field(None, max_length=500)


class VirtualAccountUpdate(BaseModel):
    """Request to update a virtual account."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class VirtualAccountResponse(BaseModel):
    """Virtual account with cash allocation and portfolio summary."""
    id: str
    owner_id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    is_frozen: bool = False
    # New cash model (source of truth)
    assigned_cash: float = 0
    reserved_cash: float = 0
    available_cash: float = 0
    # Backward compatibility aliases
    cash_balance: float = 0
    reserved_balance: float = 0
    available_balance: float = 0
    holdings_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class VirtualAccountListResponse(BaseModel):
    """List of virtual accounts."""
    accounts: List[VirtualAccountResponse]
    count: int


# =============================================================================
# CASH ALLOCATION (admin only)
# =============================================================================

class CashAllocationRequest(BaseModel):
    """Admin cash allocation request. Positive delta = allocate, negative = deallocate."""
    delta: float = Field(..., description="Amount to allocate (+) or deallocate (-) in EUR")
    description: Optional[str] = Field(None, max_length=500)


class CashAllocationResponse(BaseModel):
    """Result of a cash allocation operation."""
    success: bool
    assigned_cash: float = 0
    reserved_cash: float = 0
    available_cash: float = 0
    message: str


class CashAllocationLogEntry(BaseModel):
    """Single cash allocation audit log entry."""
    id: str
    admin_id: int
    virtual_account_id: str
    action: str
    amount: Optional[float] = None
    old_assigned: Optional[float] = None
    new_assigned: Optional[float] = None
    old_reserved: Optional[float] = None
    new_reserved: Optional[float] = None
    old_available: Optional[float] = None
    new_available: Optional[float] = None
    description: Optional[str] = None
    order_intention_id: Optional[str] = None
    created_at: str


class CashAllocationLogResponse(BaseModel):
    """Cash allocation audit log."""
    entries: List[CashAllocationLogEntry]
    count: int


# =============================================================================
# VIRTUAL ORDERS
# =============================================================================

class VirtualOrderRequest(BaseModel):
    """Place an order from a virtual account."""
    symbol: str = Field(..., description="ETF symbol (e.g., IWDA)")
    conid: int = Field(..., description="IB contract ID")
    side: OrderSide
    quantity: int = Field(..., gt=0, description="Number of shares")
    order_type: OrderType = OrderType.MARKET
    limit_price: Optional[float] = Field(None, description="Limit price for LMT orders")
    stop_price: Optional[float] = Field(None, description="Stop price for STP orders")
    estimated_price: Optional[float] = Field(None, description="Current market price estimate")


class VirtualOrderResponse(BaseModel):
    """Response after placing a virtual order."""
    success: bool
    order_id: Optional[str] = None
    virtual_account_id: str
    virtual_account_name: str = ""
    message: str
    details: Optional[dict] = None


class VirtualOrderStatus(BaseModel):
    """Virtual order status."""
    id: str
    virtual_account_id: str
    symbol: str
    side: str
    quantity: int
    order_type: str
    status: str
    filled_quantity: Optional[float] = None
    fill_price: Optional[float] = None
    fill_value: Optional[float] = None
    estimated_price: Optional[float] = None
    estimated_value: Optional[float] = None
    reserved_amount: Optional[float] = None
    submitted_at: str
    executed_at: Optional[str] = None


class VirtualOrderListResponse(BaseModel):
    """List of virtual orders."""
    orders: List[VirtualOrderStatus]
    count: int


# =============================================================================
# VIRTUAL POSITIONS (holdings with live prices)
# =============================================================================

class VirtualPosition(BaseModel):
    """Virtual holding with market data."""
    symbol: str
    conid: int
    isin: Optional[str] = None
    name: Optional[str] = None
    quantity: float
    avg_cost_basis: float
    last_price: Optional[float] = None
    market_value: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_pct: Optional[float] = None


class VirtualPositionsResponse(BaseModel):
    """Virtual positions list."""
    virtual_account_id: str
    virtual_account_name: str
    positions: List[VirtualPosition]
    count: int
    total_market_value: Optional[float] = None
    total_unrealized_pnl: Optional[float] = None
    cash_balance: float = 0
    total_portfolio_value: Optional[float] = None


# =============================================================================
# VIRTUAL TRANSACTIONS
# =============================================================================

class VirtualTransactionItem(BaseModel):
    """Single transaction."""
    id: str
    type: str
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    amount: float
    balance_after: float
    description: Optional[str] = None
    created_at: str


class VirtualTransactionListResponse(BaseModel):
    """Transaction history."""
    transactions: List[VirtualTransactionItem]
    count: int
    limit: int
    offset: int
