"""Pydantic schemas for request/response models."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class OrderSide(str, Enum):
    """Order side enumeration."""
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, Enum):
    """Order type enumeration."""
    MARKET = "MKT"
    LIMIT = "LMT"
    STOP = "STP"
    STOP_LIMIT = "STP_LMT"


class TradingStatus(str, Enum):
    """User trading status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ETF Models
class ETFInfo(BaseModel):
    """ETF information."""
    symbol: str
    name: str
    conid: int  # IB Contract ID
    exchange: str
    currency: str


class ETFQuote(BaseModel):
    """ETF quote with market data."""
    symbol: str
    conid: int
    last_price: Optional[float] = None
    bid: Optional[float] = None
    ask: Optional[float] = None
    bid_size: Optional[int] = None
    ask_size: Optional[int] = None
    volume: Optional[int] = None
    timestamp: Optional[str] = None


class ETFListResponse(BaseModel):
    """Response for ETF list endpoint."""
    etfs: list[ETFInfo]
    count: int


class QuotesResponse(BaseModel):
    """Response for quotes endpoint."""
    quotes: list[ETFQuote]
    timestamp: str


# Order Models
class OrderRequest(BaseModel):
    """Request to place an order."""
    symbol: str
    conid: int
    side: OrderSide
    quantity: int = Field(..., gt=0)
    order_type: OrderType = OrderType.MARKET
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None


class OrderResponse(BaseModel):
    """Response after placing an order."""
    success: bool
    order_id: Optional[str] = None
    message: str
    details: Optional[dict] = None


class OrderStatus(BaseModel):
    """Order status information."""
    order_id: str
    symbol: str
    side: str
    quantity: int
    filled_quantity: int
    status: str  # Submitted, Filled, Cancelled, etc.
    avg_fill_price: Optional[float] = None
    created_at: Optional[str] = None


class OrdersResponse(BaseModel):
    """Response for orders list endpoint."""
    orders: list[OrderStatus]
    count: int


# Position Models
class Position(BaseModel):
    """Portfolio position."""
    symbol: str
    conid: int
    quantity: Decimal
    avg_cost: Decimal
    market_value: Optional[Decimal] = None
    unrealized_pnl: Optional[Decimal] = None
    realized_pnl: Optional[Decimal] = None
    currency: str


class PositionsResponse(BaseModel):
    """Response for positions endpoint."""
    positions: list[Position]
    account_id: str
    count: int


# Account Models
class LinkAccountRequest(BaseModel):
    """Request to link a broker account."""
    account_id: str = Field(..., min_length=1, max_length=50)
    account_type: str = "paper"


class LinkAccountResponse(BaseModel):
    """Response after linking account."""
    success: bool
    message: str
    broker_account_id: Optional[int] = None


class SessionStatusResponse(BaseModel):
    """IB Gateway session status."""
    authenticated: bool
    connected: bool
    competing: bool = False
    message: str


# User context for requests
class UserContext(BaseModel):
    """User context passed through middleware."""
    customer_id: int
    email: str
    trading_status: TradingStatus
    broker_account_id: Optional[int] = None
    ib_account_id: Optional[str] = None
