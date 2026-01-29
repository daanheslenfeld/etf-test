"""Order Intentions endpoints for batch trading system.

User-facing endpoints to submit, view, and cancel order intentions.
All endpoints are isolated per user via authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from middleware.auth import get_current_user
from models.schemas import UserContext
from services.order_intention_service import get_order_intention_service, OrderIntentionError
from services.virtual_portfolio_service import get_virtual_portfolio_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/intentions", tags=["Order Intentions"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class CreateIntentionRequest(BaseModel):
    """Request to create an order intention."""
    symbol: str = Field(..., description="ETF symbol (e.g., IWDA)")
    conid: int = Field(..., description="IB contract ID")
    side: str = Field(..., description="BUY or SELL")
    quantity: int = Field(..., gt=0, description="Number of shares")
    order_type: str = Field("MKT", description="MKT or LMT")
    limit_price: Optional[float] = Field(None, description="Limit price (required for LMT)")
    estimated_price: Optional[float] = Field(None, description="Current market price estimate")
    isin: Optional[str] = Field(None, description="ISIN code")
    name: Optional[str] = Field(None, description="ETF name")


class IntentionResponse(BaseModel):
    """Order intention response."""
    id: str
    user_id: int
    symbol: str
    conid: int
    isin: Optional[str] = None
    name: Optional[str] = None
    side: str
    quantity: int
    order_type: str
    limit_price: Optional[float] = None
    estimated_price: Optional[float] = None
    estimated_value: Optional[float] = None
    reserved_amount: Optional[float] = None
    status: str
    status_message: Optional[str] = None
    filled_quantity: Optional[float] = None
    fill_price: Optional[float] = None
    fill_value: Optional[float] = None
    submitted_at: str
    cancelled_at: Optional[str] = None
    executed_at: Optional[str] = None


class IntentionListResponse(BaseModel):
    """List of intentions response."""
    intentions: List[IntentionResponse]
    total: int
    pending_count: int


class CreateIntentionResponse(BaseModel):
    """Response after creating an intention."""
    success: bool
    intention: Optional[IntentionResponse] = None
    message: Optional[str] = None
    next_batch_info: Optional[dict] = None


class CancelIntentionResponse(BaseModel):
    """Response after cancelling an intention."""
    success: bool
    message: str
    released_amount: Optional[float] = None


class PendingSummaryResponse(BaseModel):
    """Summary of pending orders for admin."""
    total_users: int
    total_intentions: int
    by_symbol: List[dict]
    estimated_total_value: float
    next_batch_at: Optional[str] = None


# =============================================================================
# USER ENDPOINTS
# =============================================================================

@router.post("", response_model=CreateIntentionResponse)
async def create_intention(
    request: CreateIntentionRequest,
    user: UserContext = Depends(get_current_user)
) -> CreateIntentionResponse:
    """
    Submit an order intention for the next batch.

    BUY orders reserve cash immediately.
    SELL orders validate share availability.

    Orders will be executed in the next batch run (typically 2:00 PM CET).
    """
    service = get_order_intention_service()

    try:
        intention = await service.create_intention(
            user_id=user.customer_id,
            symbol=request.symbol.upper(),
            conid=request.conid,
            side=request.side.upper(),
            quantity=request.quantity,
            order_type=request.order_type.upper(),
            limit_price=Decimal(str(request.limit_price)) if request.limit_price else None,
            estimated_price=Decimal(str(request.estimated_price)) if request.estimated_price else None,
            isin=request.isin,
            name=request.name
        )

        return CreateIntentionResponse(
            success=True,
            intention=IntentionResponse(
                id=intention["id"],
                user_id=intention["user_id"],
                symbol=intention["symbol"],
                conid=intention["conid"],
                isin=intention.get("isin"),
                name=intention.get("name"),
                side=intention["side"],
                quantity=intention["quantity"],
                order_type=intention["order_type"],
                limit_price=intention.get("limit_price"),
                estimated_price=intention.get("estimated_price"),
                estimated_value=intention.get("estimated_value"),
                reserved_amount=intention.get("reserved_amount"),
                status=intention["status"],
                status_message=intention.get("status_message"),
                submitted_at=intention["submitted_at"]
            ),
            message=f"Order intention submitted. Will be executed in next batch.",
            next_batch_info={
                "next_batch_at": "14:00 CET",  # TODO: Get from scheduler
                "can_cancel_until": "13:55 CET"
            }
        )

    except OrderIntentionError as e:
        logger.warning(f"Order intention rejected for user {user.customer_id}: {e.message}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": e.message,
                "code": e.code,
                "details": e.details
            }
        )


@router.get("", response_model=IntentionListResponse)
async def get_intentions(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: UserContext = Depends(get_current_user)
) -> IntentionListResponse:
    """
    Get current user's order intentions.

    Returns list of all intentions, optionally filtered by status.
    """
    service = get_order_intention_service()

    intentions = await service.get_user_intentions(
        user_id=user.customer_id,
        status=status,
        limit=limit,
        offset=offset
    )

    # Count pending separately
    pending_count = sum(1 for i in intentions if i["status"] == "pending")

    return IntentionListResponse(
        intentions=[
            IntentionResponse(
                id=i["id"],
                user_id=i["user_id"],
                symbol=i["symbol"],
                conid=i["conid"],
                isin=i.get("isin"),
                name=i.get("name"),
                side=i["side"],
                quantity=i["quantity"],
                order_type=i["order_type"],
                limit_price=i.get("limit_price"),
                estimated_price=i.get("estimated_price"),
                estimated_value=i.get("estimated_value"),
                reserved_amount=i.get("reserved_amount"),
                status=i["status"],
                status_message=i.get("status_message"),
                filled_quantity=i.get("filled_quantity"),
                fill_price=i.get("fill_price"),
                fill_value=i.get("fill_value"),
                submitted_at=i["submitted_at"],
                cancelled_at=i.get("cancelled_at"),
                executed_at=i.get("executed_at")
            )
            for i in intentions
        ],
        total=len(intentions),
        pending_count=pending_count
    )


@router.get("/pending", response_model=IntentionListResponse)
async def get_pending_intentions(
    user: UserContext = Depends(get_current_user)
) -> IntentionListResponse:
    """
    Get current user's pending order intentions.

    Convenience endpoint for getting only pending orders.
    """
    return await get_intentions(status="pending", limit=100, offset=0, user=user)


@router.get("/{intention_id}", response_model=IntentionResponse)
async def get_intention(
    intention_id: str,
    user: UserContext = Depends(get_current_user)
) -> IntentionResponse:
    """
    Get details of a specific order intention.
    """
    service = get_order_intention_service()

    intention = await service.get_intention(user.customer_id, intention_id)

    if not intention:
        raise HTTPException(
            status_code=404,
            detail="Order intention not found"
        )

    return IntentionResponse(
        id=intention["id"],
        user_id=intention["user_id"],
        symbol=intention["symbol"],
        conid=intention["conid"],
        isin=intention.get("isin"),
        name=intention.get("name"),
        side=intention["side"],
        quantity=intention["quantity"],
        order_type=intention["order_type"],
        limit_price=intention.get("limit_price"),
        estimated_price=intention.get("estimated_price"),
        estimated_value=intention.get("estimated_value"),
        reserved_amount=intention.get("reserved_amount"),
        status=intention["status"],
        status_message=intention.get("status_message"),
        filled_quantity=intention.get("filled_quantity"),
        fill_price=intention.get("fill_price"),
        fill_value=intention.get("fill_value"),
        submitted_at=intention["submitted_at"],
        cancelled_at=intention.get("cancelled_at"),
        executed_at=intention.get("executed_at")
    )


@router.delete("/{intention_id}", response_model=CancelIntentionResponse)
async def cancel_intention(
    intention_id: str,
    user: UserContext = Depends(get_current_user)
) -> CancelIntentionResponse:
    """
    Cancel a pending order intention.

    Only pending orders can be cancelled.
    BUY orders will have their reserved cash released.
    """
    service = get_order_intention_service()

    try:
        # Get intention first to get reserved amount
        intention = await service.get_intention(user.customer_id, intention_id)
        released_amount = None

        if intention and intention["side"] == "BUY":
            released_amount = intention.get("reserved_amount")

        success = await service.cancel_intention(user.customer_id, intention_id)

        if success:
            return CancelIntentionResponse(
                success=True,
                message="Order cancelled successfully",
                released_amount=released_amount
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to cancel order")

    except OrderIntentionError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "message": e.message,
                "code": e.code,
                "details": e.details
            }
        )


# =============================================================================
# BATCH INFO ENDPOINT (for users to see next batch timing)
# =============================================================================

@router.get("/info/next-batch")
async def get_next_batch_info(
    user: UserContext = Depends(get_current_user)
) -> dict:
    """
    Get information about the next batch execution.

    Returns when the next batch will run and cutoff time for cancellations.
    """
    # TODO: Get actual next batch time from scheduler
    from datetime import datetime, time, timezone

    now = datetime.now(timezone.utc)
    batch_time = time(13, 0)  # 14:00 CET = 13:00 UTC

    # Calculate next batch
    today_batch = datetime.combine(now.date(), batch_time, tzinfo=timezone.utc)

    if now.time() > batch_time:
        # Already past today's batch, next is tomorrow
        from datetime import timedelta
        next_batch = today_batch + timedelta(days=1)
    else:
        next_batch = today_batch

    return {
        "next_batch_at": next_batch.isoformat(),
        "next_batch_local": "14:00 CET",
        "cancellation_cutoff": "13:55 CET",
        "orders_locked": False,  # TODO: Check if within 5 min of batch
        "timezone": "Europe/Amsterdam"
    }


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@router.get("/admin/pending-summary", response_model=PendingSummaryResponse)
async def get_pending_summary(
    user: UserContext = Depends(get_current_user)
) -> PendingSummaryResponse:
    """
    Get summary of all pending orders for next batch.

    ADMIN ONLY - Requires trading owner permission.
    """
    from config import get_settings
    settings = get_settings()

    # Only trading owner can see all pending orders
    if not settings.is_trading_owner(user.email):
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    service = get_order_intention_service()
    summary = await service.get_pending_summary()

    return PendingSummaryResponse(
        total_users=summary["total_users"],
        total_intentions=summary["total_intentions"],
        by_symbol=summary["by_symbol"],
        estimated_total_value=summary["estimated_total_value"],
        next_batch_at="14:00 CET"  # TODO: Get from scheduler
    )
