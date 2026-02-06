"""Streaming market data endpoints with offline caching."""
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import os
import logging

from services.ib_client import get_ib_client
from middleware.auth import require_trading_approved, get_current_user
from models.schemas import UserContext

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trading", tags=["Market Data"])

# Cache file path
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MARKET_DATA_CACHE_FILE = os.path.join(CACHE_DIR, "market_data_cache.json")


def _save_cache(data: dict):
    """Save market data to persistent cache."""
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        cache = {
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        with open(MARKET_DATA_CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to save market data cache: {e}")


def _load_cache() -> Optional[dict]:
    """Load market data from persistent cache."""
    try:
        if os.path.exists(MARKET_DATA_CACHE_FILE):
            with open(MARKET_DATA_CACHE_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load market data cache: {e}")
    return None


class MarketDataResponse(BaseModel):
    """Market data for a single symbol."""
    conid: int
    symbol: str
    bid: Optional[float] = None
    ask: Optional[float] = None
    last: Optional[float] = None
    bidSize: Optional[int] = None
    askSize: Optional[int] = None
    volume: Optional[int] = None
    spread: Optional[float] = None
    midPrice: Optional[float] = None
    timestamp: Optional[str] = None
    delayed: bool = False
    subscribed: bool = False


class AllMarketDataResponse(BaseModel):
    """Market data for all symbols."""
    data: list[MarketDataResponse]
    timestamp: str
    subscriptionCount: int


class SubscribeResponse(BaseModel):
    """Response for subscription requests."""
    success: bool
    message: str
    subscriptionCount: int


def _safe_number(value, as_int=False):
    """Return None if value is None, NaN, or Inf; otherwise return the value."""
    import math
    if value is None:
        return None
    try:
        if math.isnan(value) or math.isinf(value):
            return None
    except (TypeError, ValueError):
        return None
    return int(value) if as_int else value


def _format_market_data(data: Optional[dict], subscribed: bool = True) -> Optional[MarketDataResponse]:
    """Format market data dict into response model."""
    if not data:
        return None

    bid = _safe_number(data.get("bid"))
    ask = _safe_number(data.get("ask"))
    last = _safe_number(data.get("last"))

    # Calculate spread and mid price
    spread = None
    mid_price = None
    if bid and ask and bid > 0 and ask > 0:
        spread = round(ask - bid, 4)
        mid_price = round((bid + ask) / 2, 4)
    elif last and last > 0:
        # Fallback to last price if no bid/ask
        mid_price = last

    return MarketDataResponse(
        conid=data.get("conid", 0),
        symbol=data.get("symbol", ""),
        bid=bid,
        ask=ask,
        last=last,
        bidSize=_safe_number(data.get("bidSize"), as_int=True),
        askSize=_safe_number(data.get("askSize"), as_int=True),
        volume=_safe_number(data.get("volume"), as_int=True),
        spread=spread,
        midPrice=mid_price,
        timestamp=data.get("timestamp"),
        delayed=data.get("delayed", False),
        subscribed=subscribed,
    )


@router.get("/marketdata/{symbol}", response_model=MarketDataResponse)
async def get_market_data_by_symbol(
    symbol: str = Path(..., description="ETF symbol (e.g., VUSA, IWDA)"),
    user: UserContext = Depends(get_current_user)
) -> MarketDataResponse:
    """
    Get streaming market data for a symbol.
    Returns cached data when IB is disconnected.
    """
    ib_client = get_ib_client()

    # If not connected, try to return cached data
    if not ib_client.is_connected():
        cached = _load_cache()
        if cached and cached.get("data"):
            for conid, data in cached["data"].items():
                if data.get("symbol", "").upper() == symbol.upper():
                    result = _format_market_data(data, subscribed=False)
                    if result:
                        result.delayed = True
                        return result
        raise HTTPException(status_code=503, detail="IB Gateway not connected and no cached data")

    # Get market data (will subscribe if not already)
    data = await ib_client.get_market_data_for_symbol(symbol.upper())

    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found in available ETFs")

    result = _format_market_data(data, subscribed=True)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to format market data")

    return result


@router.get("/marketdata", response_model=AllMarketDataResponse)
async def get_all_market_data(
    user: UserContext = Depends(get_current_user)
) -> AllMarketDataResponse:
    """
    Get streaming market data for all subscribed symbols.
    Returns cached data when IB is disconnected.
    """
    ib_client = get_ib_client()

    # If not connected, return cached data
    if not ib_client.is_connected():
        cached = _load_cache()
        if cached and cached.get("data"):
            results = []
            for conid, data in cached["data"].items():
                formatted = _format_market_data(data, subscribed=False)
                if formatted:
                    formatted.delayed = True  # Mark as cached/delayed
                    results.append(formatted)
            return AllMarketDataResponse(
                data=results,
                timestamp=cached.get("timestamp", datetime.utcnow().isoformat()),
                subscriptionCount=len(results)
            )
        raise HTTPException(status_code=503, detail="IB Gateway not connected and no cached data")

    all_data = ib_client.get_all_market_data()

    results = []
    for conid, data in all_data.items():
        formatted = _format_market_data(data, subscribed=True)
        if formatted:
            results.append(formatted)

    # If no subscriptions, return empty list with info
    if not results:
        # Auto-subscribe to all ETFs
        count = await ib_client.subscribe_all_etfs()
        return AllMarketDataResponse(
            data=[],
            timestamp=datetime.utcnow().isoformat(),
            subscriptionCount=count
        )

    # Save to cache for offline use
    _save_cache(all_data)

    return AllMarketDataResponse(
        data=results,
        timestamp=datetime.utcnow().isoformat(),
        subscriptionCount=len(results)
    )


@router.post("/marketdata/subscribe/all", response_model=SubscribeResponse)
async def subscribe_all_market_data(
    user: UserContext = Depends(get_current_user)
) -> SubscribeResponse:
    """
    Subscribe to streaming market data for all MVP ETFs.

    IB limits concurrent market data subscriptions, so we only subscribe
    to the predefined ETF list (currently 4 ETFs).
    """
    ib_client = get_ib_client()

    if not ib_client.is_connected():
        raise HTTPException(status_code=503, detail="IB Gateway not connected")

    count = await ib_client.subscribe_all_etfs()

    return SubscribeResponse(
        success=count > 0,
        message=f"Subscribed to {count} ETF market data streams",
        subscriptionCount=count
    )


@router.post("/marketdata/subscribe/{symbol}", response_model=SubscribeResponse)
async def subscribe_market_data(
    symbol: str = Path(..., description="ETF symbol to subscribe"),
    user: UserContext = Depends(require_trading_approved)
) -> SubscribeResponse:
    """Subscribe to streaming market data for a specific symbol."""
    ib_client = get_ib_client()

    if not ib_client.is_connected():
        raise HTTPException(status_code=503, detail="IB Gateway not connected")

    # Find ETF by symbol
    etfs = ib_client.get_mvp_etfs()
    etf = next((e for e in etfs if e["symbol"].upper() == symbol.upper()), None)

    if not etf:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found in available ETFs")

    success = await ib_client.subscribe_market_data(etf["conid"])

    return SubscribeResponse(
        success=success,
        message=f"{'Subscribed to' if success else 'Failed to subscribe to'} {symbol} market data",
        subscriptionCount=len(ib_client.get_all_market_data())
    )


@router.delete("/marketdata/unsubscribe/{symbol}", response_model=SubscribeResponse)
async def unsubscribe_market_data(
    symbol: str = Path(..., description="ETF symbol to unsubscribe"),
    user: UserContext = Depends(require_trading_approved)
) -> SubscribeResponse:
    """Unsubscribe from market data for a specific symbol."""
    ib_client = get_ib_client()

    # Find ETF by symbol
    etfs = ib_client.get_mvp_etfs()
    etf = next((e for e in etfs if e["symbol"].upper() == symbol.upper()), None)

    if not etf:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

    success = await ib_client.unsubscribe_market_data(etf["conid"])

    return SubscribeResponse(
        success=success,
        message=f"Unsubscribed from {symbol} market data",
        subscriptionCount=len(ib_client.get_all_market_data())
    )
