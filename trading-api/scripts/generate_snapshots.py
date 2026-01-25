#!/usr/bin/env python3
"""
Performance Snapshot Generator

Generates immutable performance snapshots for PUBLIC portfolios.
Snapshots are never recalculated - they represent a point-in-time value.

Usage:
    python generate_snapshots.py daily      # Generate daily snapshots
    python generate_snapshots.py monthly    # Generate month-end snapshots
    python generate_snapshots.py quarterly  # Generate quarter-end snapshots
    python generate_snapshots.py all        # Generate all types

Can be run when market is closed - uses cached/last known prices.
"""

import json
import os
import sys
import uuid
from datetime import datetime, timedelta
from typing import Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Data paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
PORTFOLIOS_FILE = os.path.join(DATA_DIR, "community_portfolios.json")
SNAPSHOTS_FILE = os.path.join(DATA_DIR, "performance_snapshots.json")
MARKET_DATA_FILE = os.path.join(DATA_DIR, "market_data_cache.json")
TRADABILITY_FILE = os.path.join(DATA_DIR, "etf_tradability.json")

# Base investment value for calculating returns
BASE_INVESTMENT = 10000.0


def load_json(filepath: str, default: dict) -> dict:
    """Load JSON file with default fallback."""
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return default


def save_json(filepath: str, data: dict):
    """Save data to JSON file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_snapshot_id() -> str:
    """Generate a unique snapshot ID."""
    return f"snap-{uuid.uuid4().hex[:12]}"


def get_price_for_isin(isin: str, market_data: dict, tradability: dict) -> float:
    """
    Get the last known price for an ISIN.
    Uses market data cache and tradability mapping.
    Returns 0.0 if price not found.
    """
    etf_info = tradability.get("etfs", {}).get(isin)
    if not etf_info:
        return 0.0

    contract = etf_info.get("contract", {})
    conid = str(contract.get("conId", ""))

    if not conid:
        return 0.0

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


def calculate_portfolio_value(portfolio: dict, market_data: dict, tradability: dict) -> tuple:
    """
    Calculate the total value of a portfolio.

    Returns:
        (total_value, holdings_snapshot)
    """
    holdings = portfolio.get("holdings", [])
    holdings_snapshot = []
    total_value = 0.0

    for holding in holdings:
        isin = holding.get("isin", "")
        name = holding.get("name", "")
        weight = holding.get("weight", 0)

        price = get_price_for_isin(isin, market_data, tradability)

        # Calculate value based on weight (assuming base investment)
        # Weight is percentage, so 50% of 10000 = 5000
        value = BASE_INVESTMENT * (weight / 100)

        holdings_snapshot.append({
            "isin": isin,
            "name": name,
            "weight": weight,
            "price": price,
            "value": round(value, 2)
        })

        total_value += value

    return round(total_value, 2), holdings_snapshot


def get_previous_snapshot(portfolio_id: str, period_type: str, snapshots_data: dict) -> Optional[dict]:
    """Get the most recent snapshot of the same type for a portfolio."""
    portfolio_snaps = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])

    matching = []
    for snap_id in portfolio_snaps:
        snap = snapshots_data.get("snapshots", {}).get(snap_id)
        if snap and snap.get("period_type") == period_type:
            matching.append(snap)

    if not matching:
        return None

    # Sort by timestamp descending
    matching.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return matching[0]


def get_first_snapshot(portfolio_id: str, snapshots_data: dict) -> Optional[dict]:
    """Get the first ever snapshot for a portfolio (for cumulative return)."""
    portfolio_snaps = snapshots_data.get("by_portfolio", {}).get(portfolio_id, [])

    if not portfolio_snaps:
        return None

    all_snaps = []
    for snap_id in portfolio_snaps:
        snap = snapshots_data.get("snapshots", {}).get(snap_id)
        if snap:
            all_snaps.append(snap)

    if not all_snaps:
        return None

    # Sort by timestamp ascending
    all_snaps.sort(key=lambda x: x.get("timestamp", ""))
    return all_snaps[0]


def should_create_snapshot(period_type: str, portfolio_id: str, snapshots_data: dict) -> bool:
    """
    Check if we should create a snapshot based on period type.

    - Daily: Only one snapshot per day
    - Monthly: Only on last day of month or if no snapshot this month
    - Quarterly: Only on last day of quarter or if no snapshot this quarter
    """
    now = datetime.utcnow()
    today = now.date()

    prev = get_previous_snapshot(portfolio_id, period_type, snapshots_data)

    if not prev:
        return True  # No previous snapshot, create one

    prev_time = datetime.fromisoformat(prev["timestamp"].replace("Z", "+00:00"))
    prev_date = prev_time.date()

    if period_type == "daily":
        # One per day
        return prev_date < today

    elif period_type == "monthly":
        # Check if we're in a new month
        return (prev_date.year, prev_date.month) < (today.year, today.month)

    elif period_type == "quarterly":
        # Check if we're in a new quarter
        prev_quarter = (prev_date.year, (prev_date.month - 1) // 3)
        curr_quarter = (today.year, (today.month - 1) // 3)
        return prev_quarter < curr_quarter

    return False


def create_snapshot(
    portfolio: dict,
    period_type: str,
    market_data: dict,
    tradability: dict,
    snapshots_data: dict
) -> dict:
    """Create a new performance snapshot for a portfolio."""
    portfolio_id = portfolio["id"]
    now = datetime.utcnow().isoformat() + "Z"

    # Calculate current value
    total_value, holdings_snapshot = calculate_portfolio_value(
        portfolio, market_data, tradability
    )

    # Get previous snapshot for period return
    prev_snap = get_previous_snapshot(portfolio_id, period_type, snapshots_data)

    return_pct = 0.0
    return_abs = 0.0

    if prev_snap:
        prev_value = prev_snap.get("total_value", BASE_INVESTMENT)
        if prev_value > 0:
            return_abs = total_value - prev_value
            return_pct = (return_abs / prev_value) * 100

    # Get first snapshot for cumulative return
    first_snap = get_first_snapshot(portfolio_id, snapshots_data)
    cumulative_return_pct = 0.0

    if first_snap:
        first_value = first_snap.get("total_value", BASE_INVESTMENT)
        if first_value > 0:
            cumulative_return_pct = ((total_value - first_value) / first_value) * 100
    else:
        # This is the first snapshot, no cumulative return yet
        cumulative_return_pct = 0.0

    snapshot = {
        "id": generate_snapshot_id(),
        "portfolio_id": portfolio_id,
        "timestamp": now,
        "period_type": period_type,
        "total_value": total_value,
        "cash": 0.0,  # Assume fully invested
        "return_pct": round(return_pct, 4),
        "return_abs": round(return_abs, 2),
        "cumulative_return_pct": round(cumulative_return_pct, 4),
        "holdings_snapshot": holdings_snapshot
    }

    return snapshot


def generate_snapshots(period_type: str):
    """Generate snapshots for all public portfolios."""
    print(f"\n{'='*60}")
    print(f"Generating {period_type.upper()} snapshots")
    print(f"{'='*60}")
    print(f"Time: {datetime.utcnow().isoformat()}Z")

    # Load data
    portfolios_data = load_json(PORTFOLIOS_FILE, {"portfolios": {}})
    snapshots_data = load_json(SNAPSHOTS_FILE, {
        "snapshots": {}, "by_portfolio": {}, "by_type": {}, "last_updated": None
    })
    market_data = load_json(MARKET_DATA_FILE, {"data": {}})
    tradability = load_json(TRADABILITY_FILE, {"etfs": {}})

    print(f"Market data timestamp: {market_data.get('timestamp', 'N/A')}")

    # Get public portfolios
    public_portfolios = [
        p for p in portfolios_data.get("portfolios", {}).values()
        if p.get("visibility") == "public"
    ]

    print(f"Found {len(public_portfolios)} public portfolios")

    created_count = 0
    skipped_count = 0

    for portfolio in public_portfolios:
        portfolio_id = portfolio["id"]
        portfolio_name = portfolio.get("name", "Unknown")

        # Check if we should create a snapshot
        if not should_create_snapshot(period_type, portfolio_id, snapshots_data):
            print(f"  SKIP: {portfolio_name} (already has {period_type} snapshot)")
            skipped_count += 1
            continue

        # Create snapshot
        snapshot = create_snapshot(
            portfolio, period_type, market_data, tradability, snapshots_data
        )

        # Store snapshot
        snap_id = snapshot["id"]
        snapshots_data["snapshots"][snap_id] = snapshot

        # Update by_portfolio index
        if portfolio_id not in snapshots_data["by_portfolio"]:
            snapshots_data["by_portfolio"][portfolio_id] = []
        snapshots_data["by_portfolio"][portfolio_id].append(snap_id)

        # Update by_type index
        if period_type not in snapshots_data["by_type"]:
            snapshots_data["by_type"][period_type] = []
        snapshots_data["by_type"][period_type].append(snap_id)

        print(f"  CREATE: {portfolio_name}")
        print(f"    Value: €{snapshot['total_value']:,.2f}")
        print(f"    Return: {snapshot['return_pct']:+.2f}% (€{snapshot['return_abs']:+,.2f})")
        print(f"    Cumulative: {snapshot['cumulative_return_pct']:+.2f}%")

        created_count += 1

    # Save snapshots
    snapshots_data["last_updated"] = datetime.utcnow().isoformat() + "Z"
    save_json(SNAPSHOTS_FILE, snapshots_data)

    print(f"\n{'='*60}")
    print(f"Summary: Created {created_count}, Skipped {skipped_count}")
    print(f"{'='*60}\n")

    return created_count


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python generate_snapshots.py <period_type>")
        print("  period_type: daily, monthly, quarterly, all")
        sys.exit(1)

    period_arg = sys.argv[1].lower()

    if period_arg == "all":
        for period in ["daily", "monthly", "quarterly"]:
            generate_snapshots(period)
    elif period_arg in ["daily", "monthly", "quarterly"]:
        generate_snapshots(period_arg)
    else:
        print(f"Invalid period type: {period_arg}")
        print("Valid options: daily, monthly, quarterly, all")
        sys.exit(1)


if __name__ == "__main__":
    main()
