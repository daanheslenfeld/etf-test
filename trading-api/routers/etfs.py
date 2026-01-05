"""ETF list and metadata endpoints."""
from fastapi import APIRouter, Depends
from models.schemas import ETFListResponse, ETFInfo, UserContext
from middleware.auth import require_trading_approved
from services.ib_client import get_ib_client

router = APIRouter(prefix="/trading", tags=["ETFs"])


@router.get("/etfs", response_model=ETFListResponse)
async def get_etfs(
    user: UserContext = Depends(require_trading_approved)
) -> ETFListResponse:
    """
    Get list of tradable ETFs.

    Returns the MVP ETF list with metadata including IB contract IDs.
    """
    ib_client = get_ib_client()
    etfs_data = ib_client.get_mvp_etfs()

    etfs = [ETFInfo(**etf) for etf in etfs_data]

    return ETFListResponse(
        etfs=etfs,
        count=len(etfs)
    )
