"""Market data quotes endpoints."""
from fastapi import APIRouter, Depends, Request, Query
from models.schemas import QuotesResponse, ETFQuote, UserContext
from middleware.auth import require_trading_approved, get_client_ip
from services.ib_client import get_ib_client
from services.audit import get_audit_service
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/trading", tags=["Quotes"])


@router.get("/quotes", response_model=QuotesResponse)
async def get_quotes(
    request: Request,
    conids: Optional[str] = Query(None, description="Comma-separated contract IDs. If not provided, returns quotes for all MVP ETFs."),
    user: UserContext = Depends(require_trading_approved)
) -> QuotesResponse:
    """
    Get market data quotes (bid/ask/last) for ETFs.

    Note: The first request starts the data stream. Subsequent requests
    will return actual market data.
    """
    ib_client = get_ib_client()
    audit = get_audit_service()

    # If no conids provided, use MVP ETFs
    if conids:
        conid_list = [int(c.strip()) for c in conids.split(",")]
    else:
        etfs = ib_client.get_mvp_etfs()
        conid_list = [etf["conid"] for etf in etfs]

    # Log quote request
    symbols = [str(c) for c in conid_list]
    await audit.log_quote_request(
        customer_id=user.customer_id,
        symbols=symbols,
        ip_address=get_client_ip(request)
    )

    # Get market data from IB Gateway
    raw_quotes = await ib_client.get_market_data_snapshot(conid_list)

    # Parse quotes into standardized format
    quotes = []
    for raw in raw_quotes:
        parsed = ib_client.parse_quote(raw)
        quotes.append(ETFQuote(
            symbol=parsed.get("symbol") or "SPY",
            conid=parsed.get("conid") or conid_list[0],
            last_price=parsed.get("last_price"),
            bid=parsed.get("bid"),
            ask=parsed.get("ask"),
            bid_size=parsed.get("bid_size"),
            ask_size=parsed.get("ask_size"),
            volume=parsed.get("volume")
        ))

    # If no quotes returned (first request), return empty quotes with conids
    if not quotes:
        etfs = ib_client.get_mvp_etfs()
        etf_map = {etf["conid"]: etf for etf in etfs}
        for conid in conid_list:
            etf = etf_map.get(conid, {})
            quotes.append(ETFQuote(
                symbol=etf.get("symbol", ""),
                conid=conid,
                last_price=None,
                bid=None,
                ask=None
            ))

    return QuotesResponse(
        quotes=quotes,
        timestamp=datetime.utcnow().isoformat()
    )
