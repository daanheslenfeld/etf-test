"""Market indices endpoints for major stock market indices."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import httpx
import logging
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trading", tags=["Market Indices"])

# In-memory cache for indices data
_indices_cache: Optional[dict] = None
_cache_timestamp: Optional[datetime] = None
CACHE_TTL_SECONDS = 30  # Cache for 30 seconds


class IndexData(BaseModel):
    """Data for a single market index."""
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    currency: str
    timestamp: str
    is_open: bool = True


class AllIndicesResponse(BaseModel):
    """Response containing all market indices."""
    indices: list[IndexData]
    timestamp: str
    cached: bool = False


# Market indices configuration with Yahoo Finance symbols
MARKET_INDICES = [
    {"symbol": "^AEX", "name": "AEX", "display": "AEX", "currency": "EUR"},
    {"symbol": "^GDAXI", "name": "DAX", "display": "DAX", "currency": "EUR"},
    {"symbol": "^GSPC", "name": "S&P 500", "display": "S&P 500", "currency": "USD"},
    {"symbol": "^N225", "name": "Nikkei 225", "display": "Japan", "currency": "JPY"},
    {"symbol": "000001.SS", "name": "Shanghai Composite", "display": "China", "currency": "CNY"},
    {"symbol": "^STOXX50E", "name": "EURO STOXX 50", "display": "EUROSTOXX 50", "currency": "EUR"},
]


async def fetch_index_data(symbol: str, name: str, display: str, currency: str) -> Optional[IndexData]:
    """Fetch data for a single index from Yahoo Finance."""
    try:
        # Use Yahoo Finance API (free tier)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {
            "interval": "1d",
            "range": "2d"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })

            if response.status_code != 200:
                logger.warning(f"Failed to fetch {symbol}: HTTP {response.status_code}")
                return None

            data = response.json()

            result = data.get("chart", {}).get("result", [])
            if not result:
                return None

            quote = result[0]
            meta = quote.get("meta", {})

            # Get current price
            current_price = meta.get("regularMarketPrice", 0)
            previous_close = (
                meta.get("previousClose")
                or meta.get("chartPreviousClose")
            )

            # Fallback: use first close from chart data as previous close
            if not previous_close:
                closes = quote.get("indicators", {}).get("quote", [{}])[0].get("close", [])
                if len(closes) >= 2 and closes[0] is not None:
                    previous_close = closes[0]

            if not previous_close:
                previous_close = current_price

            # Calculate change vs previous trading day close
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close else 0

            return IndexData(
                symbol=display,
                name=name,
                price=round(current_price, 2),
                change=round(change, 2),
                change_percent=round(change_percent, 2),
                currency=currency,
                timestamp=datetime.utcnow().isoformat(),
                is_open=meta.get("marketState", "CLOSED") in ["REGULAR", "PRE", "POST"]
            )

    except Exception as e:
        logger.error(f"Error fetching index {symbol}: {e}")
        return None


def _is_cache_valid() -> bool:
    """Check if the cache is still valid."""
    global _cache_timestamp
    if _cache_timestamp is None or _indices_cache is None:
        return False
    age = (datetime.utcnow() - _cache_timestamp).total_seconds()
    return age < CACHE_TTL_SECONDS


@router.get("/indices", response_model=AllIndicesResponse)
async def get_market_indices() -> AllIndicesResponse:
    """
    Get current data for major market indices.

    Data is cached for 30 seconds to reduce API calls.

    Returns data for:
    - AEX (Amsterdam)
    - DAX (Germany)
    - S&P 500 (US)
    - Nikkei 225 (Japan)
    - Shanghai Composite (China)
    - EURO STOXX 50 (Europe)
    """
    global _indices_cache, _cache_timestamp

    # Return cached data if valid
    if _is_cache_valid():
        return AllIndicesResponse(
            indices=_indices_cache["indices"],
            timestamp=_indices_cache["timestamp"],
            cached=True
        )

    # Fetch all indices concurrently
    tasks = [
        fetch_index_data(idx["symbol"], idx["name"], idx["display"], idx["currency"])
        for idx in MARKET_INDICES
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    indices = []
    for i, result in enumerate(results):
        if isinstance(result, IndexData):
            indices.append(result)
        elif isinstance(result, Exception):
            logger.error(f"Exception fetching {MARKET_INDICES[i]['symbol']}: {result}")
            # Add placeholder with N/A values
            indices.append(IndexData(
                symbol=MARKET_INDICES[i]["display"],
                name=MARKET_INDICES[i]["name"],
                price=0,
                change=0,
                change_percent=0,
                currency=MARKET_INDICES[i]["currency"],
                timestamp=datetime.utcnow().isoformat(),
                is_open=False
            ))
        elif result is None:
            # Fetch returned None - use placeholder
            indices.append(IndexData(
                symbol=MARKET_INDICES[i]["display"],
                name=MARKET_INDICES[i]["name"],
                price=0,
                change=0,
                change_percent=0,
                currency=MARKET_INDICES[i]["currency"],
                timestamp=datetime.utcnow().isoformat(),
                is_open=False
            ))

    # Update cache
    _indices_cache = {
        "indices": indices,
        "timestamp": datetime.utcnow().isoformat()
    }
    _cache_timestamp = datetime.utcnow()

    return AllIndicesResponse(
        indices=indices,
        timestamp=_indices_cache["timestamp"],
        cached=False
    )


@router.get("/indices/{symbol}", response_model=IndexData)
async def get_single_index(symbol: str) -> IndexData:
    """Get data for a single market index by symbol."""
    # Check cache first
    if _is_cache_valid() and _indices_cache:
        for idx in _indices_cache["indices"]:
            if idx.symbol.upper() == symbol.upper():
                return idx

    # Find the index configuration
    idx_config = next(
        (idx for idx in MARKET_INDICES if idx["display"].upper() == symbol.upper() or idx["symbol"] == symbol),
        None
    )

    if not idx_config:
        raise HTTPException(status_code=404, detail=f"Index {symbol} not found")

    result = await fetch_index_data(
        idx_config["symbol"],
        idx_config["name"],
        idx_config["display"],
        idx_config["currency"]
    )

    if not result:
        raise HTTPException(status_code=503, detail=f"Unable to fetch data for {symbol}")

    return result
