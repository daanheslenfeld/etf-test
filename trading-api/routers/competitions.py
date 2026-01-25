"""
Competitions Router

Handles competition operations:
- List competitions (upcoming, active, completed)
- Get active competition
- Get competition standings
- Finalize competition and award badges
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import uuid


router = APIRouter(prefix="/competitions", tags=["competitions"])

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
COMPETITIONS_FILE = os.path.join(DATA_DIR, "competitions.json")
PORTFOLIOS_FILE = os.path.join(DATA_DIR, "community_portfolios.json")
SNAPSHOTS_FILE = os.path.join(DATA_DIR, "performance_snapshots.json")


# ============================================
# Enums
# ============================================

class CompetitionStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"


class CompetitionType(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


# ============================================
# Models
# ============================================

class CompetitionWinner(BaseModel):
    rank: int
    portfolio_id: str
    portfolio_name: str
    creator_id: str
    creator_name: str
    return_pct: float
    badge_type: str  # gold, silver, bronze


class Competition(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: CompetitionType
    status: CompetitionStatus
    start_date: str
    end_date: str
    prize_description: Optional[str] = None
    winners: List[CompetitionWinner] = []
    participant_count: int = 0
    created_at: str
    finalized_at: Optional[str] = None


class CompetitionListResponse(BaseModel):
    competitions: List[Competition]
    total: int


class StandingEntry(BaseModel):
    rank: int
    portfolio_id: str
    portfolio_name: str
    creator_id: str
    creator_name: str
    return_pct: float
    is_winner: bool = False


class StandingsResponse(BaseModel):
    competition: Competition
    standings: List[StandingEntry]
    total_participants: int


class CreateCompetitionRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    type: CompetitionType
    start_date: str
    end_date: str
    prize_description: Optional[str] = None


# ============================================
# Data Operations
# ============================================

def load_competitions() -> dict:
    """Load competitions from JSON file."""
    if os.path.exists(COMPETITIONS_FILE):
        try:
            with open(COMPETITIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"competitions": {}}


def save_competitions(data: dict):
    """Save competitions to JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(COMPETITIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_portfolios() -> dict:
    """Load portfolios from JSON file."""
    if os.path.exists(PORTFOLIOS_FILE):
        try:
            with open(PORTFOLIOS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"portfolios": {}}


def load_snapshots() -> dict:
    """Load performance snapshots."""
    if os.path.exists(SNAPSHOTS_FILE):
        try:
            with open(SNAPSHOTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"snapshots": {}}


def get_portfolio_performance(portfolio_id: str, start_date: str, end_date: str) -> float:
    """
    Calculate portfolio performance between two dates.

    Returns return percentage as decimal (0.10 = 10%).
    """
    snapshots_data = load_snapshots()
    portfolio_snapshots = snapshots_data.get("snapshots", {}).get(portfolio_id, [])

    if not portfolio_snapshots:
        # Try to use cached performance from portfolio
        portfolios_data = load_portfolios()
        portfolio = portfolios_data.get("portfolios", {}).get(portfolio_id)
        if portfolio and portfolio.get("performance"):
            # Use year performance as fallback
            return portfolio["performance"].get("year", 0)
        return 0.0

    # Find snapshots at start and end dates
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

    start_value = None
    end_value = None

    for snapshot in sorted(portfolio_snapshots, key=lambda x: x.get("date", "")):
        snap_date = datetime.fromisoformat(snapshot["date"].replace('Z', '+00:00'))

        if snap_date <= start_dt:
            start_value = snapshot.get("total_value", 0)
        if snap_date <= end_dt:
            end_value = snapshot.get("total_value", 0)

    if start_value and end_value and start_value > 0:
        return (end_value - start_value) / start_value

    return 0.0


def update_competition_status(competition: dict) -> dict:
    """Update competition status based on dates."""
    now = datetime.utcnow()
    start = datetime.fromisoformat(competition["start_date"].replace('Z', '+00:00'))
    end = datetime.fromisoformat(competition["end_date"].replace('Z', '+00:00'))

    if competition["status"] == "completed":
        return competition

    if now < start:
        competition["status"] = "upcoming"
    elif now > end:
        competition["status"] = "completed"
    else:
        competition["status"] = "active"

    return competition


# ============================================
# API Endpoints
# ============================================

@router.get("/", response_model=CompetitionListResponse)
async def list_competitions(
    status: Optional[CompetitionStatus] = None,
    type: Optional[CompetitionType] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    List all competitions, optionally filtered by status or type.
    """
    data = load_competitions()
    all_competitions = list(data.get("competitions", {}).values())

    # Update statuses
    for comp in all_competitions:
        update_competition_status(comp)

    # Filter by status
    if status:
        all_competitions = [c for c in all_competitions if c.get("status") == status.value]

    # Filter by type
    if type:
        all_competitions = [c for c in all_competitions if c.get("type") == type.value]

    # Sort by start_date descending
    all_competitions.sort(key=lambda x: x.get("start_date", ""), reverse=True)

    # Paginate
    total = len(all_competitions)
    paginated = all_competitions[offset:offset + limit]

    return CompetitionListResponse(
        competitions=[Competition(**c) for c in paginated],
        total=total
    )


@router.get("/active", response_model=Optional[Competition])
async def get_active_competition():
    """
    Get the currently active competition, if any.

    Returns the most recent active competition.
    """
    data = load_competitions()
    all_competitions = list(data.get("competitions", {}).values())

    # Update statuses and find active ones
    active = []
    for comp in all_competitions:
        update_competition_status(comp)
        if comp.get("status") == "active":
            active.append(comp)

    if not active:
        return None

    # Return most recent active
    active.sort(key=lambda x: x.get("start_date", ""), reverse=True)
    return Competition(**active[0])


@router.get("/{competition_id}", response_model=Competition)
async def get_competition(competition_id: str):
    """
    Get a specific competition by ID.
    """
    data = load_competitions()
    competition = data.get("competitions", {}).get(competition_id)

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    update_competition_status(competition)
    return Competition(**competition)


@router.get("/{competition_id}/standings", response_model=StandingsResponse)
async def get_competition_standings(
    competition_id: str,
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get standings for a competition.

    Returns portfolios ranked by performance during the competition period.
    """
    data = load_competitions()
    competition = data.get("competitions", {}).get(competition_id)

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    update_competition_status(competition)

    # Get all public portfolios
    portfolios_data = load_portfolios()
    portfolios = portfolios_data.get("portfolios", {})

    public_portfolios = [
        (pid, p) for pid, p in portfolios.items()
        if p.get("visibility") == "public"
    ]

    # Calculate performance for each
    standings = []
    for portfolio_id, portfolio in public_portfolios:
        return_pct = get_portfolio_performance(
            portfolio_id,
            competition["start_date"],
            competition["end_date"]
        )

        standings.append({
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio.get("name", "Unknown"),
            "creator_id": portfolio.get("creator_id", ""),
            "creator_name": portfolio.get("creator_name", "Unknown"),
            "return_pct": return_pct,
            "is_winner": False
        })

    # Sort by return percentage descending
    standings.sort(key=lambda x: x["return_pct"], reverse=True)

    # Add ranks and mark winners
    winner_ids = {w["portfolio_id"] for w in competition.get("winners", [])}
    for i, entry in enumerate(standings[:limit]):
        entry["rank"] = i + 1
        entry["is_winner"] = entry["portfolio_id"] in winner_ids

    return StandingsResponse(
        competition=Competition(**competition),
        standings=[StandingEntry(**s) for s in standings[:limit]],
        total_participants=len(standings)
    )


@router.post("/", response_model=Competition)
async def create_competition(request: CreateCompetitionRequest):
    """
    Create a new competition.
    """
    competition_id = str(uuid.uuid4())

    competition = Competition(
        id=competition_id,
        name=request.name,
        description=request.description,
        type=request.type,
        status=CompetitionStatus.UPCOMING,
        start_date=request.start_date,
        end_date=request.end_date,
        prize_description=request.prize_description,
        winners=[],
        participant_count=0,
        created_at=datetime.utcnow().isoformat() + "Z"
    )

    # Update status based on dates
    comp_dict = competition.dict()
    update_competition_status(comp_dict)

    # Save
    data = load_competitions()
    data["competitions"][competition_id] = comp_dict
    save_competitions(data)

    return Competition(**comp_dict)


@router.post("/{competition_id}/finalize", response_model=Competition)
async def finalize_competition(competition_id: str):
    """
    Finalize a competition and determine winners.

    Awards badges to top 3 performers.
    This should only be called after the competition end date.
    """
    data = load_competitions()
    competition = data.get("competitions", {}).get(competition_id)

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    update_competition_status(competition)

    if competition["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail="Competition must be completed before finalizing"
        )

    if competition.get("finalized_at"):
        raise HTTPException(
            status_code=400,
            detail="Competition has already been finalized"
        )

    # Get standings
    portfolios_data = load_portfolios()
    portfolios = portfolios_data.get("portfolios", {})

    public_portfolios = [
        (pid, p) for pid, p in portfolios.items()
        if p.get("visibility") == "public"
    ]

    standings = []
    for portfolio_id, portfolio in public_portfolios:
        return_pct = get_portfolio_performance(
            portfolio_id,
            competition["start_date"],
            competition["end_date"]
        )

        standings.append({
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio.get("name", "Unknown"),
            "creator_id": portfolio.get("creator_id", ""),
            "creator_name": portfolio.get("creator_name", "Unknown"),
            "return_pct": return_pct
        })

    # Sort by return percentage
    standings.sort(key=lambda x: x["return_pct"], reverse=True)

    # Determine winners (top 3)
    badge_types = ["gold", "silver", "bronze"]
    winners = []

    for i, entry in enumerate(standings[:3]):
        winner = CompetitionWinner(
            rank=i + 1,
            portfolio_id=entry["portfolio_id"],
            portfolio_name=entry["portfolio_name"],
            creator_id=entry["creator_id"],
            creator_name=entry["creator_name"],
            return_pct=entry["return_pct"],
            badge_type=badge_types[i]
        )
        winners.append(winner)

        # Award badge to portfolio
        try:
            award_competition_badge(
                entry["portfolio_id"],
                competition["id"],
                competition["name"],
                badge_types[i],
                i + 1
            )
        except Exception as e:
            print(f"Failed to award badge: {e}")

    # Update competition
    competition["winners"] = [w.dict() for w in winners]
    competition["participant_count"] = len(standings)
    competition["finalized_at"] = datetime.utcnow().isoformat() + "Z"
    competition["status"] = "completed"

    # Save
    data["competitions"][competition_id] = competition
    save_competitions(data)

    # Send notifications to winners
    try:
        from .notifications import create_notification, NotificationType

        for winner in winners:
            rank_names = {1: "eerste", 2: "tweede", 3: "derde"}
            create_notification(
                user_id=winner.creator_id,
                notification_type=NotificationType.COMPETITION_ENDED,
                title=f"Je bent {rank_names.get(winner.rank, winner.rank)}!",
                message=f"Gefeliciteerd! Je hebt de {rank_names.get(winner.rank, winner.rank)} plaats behaald in {competition['name']}",
                data={
                    "competition_id": competition_id,
                    "rank": winner.rank,
                    "badge_type": winner.badge_type
                }
            )
    except Exception as e:
        print(f"Failed to send winner notifications: {e}")

    return Competition(**competition)


def award_competition_badge(
    portfolio_id: str,
    competition_id: str,
    competition_name: str,
    badge_type: str,
    rank: int
):
    """
    Award a competition badge to a portfolio.

    Adds badge to the portfolio's badges array.
    """
    portfolios_data = load_portfolios()
    portfolio = portfolios_data.get("portfolios", {}).get(portfolio_id)

    if not portfolio:
        return

    # Initialize badges array if not exists
    if "badges" not in portfolio:
        portfolio["badges"] = []

    # Add badge
    badge = {
        "id": str(uuid.uuid4()),
        "type": f"competition_winner_{badge_type}",
        "competition_id": competition_id,
        "competition_name": competition_name,
        "rank": rank,
        "awarded_at": datetime.utcnow().isoformat() + "Z"
    }

    portfolio["badges"].append(badge)

    # Save
    portfolios_data["portfolios"][portfolio_id] = portfolio

    with open(PORTFOLIOS_FILE, "w", encoding="utf-8") as f:
        json.dump(portfolios_data, f, indent=2, ensure_ascii=False)
