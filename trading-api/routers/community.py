"""
Community Router

Handles community operations:
- Portfolio visibility controls (PUBLIC/PRIVATE)
- Follow/unfollow portfolios
- Public portfolio browsing
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import uuid


router = APIRouter(prefix="/community", tags=["community"])

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PORTFOLIOS_FILE = os.path.join(DATA_DIR, "community_portfolios.json")
FOLLOWS_FILE = os.path.join(DATA_DIR, "portfolio_follows.json")
SNAPSHOTS_FILE = os.path.join(DATA_DIR, "performance_snapshots.json")
MARKET_DATA_FILE = os.path.join(DATA_DIR, "market_data_cache.json")
TRADABILITY_FILE = os.path.join(DATA_DIR, "etf_tradability.json")


# ============================================
# Enums
# ============================================

class PortfolioVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"


class SnapshotPeriodType(str, Enum):
    DAILY = "daily"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class LeaderboardPeriod(str, Enum):
    ONE_MONTH = "1M"
    THREE_MONTHS = "3M"
    ONE_YEAR = "1Y"
    ALL_TIME = "ALL"


# ============================================
# Models
# ============================================

class FollowRecord(BaseModel):
    """A follow relationship record."""
    id: str
    follower_user_id: str
    portfolio_id: str
    created_at: str


class FollowResponse(BaseModel):
    """Response for follow/unfollow operations."""
    success: bool
    message: str
    is_following: bool
    followers_count: int


class FollowedPortfolio(BaseModel):
    """A portfolio with follow metadata."""
    id: str
    name: str
    description: Optional[str] = None
    creator_id: str
    creator_name: str
    visibility: str
    risk_level: int
    followers: int
    created_at: Optional[str] = None
    followed_at: str


class FollowsListResponse(BaseModel):
    """Response for listing followed portfolios."""
    follows: List[FollowedPortfolio]
    total: int


class PortfolioHolding(BaseModel):
    """A holding in a portfolio."""
    isin: str
    name: str
    weight: float = Field(ge=0, le=100)
    category: Optional[str] = None


class PublicPortfolio(BaseModel):
    """A public portfolio for browsing."""
    id: str
    name: str
    description: Optional[str] = None
    creator_id: str
    creator_name: str
    visibility: str
    risk_level: int = Field(ge=1, le=5)
    followers: int = 0
    holdings: List[PortfolioHolding] = []
    tags: List[str] = []
    created_at: Optional[str] = None
    published_at: Optional[str] = None


class PublicPortfoliosResponse(BaseModel):
    """Response for listing public portfolios."""
    portfolios: List[PublicPortfolio]
    total: int


class VisibilityUpdateRequest(BaseModel):
    """Request to update portfolio visibility."""
    visibility: PortfolioVisibility


class VisibilityUpdateResponse(BaseModel):
    """Response for visibility update."""
    success: bool
    message: str
    portfolio_id: str
    visibility: str
    published_at: Optional[str] = None


class MyPortfolio(BaseModel):
    """A user's own portfolio with visibility controls."""
    id: str
    name: str
    description: Optional[str] = None
    visibility: str
    risk_level: int
    followers: int = 0
    holdings: List[PortfolioHolding] = []
    tags: List[str] = []
    created_at: Optional[str] = None
    published_at: Optional[str] = None
    updated_at: Optional[str] = None


class MyPortfoliosResponse(BaseModel):
    """Response for user's own portfolios."""
    portfolios: List[MyPortfolio]
    total: int


class HoldingSnapshot(BaseModel):
    """Snapshot of a single holding at a point in time."""
    isin: str
    name: str
    weight: float
    price: float
    value: float


class PerformanceSnapshot(BaseModel):
    """Immutable performance snapshot at a point in time."""
    id: str
    portfolio_id: str
    timestamp: str
    period_type: str  # daily, monthly, quarterly
    total_value: float
    cash: float = 0.0
    return_pct: float = 0.0  # Period return percentage
    return_abs: float = 0.0  # Period return absolute
    cumulative_return_pct: float = 0.0  # Since first snapshot
    holdings_snapshot: List[HoldingSnapshot] = []


class SnapshotsResponse(BaseModel):
    """Response for snapshot queries."""
    portfolio_id: str
    snapshots: List[PerformanceSnapshot]
    total: int
    period_type: Optional[str] = None


class LeaderboardEntry(BaseModel):
    """A single entry in the leaderboard."""
    rank: int
    portfolio_id: str
    portfolio_name: str
    creator_id: str
    creator_name: str
    return_pct: float
    total_value: float
    followers: int
    snapshot_date: Optional[str] = None


class LeaderboardResponse(BaseModel):
    """Response for leaderboard queries."""
    period: str
    entries: List[LeaderboardEntry]
    total: int
    generated_at: str


class TrendingPortfolio(BaseModel):
    """A trending portfolio entry."""
    portfolio_id: str
    name: str
    description: Optional[str] = None
    creator_id: str
    creator_name: str
    followers: int
    recent_return_pct: Optional[float] = None
    total_value: Optional[float] = None
    published_at: Optional[str] = None


class TrendingResponse(BaseModel):
    """Response for trending portfolios."""
    portfolios: List[TrendingPortfolio]
    total: int
    generated_at: str


# ============================================
# Data Storage
# ============================================

def load_follows() -> dict:
    """Load follows from JSON file."""
    if not os.path.exists(FOLLOWS_FILE):
        return {"follows": {}, "by_user": {}, "by_portfolio": {}, "last_updated": None}

    try:
        with open(FOLLOWS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading follows: {e}")
        return {"follows": {}, "by_user": {}, "by_portfolio": {}, "last_updated": None}


def save_follows(data: dict):
    """Save follows to JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    data["last_updated"] = datetime.utcnow().isoformat() + "Z"

    with open(FOLLOWS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_portfolios() -> dict:
    """Load portfolios from JSON file."""
    if not os.path.exists(PORTFOLIOS_FILE):
        return {"portfolios": {}, "last_updated": None}

    try:
        with open(PORTFOLIOS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading portfolios: {e}")
        return {"portfolios": {}, "last_updated": None}


def save_portfolios(data: dict):
    """Save portfolios to JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    data["last_updated"] = datetime.utcnow().isoformat() + "Z"

    with open(PORTFOLIOS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_follow_id() -> str:
    """Generate a unique follow ID."""
    return f"follow-{uuid.uuid4().hex[:12]}"


def load_snapshots() -> dict:
    """Load snapshots from JSON file."""
    if not os.path.exists(SNAPSHOTS_FILE):
        return {"snapshots": {}, "by_portfolio": {}, "by_type": {}, "last_updated": None}

    try:
        with open(SNAPSHOTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading snapshots: {e}")
        return {"snapshots": {}, "by_portfolio": {}, "by_type": {}, "last_updated": None}


def save_snapshots(data: dict):
    """Save snapshots to JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    data["last_updated"] = datetime.utcnow().isoformat() + "Z"

    with open(SNAPSHOTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_snapshot_id() -> str:
    """Generate a unique snapshot ID."""
    return f"snap-{uuid.uuid4().hex[:12]}"


def load_market_data() -> dict:
    """Load market data cache for price lookups."""
    if not os.path.exists(MARKET_DATA_FILE):
        return {"data": {}, "timestamp": None}

    try:
        with open(MARKET_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading market data: {e}")
        return {"data": {}, "timestamp": None}


def load_tradability() -> dict:
    """Load ETF tradability data for ISIN to contract mapping."""
    if not os.path.exists(TRADABILITY_FILE):
        return {"etfs": {}}

    try:
        with open(TRADABILITY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading tradability: {e}")
        return {"etfs": {}}


def get_price_for_isin(isin: str, market_data: dict, tradability: dict) -> float:
    """
    Get the last known price for an ISIN.
    Uses market data cache and tradability mapping.
    Returns 0.0 if price not found.
    """
    # Get contract info for ISIN
    etf_info = tradability.get("etfs", {}).get(isin)
    if not etf_info:
        return 0.0

    contract = etf_info.get("contract", {})
    conid = str(contract.get("conId", ""))

    if not conid:
        return 0.0

    # Get price from market data
    md = market_data.get("data", {}).get(conid, {})

    # Prefer last price, fall back to mid of bid/ask
    price = md.get("last")
    if price is None or price == 0:
        bid = md.get("bid")
        ask = md.get("ask")
        if bid and ask:
            price = (bid + ask) / 2
        elif bid:
            price = bid
        elif ask:
            price = ask
        else:
            price = 0.0

    return price or 0.0


# ============================================
# Endpoints
# ============================================

@router.post("/follow/{portfolio_id}", response_model=FollowResponse)
async def follow_portfolio(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID of the follower"),
):
    """
    Follow a public portfolio.

    Rules:
    - Only PUBLIC portfolios can be followed
    - Cannot follow your own portfolio
    - One follow per user per portfolio (idempotent)
    """
    # Load portfolio data
    portfolio_data = load_portfolios()
    portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Rule: Only public portfolios can be followed
    if portfolio.get("visibility") != "public":
        raise HTTPException(status_code=403, detail="Cannot follow private portfolios")

    # Rule: Cannot follow own portfolio
    if portfolio.get("creator_id") == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow your own portfolio")

    # Load follows data
    follows_data = load_follows()

    # Rule: Check if already following (idempotent)
    user_follows = follows_data.get("by_user", {}).get(user_id, [])
    if portfolio_id in user_follows:
        return FollowResponse(
            success=True,
            message="Already following this portfolio",
            is_following=True,
            followers_count=portfolio.get("followers", 0)
        )

    # Create follow record
    follow_id = generate_follow_id()
    now = datetime.utcnow().isoformat() + "Z"

    follow = {
        "id": follow_id,
        "follower_user_id": user_id,
        "portfolio_id": portfolio_id,
        "created_at": now
    }

    # Update follows data
    follows_data["follows"][follow_id] = follow

    # Update by_user index
    if user_id not in follows_data["by_user"]:
        follows_data["by_user"][user_id] = []
    follows_data["by_user"][user_id].append(portfolio_id)

    # Update by_portfolio index
    if portfolio_id not in follows_data["by_portfolio"]:
        follows_data["by_portfolio"][portfolio_id] = []
    follows_data["by_portfolio"][portfolio_id].append(user_id)

    save_follows(follows_data)

    # Increment followers count on portfolio
    portfolio["followers"] = portfolio.get("followers", 0) + 1
    portfolio_data["portfolios"][portfolio_id] = portfolio
    save_portfolios(portfolio_data)

    return FollowResponse(
        success=True,
        message="Successfully followed portfolio",
        is_following=True,
        followers_count=portfolio["followers"]
    )


@router.delete("/follow/{portfolio_id}", response_model=FollowResponse)
async def unfollow_portfolio(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID of the follower"),
):
    """
    Unfollow a portfolio.
    """
    # Load portfolio data
    portfolio_data = load_portfolios()
    portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Load follows data
    follows_data = load_follows()

    # Check if following
    user_follows = follows_data.get("by_user", {}).get(user_id, [])
    if portfolio_id not in user_follows:
        return FollowResponse(
            success=True,
            message="Not following this portfolio",
            is_following=False,
            followers_count=portfolio.get("followers", 0)
        )

    # Find and remove follow record
    follow_id_to_remove = None
    for follow_id, follow in follows_data["follows"].items():
        if follow["follower_user_id"] == user_id and follow["portfolio_id"] == portfolio_id:
            follow_id_to_remove = follow_id
            break

    if follow_id_to_remove:
        del follows_data["follows"][follow_id_to_remove]

    # Update by_user index
    if user_id in follows_data["by_user"]:
        follows_data["by_user"][user_id] = [
            p for p in follows_data["by_user"][user_id] if p != portfolio_id
        ]
        if not follows_data["by_user"][user_id]:
            del follows_data["by_user"][user_id]

    # Update by_portfolio index
    if portfolio_id in follows_data["by_portfolio"]:
        follows_data["by_portfolio"][portfolio_id] = [
            u for u in follows_data["by_portfolio"][portfolio_id] if u != user_id
        ]
        if not follows_data["by_portfolio"][portfolio_id]:
            del follows_data["by_portfolio"][portfolio_id]

    save_follows(follows_data)

    # Decrement followers count on portfolio
    portfolio["followers"] = max(0, portfolio.get("followers", 0) - 1)
    portfolio_data["portfolios"][portfolio_id] = portfolio
    save_portfolios(portfolio_data)

    return FollowResponse(
        success=True,
        message="Successfully unfollowed portfolio",
        is_following=False,
        followers_count=portfolio["followers"]
    )


@router.get("/follows", response_model=FollowsListResponse)
async def get_follows(
    user_id: str = Query(..., description="User ID to get follows for"),
):
    """
    Get all portfolios followed by a user.

    Returns portfolios sorted by follow date (most recent first).
    """
    follows_data = load_follows()
    portfolio_data = load_portfolios()

    user_follows = follows_data.get("by_user", {}).get(user_id, [])

    result = []
    for portfolio_id in user_follows:
        portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)
        if portfolio:
            # Find follow record to get created_at
            followed_at = None
            for follow in follows_data.get("follows", {}).values():
                if follow["follower_user_id"] == user_id and follow["portfolio_id"] == portfolio_id:
                    followed_at = follow["created_at"]
                    break

            result.append(FollowedPortfolio(
                id=portfolio["id"],
                name=portfolio["name"],
                description=portfolio.get("description"),
                creator_id=portfolio["creator_id"],
                creator_name=portfolio["creator_name"],
                visibility=portfolio.get("visibility", "public"),
                risk_level=portfolio.get("risk_level", 3),
                followers=portfolio.get("followers", 0),
                created_at=portfolio.get("created_at"),
                followed_at=followed_at or ""
            ))

    # Sort by followed_at descending (most recent first)
    result.sort(key=lambda x: x.followed_at, reverse=True)

    return FollowsListResponse(
        follows=result,
        total=len(result)
    )


@router.get("/follow/{portfolio_id}/status")
async def get_follow_status(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID to check"),
):
    """
    Check if a user is following a specific portfolio.
    """
    follows_data = load_follows()
    user_follows = follows_data.get("by_user", {}).get(user_id, [])

    return {
        "portfolio_id": portfolio_id,
        "is_following": portfolio_id in user_follows
    }


# ============================================
# Portfolio Visibility Endpoints
# ============================================

@router.patch("/portfolio/{portfolio_id}/visibility", response_model=VisibilityUpdateResponse)
async def update_portfolio_visibility(
    portfolio_id: str,
    request: VisibilityUpdateRequest,
    user_id: str = Query(..., description="User ID (must be portfolio owner)"),
):
    """
    Update portfolio visibility (PUBLIC/PRIVATE).

    Rules:
    - Only the portfolio owner can change visibility
    - When set to PUBLIC, published_at is set to current time
    - When set to PRIVATE, followers are NOT removed (they just can't see it)
    """
    portfolio_data = load_portfolios()
    portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Check ownership
    if portfolio.get("creator_id") != user_id:
        raise HTTPException(status_code=403, detail="Only the portfolio owner can change visibility")

    now = datetime.utcnow().isoformat() + "Z"
    old_visibility = portfolio.get("visibility", "private")
    new_visibility = request.visibility.value

    # Update visibility
    portfolio["visibility"] = new_visibility
    portfolio["updated_at"] = now

    # Set published_at when first made public
    published_at = portfolio.get("published_at")
    if new_visibility == "public" and old_visibility != "public":
        portfolio["published_at"] = now
        published_at = now

    portfolio_data["portfolios"][portfolio_id] = portfolio
    save_portfolios(portfolio_data)

    return VisibilityUpdateResponse(
        success=True,
        message=f"Portfolio visibility updated to {new_visibility}",
        portfolio_id=portfolio_id,
        visibility=new_visibility,
        published_at=published_at
    )


@router.get("/portfolios", response_model=PublicPortfoliosResponse)
async def get_public_portfolios(
    search: Optional[str] = Query(None, description="Search in name and description"),
    sort_by: str = Query("published_at", enum=["published_at", "followers", "name"]),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Get all PUBLIC portfolios for community browsing.

    Only portfolios with visibility=PUBLIC are returned.
    """
    portfolio_data = load_portfolios()
    portfolios = list(portfolio_data.get("portfolios", {}).values())

    # Filter to only public portfolios
    public_portfolios = [p for p in portfolios if p.get("visibility") == "public"]

    # Search filter
    if search:
        search_lower = search.lower()
        public_portfolios = [
            p for p in public_portfolios
            if search_lower in p.get("name", "").lower()
            or search_lower in (p.get("description") or "").lower()
            or any(search_lower in tag.lower() for tag in p.get("tags", []))
        ]

    # Sort
    if sort_by == "followers":
        public_portfolios.sort(key=lambda p: p.get("followers", 0), reverse=True)
    elif sort_by == "name":
        public_portfolios.sort(key=lambda p: p.get("name", "").lower())
    else:  # published_at (default, most recent first)
        public_portfolios.sort(key=lambda p: p.get("published_at") or "", reverse=True)

    total = len(public_portfolios)

    # Pagination
    public_portfolios = public_portfolios[offset:offset + limit]

    # Convert to response model
    result = []
    for p in public_portfolios:
        holdings = [
            PortfolioHolding(
                isin=h.get("isin", ""),
                name=h.get("name", ""),
                weight=h.get("weight", 0),
                category=h.get("category")
            )
            for h in p.get("holdings", [])
        ]
        result.append(PublicPortfolio(
            id=p["id"],
            name=p["name"],
            description=p.get("description"),
            creator_id=p["creator_id"],
            creator_name=p["creator_name"],
            visibility=p.get("visibility", "public"),
            risk_level=p.get("risk_level", 3),
            followers=p.get("followers", 0),
            holdings=holdings,
            tags=p.get("tags", []),
            created_at=p.get("created_at"),
            published_at=p.get("published_at")
        ))

    return PublicPortfoliosResponse(
        portfolios=result,
        total=total
    )


@router.get("/my-portfolios", response_model=MyPortfoliosResponse)
async def get_my_portfolios(
    user_id: str = Query(..., description="User ID to get portfolios for"),
):
    """
    Get all portfolios owned by a user (both PUBLIC and PRIVATE).

    Used for the "My Portfolios" section where users can manage visibility.
    """
    portfolio_data = load_portfolios()
    portfolios = list(portfolio_data.get("portfolios", {}).values())

    # Filter to user's portfolios
    my_portfolios = [p for p in portfolios if p.get("creator_id") == user_id]

    # Sort by created_at descending
    my_portfolios.sort(key=lambda p: p.get("created_at") or "", reverse=True)

    # Convert to response model
    result = []
    for p in my_portfolios:
        holdings = [
            PortfolioHolding(
                isin=h.get("isin", ""),
                name=h.get("name", ""),
                weight=h.get("weight", 0),
                category=h.get("category")
            )
            for h in p.get("holdings", [])
        ]
        result.append(MyPortfolio(
            id=p["id"],
            name=p["name"],
            description=p.get("description"),
            visibility=p.get("visibility", "private"),
            risk_level=p.get("risk_level", 3),
            followers=p.get("followers", 0),
            holdings=holdings,
            tags=p.get("tags", []),
            created_at=p.get("created_at"),
            published_at=p.get("published_at"),
            updated_at=p.get("updated_at")
        ))

    return MyPortfoliosResponse(
        portfolios=result,
        total=len(result)
    )


# ============================================
# Performance Snapshot Endpoints
# ============================================

@router.get("/portfolio/{portfolio_id}/snapshots", response_model=SnapshotsResponse)
async def get_portfolio_snapshots(
    portfolio_id: str,
    period: Optional[SnapshotPeriodType] = Query(None, description="Filter by period type"),
    limit: int = Query(30, ge=1, le=365, description="Maximum snapshots to return"),
):
    """
    Get performance snapshots for a portfolio.

    Snapshots are immutable historical records of portfolio value.
    """
    # Verify portfolio exists and is public
    portfolio_data = load_portfolios()
    portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if portfolio.get("visibility") != "public":
        raise HTTPException(status_code=403, detail="Snapshots only available for public portfolios")

    # Load snapshots
    snapshots_data = load_snapshots()
    portfolio_snapshot_ids = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])

    # Get snapshot records
    snapshots = []
    for snap_id in portfolio_snapshot_ids:
        snap = snapshots_data.get("snapshots", {}).get(snap_id)
        if snap:
            # Filter by period if specified
            if period is None or snap.get("period_type") == period.value:
                holdings = [
                    HoldingSnapshot(**h) for h in snap.get("holdings_snapshot", [])
                ]
                snapshots.append(PerformanceSnapshot(
                    id=snap["id"],
                    portfolio_id=snap["portfolio_id"],
                    timestamp=snap["timestamp"],
                    period_type=snap["period_type"],
                    total_value=snap.get("total_value", 0),
                    cash=snap.get("cash", 0),
                    return_pct=snap.get("return_pct", 0),
                    return_abs=snap.get("return_abs", 0),
                    cumulative_return_pct=snap.get("cumulative_return_pct", 0),
                    holdings_snapshot=holdings
                ))

    # Sort by timestamp descending (most recent first)
    snapshots.sort(key=lambda x: x.timestamp, reverse=True)

    # Apply limit
    snapshots = snapshots[:limit]

    return SnapshotsResponse(
        portfolio_id=portfolio_id,
        snapshots=snapshots,
        total=len(snapshots),
        period_type=period.value if period else None
    )


# ============================================
# Leaderboard Endpoints
# ============================================

def get_period_days(period: LeaderboardPeriod) -> int:
    """Get the number of days for a leaderboard period."""
    if period == LeaderboardPeriod.ONE_MONTH:
        return 30
    elif period == LeaderboardPeriod.THREE_MONTHS:
        return 90
    elif period == LeaderboardPeriod.ONE_YEAR:
        return 365
    else:  # ALL_TIME
        return 3650  # ~10 years, effectively all


def calculate_period_return(
    portfolio_id: str,
    period: LeaderboardPeriod,
    snapshots_data: dict
) -> tuple:
    """
    Calculate the return for a portfolio over the specified period.

    Returns: (return_pct, latest_value, snapshot_date) or (None, None, None) if not enough data
    """
    portfolio_snaps = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])

    if not portfolio_snaps:
        return None, None, None

    # Get all snapshots for this portfolio
    all_snaps = []
    for snap_id in portfolio_snaps:
        snap = snapshots_data.get("snapshots", {}).get(snap_id)
        if snap:
            all_snaps.append(snap)

    if not all_snaps:
        return None, None, None

    # Sort by timestamp ascending
    all_snaps.sort(key=lambda x: x.get("timestamp", ""))

    # Get the latest snapshot
    latest = all_snaps[-1]
    latest_date = datetime.fromisoformat(latest["timestamp"].replace("Z", "+00:00"))
    latest_value = latest.get("total_value", 0)

    # For ALL_TIME, use cumulative return from first snapshot
    if period == LeaderboardPeriod.ALL_TIME:
        return_pct = latest.get("cumulative_return_pct", 0)
        return return_pct, latest_value, latest["timestamp"]

    # Find snapshot closest to period start
    days = get_period_days(period)
    target_date = latest_date - timedelta(days=days)

    # Find the oldest snapshot within the period, or the first one if period is longer than history
    start_snap = None
    for snap in all_snaps:
        snap_date = datetime.fromisoformat(snap["timestamp"].replace("Z", "+00:00"))
        if snap_date >= target_date:
            start_snap = snap
            break

    # If no snapshot found in period, use the first available
    if not start_snap:
        start_snap = all_snaps[0]

    start_value = start_snap.get("total_value", 0)

    if start_value <= 0:
        return 0.0, latest_value, latest["timestamp"]

    # Calculate period return
    return_pct = ((latest_value - start_value) / start_value) * 100

    return return_pct, latest_value, latest["timestamp"]


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: LeaderboardPeriod = Query(LeaderboardPeriod.ONE_MONTH, description="Time period for ranking"),
    limit: int = Query(20, ge=1, le=100, description="Maximum entries to return"),
):
    """
    Get the performance leaderboard for PUBLIC portfolios.

    Rankings are based on return_pct over the specified period:
    - 1M: Last 30 days
    - 3M: Last 90 days
    - 1Y: Last 365 days
    - ALL: All-time (cumulative since first snapshot)

    Only portfolios with snapshots are included.
    """
    now = datetime.utcnow()

    # Load data
    portfolio_data = load_portfolios()
    snapshots_data = load_snapshots()

    # Get all public portfolios
    public_portfolios = {
        p["id"]: p for p in portfolio_data.get("portfolios", {}).values()
        if p.get("visibility") == "public"
    }

    # Calculate returns for each portfolio
    rankings = []
    for portfolio_id, portfolio in public_portfolios.items():
        return_pct, total_value, snapshot_date = calculate_period_return(
            portfolio_id, period, snapshots_data
        )

        if return_pct is not None:
            rankings.append({
                "portfolio_id": portfolio_id,
                "portfolio_name": portfolio.get("name", "Unknown"),
                "creator_id": portfolio.get("creator_id", ""),
                "creator_name": portfolio.get("creator_name", "Unknown"),
                "return_pct": return_pct,
                "total_value": total_value or 0,
                "followers": portfolio.get("followers", 0),
                "snapshot_date": snapshot_date,
            })

    # Sort by return_pct descending
    rankings.sort(key=lambda x: x["return_pct"], reverse=True)

    # Apply limit and add ranks
    entries = []
    for i, r in enumerate(rankings[:limit]):
        entries.append(LeaderboardEntry(
            rank=i + 1,
            portfolio_id=r["portfolio_id"],
            portfolio_name=r["portfolio_name"],
            creator_id=r["creator_id"],
            creator_name=r["creator_name"],
            return_pct=round(r["return_pct"], 2),
            total_value=round(r["total_value"], 2),
            followers=r["followers"],
            snapshot_date=r["snapshot_date"],
        ))

    return LeaderboardResponse(
        period=period.value,
        entries=entries,
        total=len(rankings),
        generated_at=now.isoformat() + "Z"
    )


@router.get("/trending", response_model=TrendingResponse)
async def get_trending_portfolios(
    limit: int = Query(20, ge=1, le=50, description="Maximum portfolios to return"),
):
    """
    Get trending portfolios ranked by follower count.

    Returns PUBLIC portfolios sorted by number of followers (descending).
    Includes recent return if snapshot data is available.
    """
    now = datetime.utcnow()

    # Load data
    portfolio_data = load_portfolios()
    snapshots_data = load_snapshots()

    # Get all public portfolios
    public_portfolios = [
        p for p in portfolio_data.get("portfolios", {}).values()
        if p.get("visibility") == "public"
    ]

    # Sort by followers descending
    public_portfolios.sort(key=lambda p: p.get("followers", 0), reverse=True)

    # Build response with recent return data
    result = []
    for portfolio in public_portfolios[:limit]:
        portfolio_id = portfolio["id"]

        # Try to get recent return from snapshots (1M period)
        recent_return, total_value, _ = calculate_period_return(
            portfolio_id, LeaderboardPeriod.ONE_MONTH, snapshots_data
        )

        result.append(TrendingPortfolio(
            portfolio_id=portfolio_id,
            name=portfolio.get("name", "Unknown"),
            description=portfolio.get("description"),
            creator_id=portfolio.get("creator_id", ""),
            creator_name=portfolio.get("creator_name", "Unknown"),
            followers=portfolio.get("followers", 0),
            recent_return_pct=round(recent_return, 2) if recent_return is not None else None,
            total_value=round(total_value, 2) if total_value is not None else None,
            published_at=portfolio.get("published_at"),
        ))

    return TrendingResponse(
        portfolios=result,
        total=len(public_portfolios),
        generated_at=now.isoformat() + "Z"
    )
