"""Portfolio positions endpoints with real-time market values."""
from fastapi import APIRouter, Depends
from models.schemas import PositionsResponse, Position, UserContext
from middleware.auth import require_trading_approved
from services.ib_client import get_ib_client
from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["Positions"])


def safe_decimal(value, default=0) -> Decimal:
    """Safely convert a value to Decimal, handling None and invalid values."""
    if value is None:
        return Decimal(str(default))
    try:
        val = float(value)
        if val != val:  # NaN check
            return Decimal(str(default))
        return Decimal(str(val))
    except (ValueError, TypeError):
        return Decimal(str(default))


@router.get("/positions", response_model=PositionsResponse)
async def get_positions(
    user: UserContext = Depends(require_trading_approved)
) -> PositionsResponse:
    """
    Get current portfolio positions with real-time market values.

    Each position includes:
    - Symbol, quantity, average cost
    - Last price (from market data)
    - Market value (qty × last price)
    - Unrealized P&L (€ and %)

    Market values are NEVER €0 if quantity > 0.
    Falls back to cost basis if market data unavailable.
    """
    ib_client = get_ib_client()

    raw_positions = await ib_client.get_positions(user.ib_account_id)
    market_data = ib_client.get_all_market_data()

    positions = []
    for raw in raw_positions:
        conid = raw.get("conid", 0)
        symbol = raw.get("contractDesc", raw.get("ticker", ""))
        quantity = safe_decimal(raw.get("position", 0))
        avg_cost = safe_decimal(raw.get("avgCost", 0))
        currency = raw.get("currency", "EUR")

        # Skip zero positions
        if quantity == 0:
            continue

        # Calculate cost basis
        cost_basis = quantity * avg_cost

        # Get market price from streaming data
        last_price: Optional[Decimal] = None
        price_stale = False

        if conid and conid in market_data:
            md = market_data[conid]
            # Priority: last > bid > ask
            raw_price = md.get("last") or md.get("bid") or md.get("ask")
            if raw_price and float(raw_price) > 0:
                last_price = safe_decimal(raw_price)
            price_stale = md.get("delayed", False)

        # Calculate market value
        if last_price and last_price > 0:
            market_value = quantity * last_price
        else:
            # CRITICAL: Never show €0 for held positions
            # Fallback to cost basis if no market price
            market_value = cost_basis
            last_price = avg_cost
            price_stale = True

        # Calculate unrealized P&L
        unrealized_pnl = market_value - cost_basis
        unrealized_pnl_pct = (unrealized_pnl / cost_basis * 100) if cost_basis != 0 else Decimal("0")

        positions.append(Position(
            symbol=symbol,
            conid=conid,
            quantity=quantity,
            avg_cost=avg_cost,
            last_price=last_price,
            market_value=market_value,
            unrealized_pnl=unrealized_pnl,
            unrealized_pnl_pct=round(float(unrealized_pnl_pct), 2),
            realized_pnl=safe_decimal(raw.get("realizedPnl")),
            currency=currency,
            price_stale=price_stale
        ))

    # Calculate totals
    total_market_value = sum(p.market_value for p in positions)
    total_cost = sum(p.quantity * p.avg_cost for p in positions)
    total_unrealized_pnl = sum(p.unrealized_pnl for p in positions)
    total_pnl_pct = (float(total_unrealized_pnl) / float(total_cost) * 100) if total_cost != 0 else 0

    return PositionsResponse(
        positions=positions,
        account_id=user.ib_account_id,
        count=len(positions),
        total_market_value=total_market_value,
        total_unrealized_pnl=total_unrealized_pnl,
        total_unrealized_pnl_pct=round(total_pnl_pct, 2)
    )
