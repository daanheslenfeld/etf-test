"""Portfolio positions endpoints."""
from fastapi import APIRouter, Depends
from models.schemas import PositionsResponse, Position, UserContext
from middleware.auth import require_trading_approved
from services.ib_client import get_ib_client
from decimal import Decimal

router = APIRouter(prefix="/trading", tags=["Positions"])


@router.get("/positions", response_model=PositionsResponse)
async def get_positions(
    user: UserContext = Depends(require_trading_approved)
) -> PositionsResponse:
    """
    Get current portfolio positions from the linked broker account.
    """
    ib_client = get_ib_client()

    raw_positions = await ib_client.get_positions(user.ib_account_id)

    positions = []
    for raw in raw_positions:
        positions.append(Position(
            symbol=raw.get("contractDesc", raw.get("ticker", "")),
            conid=raw.get("conid", 0),
            quantity=Decimal(str(raw.get("position", 0))),
            avg_cost=Decimal(str(raw.get("avgCost", 0))),
            market_value=Decimal(str(raw.get("mktValue", 0))) if raw.get("mktValue") else None,
            unrealized_pnl=Decimal(str(raw.get("unrealizedPnl", 0))) if raw.get("unrealizedPnl") else None,
            realized_pnl=Decimal(str(raw.get("realizedPnl", 0))) if raw.get("realizedPnl") else None,
            currency=raw.get("currency", "USD")
        ))

    return PositionsResponse(
        positions=positions,
        account_id=user.ib_account_id,
        count=len(positions)
    )
