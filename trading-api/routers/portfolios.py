"""
Community Portfolios Router

Handles CRUD operations for community-created model portfolios.
Includes: Follow system, Performance snapshots, Leaderboards.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import uuid
import math

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PORTFOLIOS_FILE = os.path.join(DATA_DIR, "community_portfolios.json")
FOLLOWS_FILE = os.path.join(DATA_DIR, "portfolio_follows.json")
SNAPSHOTS_FILE = os.path.join(DATA_DIR, "performance_snapshots.json")
MARKET_DATA_FILE = os.path.join(DATA_DIR, "market_data_cache.json")


# ============================================
# Models
# ============================================

class PortfolioVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class PortfolioHolding(BaseModel):
    isin: str
    name: str
    weight: float = Field(ge=0, le=100)
    category: Optional[str] = None
    symbol: Optional[str] = None


class PerformanceSnapshot(BaseModel):
    month: float = 0.0
    quarter: float = 0.0
    year: float = 0.0
    all_time: float = 0.0
    updated_at: Optional[str] = None


class CommunityPortfolio(BaseModel):
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    creator_id: str
    creator_name: str
    visibility: PortfolioVisibility = PortfolioVisibility.PRIVATE
    holdings: List[PortfolioHolding]
    risk_level: int = Field(ge=1, le=5)
    performance: Optional[PerformanceSnapshot] = None
    followers: int = 0
    likes: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    tags: List[str] = []


class CreatePortfolioRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    visibility: PortfolioVisibility = PortfolioVisibility.PRIVATE
    holdings: List[PortfolioHolding]
    risk_level: int = Field(ge=1, le=5)
    tags: List[str] = []


class UpdatePortfolioRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    visibility: Optional[PortfolioVisibility] = None
    holdings: Optional[List[PortfolioHolding]] = None
    risk_level: Optional[int] = Field(default=None, ge=1, le=5)
    tags: Optional[List[str]] = None


class LeaderboardEntry(BaseModel):
    portfolio_id: str
    portfolio_name: str
    creator_name: str
    performance: float
    rank: int


# ============================================
# Follow System Models
# ============================================

class PortfolioFollow(BaseModel):
    """Tracks a user following a portfolio."""
    id: str
    follower_user_id: str
    follower_email: Optional[str] = None
    portfolio_id: str
    followed_at: str


class FollowResponse(BaseModel):
    """Response for follow/unfollow operations."""
    success: bool
    followers_count: int
    is_following: bool


class FollowedPortfolioResponse(BaseModel):
    """A followed portfolio with follow metadata."""
    portfolio: CommunityPortfolio
    followed_at: str


# ============================================
# Performance Snapshot Models
# ============================================

class SnapshotType(str, Enum):
    DAILY = "daily"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class PerformanceSnapshotRecord(BaseModel):
    """Immutable performance snapshot at a point in time."""
    id: str
    portfolio_id: str
    timestamp: str
    snapshot_type: SnapshotType
    total_value: float
    holdings_value: float
    return_pct: float = 0.0  # Period return
    return_abs: float = 0.0  # Absolute return
    cumulative_return_pct: float = 0.0  # Since inception
    holdings_snapshot: List[dict] = []  # [{isin, weight, price}]


class SnapshotResponse(BaseModel):
    """Response for snapshot queries."""
    portfolio_id: str
    snapshots: List[PerformanceSnapshotRecord]
    count: int


# ============================================
# Enhanced Leaderboard Models
# ============================================

class EnhancedLeaderboardEntry(BaseModel):
    """Enhanced leaderboard entry with volatility tiebreaker."""
    rank: int
    portfolio_id: str
    portfolio_name: str
    creator_id: str
    creator_name: str
    return_pct: float
    volatility: float = 0.0  # For tiebreaker
    follower_count: int = 0
    period: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None


class TrendingEntry(BaseModel):
    """Entry for trending portfolios."""
    portfolio_id: str
    portfolio_name: str
    creator_name: str
    new_followers: int
    total_followers: int
    return_pct: float


# ============================================
# Data Storage
# ============================================

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


def generate_portfolio_id() -> str:
    """Generate a unique portfolio ID."""
    return f"community-{uuid.uuid4().hex[:12]}"


# ============================================
# Follow Data Storage
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


def generate_follow_id() -> str:
    """Generate a unique follow ID."""
    return f"follow-{uuid.uuid4().hex[:12]}"


# ============================================
# Snapshot Data Storage
# ============================================

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
    return f"snapshot-{uuid.uuid4().hex[:12]}"


def load_market_data() -> dict:
    """Load market data cache for price lookups."""
    if not os.path.exists(MARKET_DATA_FILE):
        return {}

    try:
        with open(MARKET_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading market data: {e}")
        return {}


# ============================================
# Endpoints
# ============================================

@router.get("/", response_model=List[CommunityPortfolio])
async def list_portfolios(
    visibility: Optional[PortfolioVisibility] = None,
    creator_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", enum=["created_at", "performance", "followers", "likes"]),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List community portfolios with optional filters.

    - **visibility**: Filter by public/private
    - **creator_id**: Filter by creator
    - **search**: Search in name and description
    - **sort_by**: Sort field (created_at, performance, followers, likes)
    """
    data = load_portfolios()
    portfolios = list(data.get("portfolios", {}).values())

    # Filter by visibility
    if visibility:
        portfolios = [p for p in portfolios if p.get("visibility") == visibility.value]
    else:
        # By default, only show public portfolios unless filtering by creator
        if not creator_id:
            portfolios = [p for p in portfolios if p.get("visibility") == "public"]

    # Filter by creator
    if creator_id:
        portfolios = [p for p in portfolios if p.get("creator_id") == creator_id]

    # Search
    if search:
        search_lower = search.lower()
        portfolios = [
            p for p in portfolios
            if search_lower in p.get("name", "").lower()
            or search_lower in p.get("description", "").lower()
            or any(search_lower in tag.lower() for tag in p.get("tags", []))
        ]

    # Sort
    if sort_by == "performance":
        portfolios.sort(
            key=lambda p: p.get("performance", {}).get("year", 0),
            reverse=True
        )
    elif sort_by == "followers":
        portfolios.sort(key=lambda p: p.get("followers", 0), reverse=True)
    elif sort_by == "likes":
        portfolios.sort(key=lambda p: p.get("likes", 0), reverse=True)
    else:
        portfolios.sort(key=lambda p: p.get("created_at", ""), reverse=True)

    # Pagination
    portfolios = portfolios[offset:offset + limit]

    return [CommunityPortfolio(**p) for p in portfolios]


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    period: str = Query("year", enum=["month", "quarter", "year", "all_time"]),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get portfolio leaderboard ranked by performance.

    - **period**: Time period for performance ranking
    - **limit**: Maximum number of entries
    """
    data = load_portfolios()
    portfolios = list(data.get("portfolios", {}).values())

    # Only public portfolios
    portfolios = [p for p in portfolios if p.get("visibility") == "public"]

    # Get performance for period
    period_key = "all_time" if period == "all_time" else period

    # Sort by performance
    portfolios.sort(
        key=lambda p: p.get("performance", {}).get(period_key, 0),
        reverse=True
    )

    # Build leaderboard
    leaderboard = []
    for i, p in enumerate(portfolios[:limit]):
        leaderboard.append(LeaderboardEntry(
            portfolio_id=p["id"],
            portfolio_name=p["name"],
            creator_name=p["creator_name"],
            performance=p.get("performance", {}).get(period_key, 0),
            rank=i + 1,
        ))

    return leaderboard


@router.get("/{portfolio_id}", response_model=CommunityPortfolio)
async def get_portfolio(portfolio_id: str):
    """Get a specific portfolio by ID."""
    data = load_portfolios()
    portfolio = data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return CommunityPortfolio(**portfolio)


@router.post("/", response_model=CommunityPortfolio)
async def create_portfolio(
    request: CreatePortfolioRequest,
    creator_id: str = Query(..., description="User ID of the creator"),
    creator_name: str = Query(..., description="Display name of the creator"),
):
    """
    Create a new community portfolio.

    Holdings weights must sum to 100%.
    """
    # Validate holdings weights sum to 100
    total_weight = sum(h.weight for h in request.holdings)
    if abs(total_weight - 100) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Holdings weights must sum to 100% (current: {total_weight:.2f}%)"
        )

    # Validate at least one holding
    if not request.holdings:
        raise HTTPException(status_code=400, detail="At least one holding is required")

    # Create portfolio
    portfolio_id = generate_portfolio_id()
    now = datetime.utcnow().isoformat() + "Z"

    portfolio = CommunityPortfolio(
        id=portfolio_id,
        name=request.name,
        description=request.description,
        creator_id=creator_id,
        creator_name=creator_name,
        visibility=request.visibility,
        holdings=request.holdings,
        risk_level=request.risk_level,
        performance=PerformanceSnapshot(),
        followers=0,
        likes=0,
        created_at=now,
        updated_at=now,
        tags=request.tags,
    )

    # Save
    data = load_portfolios()
    data["portfolios"][portfolio_id] = portfolio.dict()
    save_portfolios(data)

    return portfolio


@router.put("/{portfolio_id}", response_model=CommunityPortfolio)
async def update_portfolio(
    portfolio_id: str,
    request: UpdatePortfolioRequest,
    user_id: str = Query(..., description="User ID for authorization"),
):
    """
    Update an existing portfolio.

    Only the creator can update their portfolio.
    """
    data = load_portfolios()
    portfolio = data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Check ownership
    if portfolio["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this portfolio")

    # Validate holdings if provided
    if request.holdings is not None:
        total_weight = sum(h.weight for h in request.holdings)
        if abs(total_weight - 100) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Holdings weights must sum to 100% (current: {total_weight:.2f}%)"
            )
        if not request.holdings:
            raise HTTPException(status_code=400, detail="At least one holding is required")

    # Update fields
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if key == "holdings":
                portfolio[key] = [h.dict() for h in value]
            elif key == "visibility":
                portfolio[key] = value.value
            else:
                portfolio[key] = value

    portfolio["updated_at"] = datetime.utcnow().isoformat() + "Z"

    # Save
    data["portfolios"][portfolio_id] = portfolio
    save_portfolios(data)

    # Notify followers about the update (only for public portfolios)
    if portfolio.get("visibility") == "public":
        try:
            from .notifications import notify_portfolio_followers
            changes = []
            if request.holdings is not None:
                changes.append("posities aangepast")
            if request.description is not None:
                changes.append("beschrijving bijgewerkt")
            if request.risk_level is not None:
                changes.append("risico niveau gewijzigd")
            change_message = ", ".join(changes) if changes else "portfolio bijgewerkt"
            notify_portfolio_followers(portfolio_id, portfolio["name"], change_message)
        except Exception as e:
            # Don't fail the update if notification fails
            print(f"Failed to send notifications: {e}")

    return CommunityPortfolio(**portfolio)


@router.delete("/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID for authorization"),
):
    """
    Delete a portfolio.

    Only the creator can delete their portfolio.
    """
    data = load_portfolios()
    portfolio = data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Check ownership
    if portfolio["creator_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this portfolio")

    # Delete
    del data["portfolios"][portfolio_id]
    save_portfolios(data)

    return {"message": "Portfolio deleted successfully"}


@router.post("/{portfolio_id}/like")
async def like_portfolio(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID"),
):
    """Like a portfolio."""
    data = load_portfolios()
    portfolio = data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Increment likes
    portfolio["likes"] = portfolio.get("likes", 0) + 1
    data["portfolios"][portfolio_id] = portfolio
    save_portfolios(data)

    return {"likes": portfolio["likes"]}


@router.post("/{portfolio_id}/follow", response_model=FollowResponse)
async def follow_portfolio(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID"),
    user_email: Optional[str] = Query(None, description="User email"),
):
    """
    Follow a portfolio.

    Rules:
    - Only PUBLIC portfolios can be followed
    - Cannot follow your own portfolio
    - One follow per user per portfolio (no duplicates)
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

    # Rule: Check if already following (no duplicates)
    user_follows = follows_data.get("by_user", {}).get(user_id, [])
    if portfolio_id in user_follows:
        return FollowResponse(
            success=True,
            followers_count=portfolio.get("followers", 0),
            is_following=True
        )

    # Create follow record
    follow_id = generate_follow_id()
    now = datetime.utcnow().isoformat() + "Z"

    follow = {
        "id": follow_id,
        "follower_user_id": user_id,
        "follower_email": user_email,
        "portfolio_id": portfolio_id,
        "followed_at": now
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
        followers_count=portfolio["followers"],
        is_following=True
    )


@router.delete("/{portfolio_id}/follow", response_model=FollowResponse)
async def unfollow_portfolio(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID"),
):
    """Unfollow a portfolio."""
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
            followers_count=portfolio.get("followers", 0),
            is_following=False
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
        followers_count=portfolio["followers"],
        is_following=False
    )


@router.get("/{portfolio_id}/is-following")
async def check_is_following(
    portfolio_id: str,
    user_id: str = Query(..., description="User ID"),
):
    """Check if user is following a portfolio."""
    follows_data = load_follows()
    user_follows = follows_data.get("by_user", {}).get(user_id, [])

    return {
        "is_following": portfolio_id in user_follows,
        "portfolio_id": portfolio_id
    }


@router.post("/{portfolio_id}/performance")
async def update_performance(
    portfolio_id: str,
    performance: PerformanceSnapshot,
    admin_key: str = Query(..., description="Admin API key for updating performance"),
):
    """
    Update portfolio performance metrics.

    This endpoint is intended for scheduled jobs that calculate performance.
    """
    # Simple admin key check (in production, use proper auth)
    if admin_key != "admin-performance-update-key":
        raise HTTPException(status_code=403, detail="Invalid admin key")

    data = load_portfolios()
    portfolio = data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Update performance
    portfolio["performance"] = performance.dict()
    portfolio["performance"]["updated_at"] = datetime.utcnow().isoformat() + "Z"

    data["portfolios"][portfolio_id] = portfolio
    save_portfolios(data)

    return {"message": "Performance updated successfully"}


# ============================================
# Follow System Endpoints
# ============================================

@router.get("/followed", response_model=List[FollowedPortfolioResponse])
async def get_followed_portfolios(
    user_id: str = Query(..., description="User ID"),
):
    """Get all portfolios followed by a user."""
    follows_data = load_follows()
    portfolio_data = load_portfolios()

    user_follows = follows_data.get("by_user", {}).get(user_id, [])

    result = []
    for portfolio_id in user_follows:
        portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)
        if portfolio:
            # Find follow record to get followed_at
            followed_at = None
            for follow in follows_data.get("follows", {}).values():
                if follow["follower_user_id"] == user_id and follow["portfolio_id"] == portfolio_id:
                    followed_at = follow["followed_at"]
                    break

            result.append(FollowedPortfolioResponse(
                portfolio=CommunityPortfolio(**portfolio),
                followed_at=followed_at or ""
            ))

    # Sort by followed_at descending (most recent first)
    result.sort(key=lambda x: x.followed_at, reverse=True)

    return result


# ============================================
# Performance Snapshot Endpoints
# ============================================

@router.post("/snapshots/create")
async def create_snapshots(
    snapshot_type: SnapshotType = Query(..., description="Type of snapshot"),
    admin_key: str = Query(..., description="Admin API key"),
):
    """
    Create performance snapshots for all public portfolios.

    This endpoint is intended for scheduled jobs (cron).
    Snapshots are IMMUTABLE once created.
    """
    if admin_key != "admin-performance-update-key":
        raise HTTPException(status_code=403, detail="Invalid admin key")

    portfolio_data = load_portfolios()
    snapshots_data = load_snapshots()
    market_data = load_market_data()

    now = datetime.utcnow().isoformat() + "Z"
    created_count = 0

    # Get all public portfolios
    public_portfolios = [
        (pid, p) for pid, p in portfolio_data.get("portfolios", {}).items()
        if p.get("visibility") == "public"
    ]

    for portfolio_id, portfolio in public_portfolios:
        # Calculate portfolio value from holdings
        total_value = 0.0
        holdings_snapshot = []

        for holding in portfolio.get("holdings", []):
            isin = holding.get("isin", "")
            weight = holding.get("weight", 0)

            # Look up price from market data (by ISIN or symbol)
            price = 0.0
            for _, md in market_data.items():
                if md.get("isin") == isin or md.get("symbol") == holding.get("symbol"):
                    price = md.get("last", md.get("bid", 0)) or 0
                    break

            # Assume base investment of 10000 for value calculation
            holding_value = 10000 * (weight / 100)
            total_value += holding_value

            holdings_snapshot.append({
                "isin": isin,
                "weight": weight,
                "price": price,
                "name": holding.get("name", "")
            })

        # Get previous snapshot for return calculation
        portfolio_snapshots = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])
        same_type_snapshots = [
            snapshots_data["snapshots"][sid]
            for sid in portfolio_snapshots
            if snapshots_data["snapshots"].get(sid, {}).get("snapshot_type") == snapshot_type.value
        ]

        # Sort by timestamp
        same_type_snapshots.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        return_pct = 0.0
        return_abs = 0.0
        cumulative_return_pct = 0.0

        if same_type_snapshots:
            prev = same_type_snapshots[0]
            prev_value = prev.get("total_value", 10000)
            if prev_value > 0:
                return_pct = ((total_value - prev_value) / prev_value) * 100
                return_abs = total_value - prev_value
                # Cumulative is based on first snapshot ever
                first_value = 10000  # Base value
                cumulative_return_pct = ((total_value - first_value) / first_value) * 100

        # Create snapshot record
        snapshot_id = generate_snapshot_id()
        snapshot = {
            "id": snapshot_id,
            "portfolio_id": portfolio_id,
            "timestamp": now,
            "snapshot_type": snapshot_type.value,
            "total_value": total_value,
            "holdings_value": total_value,
            "return_pct": round(return_pct, 4),
            "return_abs": round(return_abs, 2),
            "cumulative_return_pct": round(cumulative_return_pct, 4),
            "holdings_snapshot": holdings_snapshot
        }

        # Store snapshot
        snapshots_data["snapshots"][snapshot_id] = snapshot

        # Update by_portfolio index
        if portfolio_id not in snapshots_data["by_portfolio"]:
            snapshots_data["by_portfolio"][portfolio_id] = []
        snapshots_data["by_portfolio"][portfolio_id].append(snapshot_id)

        # Update by_type index
        if snapshot_type.value not in snapshots_data["by_type"]:
            snapshots_data["by_type"][snapshot_type.value] = []
        snapshots_data["by_type"][snapshot_type.value].append(snapshot_id)

        created_count += 1

    save_snapshots(snapshots_data)

    return {
        "message": f"Created {created_count} snapshots",
        "snapshot_type": snapshot_type.value,
        "timestamp": now
    }


@router.get("/{portfolio_id}/snapshots", response_model=SnapshotResponse)
async def get_portfolio_snapshots(
    portfolio_id: str,
    snapshot_type: Optional[SnapshotType] = Query(None, description="Filter by snapshot type"),
    limit: int = Query(12, ge=1, le=100, description="Maximum snapshots to return"),
):
    """Get performance snapshot history for a portfolio."""
    snapshots_data = load_snapshots()

    portfolio_snapshot_ids = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])

    snapshots = []
    for sid in portfolio_snapshot_ids:
        snapshot = snapshots_data.get("snapshots", {}).get(sid)
        if snapshot:
            if snapshot_type is None or snapshot.get("snapshot_type") == snapshot_type.value:
                snapshots.append(PerformanceSnapshotRecord(**snapshot))

    # Sort by timestamp descending
    snapshots.sort(key=lambda x: x.timestamp, reverse=True)
    snapshots = snapshots[:limit]

    return SnapshotResponse(
        portfolio_id=portfolio_id,
        snapshots=snapshots,
        count=len(snapshots)
    )


# ============================================
# Enhanced Leaderboard Endpoints
# ============================================

@router.get("/leaderboard/enhanced", response_model=List[EnhancedLeaderboardEntry])
async def get_enhanced_leaderboard(
    period: str = Query("year", enum=["month", "quarter", "year", "all_time"]),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get enhanced portfolio leaderboard with volatility tiebreaker.

    Ranking:
    1. Primary: % return (descending)
    2. Tiebreaker: Volatility (ascending - lower is better)
    """
    portfolio_data = load_portfolios()
    snapshots_data = load_snapshots()

    # Get public portfolios
    public_portfolios = [
        (pid, p) for pid, p in portfolio_data.get("portfolios", {}).items()
        if p.get("visibility") == "public"
    ]

    # Calculate period bounds
    now = datetime.utcnow()
    if period == "month":
        period_start = (now - timedelta(days=30)).isoformat() + "Z"
    elif period == "quarter":
        period_start = (now - timedelta(days=90)).isoformat() + "Z"
    elif period == "year":
        period_start = (now - timedelta(days=365)).isoformat() + "Z"
    else:
        period_start = "1970-01-01T00:00:00Z"

    period_end = now.isoformat() + "Z"

    entries = []
    for portfolio_id, portfolio in public_portfolios:
        # Get performance from stored data
        perf = portfolio.get("performance", {})
        period_key = "all_time" if period == "all_time" else period
        return_pct = perf.get(period_key, 0)

        # Calculate volatility from daily snapshots if available
        volatility = 0.0
        portfolio_snapshots = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])
        daily_returns = []

        for sid in portfolio_snapshots:
            snapshot = snapshots_data.get("snapshots", {}).get(sid)
            if snapshot and snapshot.get("snapshot_type") == "daily":
                if snapshot.get("timestamp", "") >= period_start:
                    daily_returns.append(snapshot.get("return_pct", 0))

        if len(daily_returns) > 1:
            mean_return = sum(daily_returns) / len(daily_returns)
            variance = sum((r - mean_return) ** 2 for r in daily_returns) / len(daily_returns)
            volatility = math.sqrt(variance)

        entries.append(EnhancedLeaderboardEntry(
            rank=0,  # Will be set after sorting
            portfolio_id=portfolio_id,
            portfolio_name=portfolio.get("name", ""),
            creator_id=portfolio.get("creator_id", ""),
            creator_name=portfolio.get("creator_name", ""),
            return_pct=return_pct,
            volatility=volatility,
            follower_count=portfolio.get("followers", 0),
            period=period,
            period_start=period_start,
            period_end=period_end
        ))

    # Sort by return_pct descending, then volatility ascending (tiebreaker)
    entries.sort(key=lambda e: (-e.return_pct, e.volatility))

    # Assign ranks
    for i, entry in enumerate(entries[:limit]):
        entry.rank = i + 1

    return entries[:limit]


@router.get("/trending", response_model=List[TrendingEntry])
async def get_trending_portfolios(
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get trending portfolios (most followed recently).

    This looks at follow activity in the specified time period.
    """
    follows_data = load_follows()
    portfolio_data = load_portfolios()

    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"

    # Count recent follows per portfolio
    recent_follows = {}
    for follow in follows_data.get("follows", {}).values():
        if follow.get("followed_at", "") >= cutoff:
            pid = follow["portfolio_id"]
            recent_follows[pid] = recent_follows.get(pid, 0) + 1

    # Get portfolio details
    entries = []
    for portfolio_id, new_follower_count in recent_follows.items():
        portfolio = portfolio_data.get("portfolios", {}).get(portfolio_id)
        if portfolio and portfolio.get("visibility") == "public":
            entries.append(TrendingEntry(
                portfolio_id=portfolio_id,
                portfolio_name=portfolio.get("name", ""),
                creator_name=portfolio.get("creator_name", ""),
                new_followers=new_follower_count,
                total_followers=portfolio.get("followers", 0),
                return_pct=portfolio.get("performance", {}).get("year", 0)
            ))

    # Sort by new followers descending
    entries.sort(key=lambda e: -e.new_followers)

    return entries[:limit]
