"""ETF Holdings Look-Through endpoints.

This module provides read-only access to ETF holdings data.
It does NOT depend on IB/LYNX connectivity - works completely offline.
"""
import json
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/etfs", tags=["ETF Holdings"])

# Path to holdings data files
HOLDINGS_DIR = Path(__file__).parent.parent / "data" / "etf_holdings"


class Holding(BaseModel):
    """Single holding in an ETF."""
    name: str
    ticker: Optional[str] = None
    weight_percent: float
    sector: str
    country: str


class ETFHoldingsResponse(BaseModel):
    """Response for ETF holdings endpoint."""
    symbol: str
    name: str
    isin: str
    issuer: str
    index: str
    last_updated: str
    total_holdings: int
    top_10_weight: float
    holdings: list[Holding]
    available: bool = True
    message: Optional[str] = None


class HoldingsListResponse(BaseModel):
    """Response listing available ETFs with holdings data."""
    etfs: list[str]
    count: int


# Cache for holdings data
_holdings_cache: dict[str, dict] = {}


def load_holdings(symbol: str) -> Optional[dict]:
    """Load holdings data from JSON file with caching."""
    symbol = symbol.upper()

    # Check cache first
    if symbol in _holdings_cache:
        return _holdings_cache[symbol]

    # Try to load from file
    file_path = HOLDINGS_DIR / f"{symbol}.json"

    if not file_path.exists():
        logger.debug(f"Holdings file not found: {file_path}")
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Cache it
        _holdings_cache[symbol] = data
        logger.info(f"Loaded holdings for {symbol} ({len(data.get('holdings', []))} holdings)")
        return data
    except Exception as e:
        logger.error(f"Error loading holdings for {symbol}: {e}")
        return None


def get_available_etfs() -> list[str]:
    """Get list of ETFs with holdings data available."""
    if not HOLDINGS_DIR.exists():
        return []

    return [
        f.stem.upper()
        for f in HOLDINGS_DIR.glob("*.json")
    ]


@router.get("/holdings", response_model=HoldingsListResponse)
async def list_available_holdings() -> HoldingsListResponse:
    """
    List all ETFs that have holdings data available.

    This endpoint is always available - does not require IB connectivity.
    """
    etfs = get_available_etfs()
    return HoldingsListResponse(etfs=etfs, count=len(etfs))


@router.get("/{symbol}/holdings", response_model=ETFHoldingsResponse)
async def get_etf_holdings(symbol: str) -> ETFHoldingsResponse:
    """
    Get top 10 holdings for a specific ETF.

    This is a read-only, informational endpoint.
    Does NOT require IB/LYNX connectivity.

    Returns:
    - Top 10 holdings with name, weight, sector, country
    - Total weight covered by top 10
    - ETF metadata (issuer, index, etc.)

    If holdings data is not available, returns a graceful message.
    """
    symbol = symbol.upper()
    data = load_holdings(symbol)

    if data is None:
        # Return graceful response, not an error
        return ETFHoldingsResponse(
            symbol=symbol,
            name=f"{symbol} ETF",
            isin="",
            issuer="Unknown",
            index="Unknown",
            last_updated="",
            total_holdings=0,
            top_10_weight=0,
            holdings=[],
            available=False,
            message=f"Holdings data not available for {symbol}. Check back later."
        )

    # Get top 10 holdings
    holdings = data.get("holdings", [])[:10]
    top_10_weight = sum(h.get("weight_percent", 0) for h in holdings)

    return ETFHoldingsResponse(
        symbol=data.get("symbol", symbol),
        name=data.get("name", f"{symbol} ETF"),
        isin=data.get("isin", ""),
        issuer=data.get("issuer", "Unknown"),
        index=data.get("index", "Unknown"),
        last_updated=data.get("last_updated", ""),
        total_holdings=data.get("total_holdings", 0),
        top_10_weight=round(top_10_weight, 2),
        holdings=[
            Holding(
                name=h.get("name", "Unknown"),
                ticker=h.get("ticker"),
                weight_percent=h.get("weight_percent", 0),
                sector=h.get("sector", "Unknown"),
                country=h.get("country", "Unknown")
            )
            for h in holdings
        ],
        available=True,
        message=None
    )
