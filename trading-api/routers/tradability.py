"""Tradability endpoints for ETF lookups."""
from fastapi import APIRouter, Depends, Query
from typing import Optional

from models.schemas import (
    TradabilityResponse,
    TradabilityMetadata,
    ETFTradability,
    ETFContract,
    UserContext,
)
from middleware.auth import require_trading_approved
from services.tradability_service import get_tradability_service

router = APIRouter(prefix="/trading", tags=["Tradability"])


@router.get("/tradability", response_model=TradabilityResponse)
async def get_tradable_etfs(
    user: UserContext = Depends(require_trading_approved)
) -> TradabilityResponse:
    """
    Get all ETFs that are tradable via LYNX/IB.

    Returns pre-checked tradability data. This is the single source of truth
    for which ETFs can be traded. Use this to filter ETF lists in the UI.
    """
    service = get_tradability_service()

    metadata_dict = service.get_metadata()
    metadata = TradabilityMetadata(
        checked_at=metadata_dict.get("checked_at"),
        total_checked=metadata_dict.get("total_checked", 0),
        total_tradable=metadata_dict.get("total_tradable", 0),
        total_blocked=metadata_dict.get("total_blocked", 0),
        ib_port=metadata_dict.get("ib_port"),
    )

    tradable_list = service.get_all_tradable()
    tradable_etfs = []

    for etf in tradable_list:
        contract_data = etf.get("contract")
        contract = None
        if contract_data:
            contract = ETFContract(
                conId=contract_data.get("conId"),
                symbol=contract_data.get("symbol"),
                exchange=contract_data.get("exchange"),
                primaryExchange=contract_data.get("primaryExchange"),
                currency=contract_data.get("currency"),
                secType=contract_data.get("secType"),
                localSymbol=contract_data.get("localSymbol"),
                tradingClass=contract_data.get("tradingClass"),
            )

        tradable_etfs.append(ETFTradability(
            isin=etf["isin"],
            name=etf["name"],
            input_currency=etf.get("input_currency"),
            tradable_via_lynx=True,
            contract=contract,
            checked_at=etf.get("checked_at"),
        ))

    return TradabilityResponse(
        metadata=metadata,
        tradable_etfs=tradable_etfs,
        count=len(tradable_etfs),
    )


@router.get("/tradability/{isin}")
async def check_etf_tradability(
    isin: str,
    user: UserContext = Depends(require_trading_approved)
) -> dict:
    """
    Check if a specific ETF is tradable.

    Args:
        isin: The ISIN of the ETF to check.

    Returns:
        Tradability info for the specified ETF.
    """
    service = get_tradability_service()
    etf_info = service.get_etf_info(isin)

    if not etf_info:
        return {
            "isin": isin,
            "tradable_via_lynx": False,
            "reason_if_not_tradable": "not_checked",
            "message": "ETF not found in tradability database",
        }

    return etf_info


@router.get("/tradability/stats/summary")
async def get_tradability_stats(
    user: UserContext = Depends(require_trading_approved)
) -> dict:
    """
    Get tradability statistics summary.

    Returns counts of checked, tradable, and blocked ETFs.
    """
    service = get_tradability_service()
    return service.get_stats()


@router.post("/tradability/reload")
async def reload_tradability_data(
    user: UserContext = Depends(require_trading_approved)
) -> dict:
    """
    Reload tradability data from file.

    Use this after running the check_etf_tradability.py script.
    """
    service = get_tradability_service()
    service.reload()
    return {
        "success": True,
        "message": "Tradability data reloaded",
        "stats": service.get_stats(),
    }
