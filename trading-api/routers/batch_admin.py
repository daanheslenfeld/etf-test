"""Batch Admin endpoints for batch trading system.

Admin-only endpoints to manage and execute batch orders.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from middleware.auth import get_current_user
from models.schemas import UserContext
from services.batch_execution_service import get_batch_execution_service, BatchExecutionError
from services.order_intention_service import get_order_intention_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/batch", tags=["Batch Admin"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class BatchResponse(BaseModel):
    """Batch execution response."""
    id: str
    scheduled_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    total_intentions: Optional[int] = None
    total_aggregated_orders: Optional[int] = None
    total_users: Optional[int] = None
    total_value: Optional[float] = None
    successful_fills: Optional[int] = None
    partial_fills: Optional[int] = None
    failed_orders: Optional[int] = None
    created_at: str


class ExecuteBatchResponse(BaseModel):
    """Response after executing a batch."""
    success: bool
    batch_id: str
    status: str
    orders_executed: int
    successful: int
    partial: int
    failed: int
    message: str


class PendingSummaryResponse(BaseModel):
    """Summary of pending orders."""
    total_users: int
    total_intentions: int
    by_symbol: List[dict]
    estimated_total_value: float
    next_batch_at: Optional[str] = None


class BatchHistoryResponse(BaseModel):
    """Batch history response."""
    batches: List[BatchResponse]
    total: int


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def require_admin(user: UserContext = Depends(get_current_user)) -> UserContext:
    """Dependency to require admin (trading owner) access."""
    from config import get_settings
    settings = get_settings()

    if not settings.is_trading_owner(user.email):
        raise HTTPException(
            status_code=403,
            detail="Admin access required for batch operations."
        )
    return user


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@router.post("/execute", response_model=ExecuteBatchResponse)
async def execute_batch(
    user: UserContext = Depends(require_admin)
) -> ExecuteBatchResponse:
    """
    Manually trigger batch execution.

    ADMIN ONLY.

    This will:
    1. Aggregate all pending order intentions
    2. Execute aggregated orders via IB Gateway
    3. Allocate fills to individual users
    4. Update virtual portfolios

    Returns execution summary.
    """
    service = get_batch_execution_service()

    try:
        # Create new batch
        batch = await service.create_batch()
        batch_id = batch["id"]

        logger.info(f"Admin {user.email} triggered batch execution {batch_id}")

        # Execute the batch
        result = await service.execute_batch(batch_id)

        return ExecuteBatchResponse(
            success=result["status"] in ("completed", "partial"),
            batch_id=batch_id,
            status=result["status"],
            orders_executed=result.get("orders_executed", 0),
            successful=result.get("successful", 0),
            partial=result.get("partial", 0),
            failed=result.get("failed", 0),
            message=f"Batch {batch_id} completed with status: {result['status']}"
        )

    except BatchExecutionError as e:
        logger.error(f"Batch execution failed: {e.message}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": e.message,
                "code": e.code,
                "details": e.details
            }
        )


@router.get("/status", response_model=BatchResponse)
async def get_batch_status(
    user: UserContext = Depends(require_admin)
) -> BatchResponse:
    """
    Get status of the most recent batch execution.

    ADMIN ONLY.
    """
    service = get_batch_execution_service()

    batch = await service.get_last_batch()

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="No batch executions found."
        )

    return BatchResponse(
        id=batch["id"],
        scheduled_at=batch["scheduled_at"],
        started_at=batch.get("started_at"),
        completed_at=batch.get("completed_at"),
        status=batch["status"],
        error_message=batch.get("error_message"),
        total_intentions=batch.get("total_intentions"),
        total_aggregated_orders=batch.get("total_aggregated_orders"),
        total_users=batch.get("total_users"),
        total_value=batch.get("total_value"),
        successful_fills=batch.get("successful_fills"),
        partial_fills=batch.get("partial_fills"),
        failed_orders=batch.get("failed_orders"),
        created_at=batch["created_at"]
    )


@router.get("/status/{batch_id}", response_model=BatchResponse)
async def get_specific_batch_status(
    batch_id: str,
    user: UserContext = Depends(require_admin)
) -> BatchResponse:
    """
    Get status of a specific batch execution.

    ADMIN ONLY.
    """
    service = get_batch_execution_service()

    batch = await service.get_batch(batch_id)

    if not batch:
        raise HTTPException(
            status_code=404,
            detail=f"Batch {batch_id} not found."
        )

    return BatchResponse(
        id=batch["id"],
        scheduled_at=batch["scheduled_at"],
        started_at=batch.get("started_at"),
        completed_at=batch.get("completed_at"),
        status=batch["status"],
        error_message=batch.get("error_message"),
        total_intentions=batch.get("total_intentions"),
        total_aggregated_orders=batch.get("total_aggregated_orders"),
        total_users=batch.get("total_users"),
        total_value=batch.get("total_value"),
        successful_fills=batch.get("successful_fills"),
        partial_fills=batch.get("partial_fills"),
        failed_orders=batch.get("failed_orders"),
        created_at=batch["created_at"]
    )


@router.get("/pending-summary", response_model=PendingSummaryResponse)
async def get_pending_summary(
    user: UserContext = Depends(require_admin)
) -> PendingSummaryResponse:
    """
    Get summary of pending orders for next batch.

    ADMIN ONLY.

    Shows:
    - Total number of users with pending orders
    - Total number of order intentions
    - Breakdown by symbol (buy/sell quantities)
    - Estimated total value
    """
    intention_service = get_order_intention_service()
    summary = await intention_service.get_pending_summary()

    return PendingSummaryResponse(
        total_users=summary["total_users"],
        total_intentions=summary["total_intentions"],
        by_symbol=summary["by_symbol"],
        estimated_total_value=summary["estimated_total_value"],
        next_batch_at="14:00 CET"  # TODO: Get from scheduler
    )


@router.get("/history", response_model=BatchHistoryResponse)
async def get_batch_history(
    limit: int = 10,
    user: UserContext = Depends(require_admin)
) -> BatchHistoryResponse:
    """
    Get history of batch executions.

    ADMIN ONLY.
    """
    service = get_batch_execution_service()
    batches = await service.get_batch_history(limit=limit)

    return BatchHistoryResponse(
        batches=[
            BatchResponse(
                id=b["id"],
                scheduled_at=b["scheduled_at"],
                started_at=b.get("started_at"),
                completed_at=b.get("completed_at"),
                status=b["status"],
                error_message=b.get("error_message"),
                total_intentions=b.get("total_intentions"),
                total_aggregated_orders=b.get("total_aggregated_orders"),
                total_users=b.get("total_users"),
                total_value=b.get("total_value"),
                successful_fills=b.get("successful_fills"),
                partial_fills=b.get("partial_fills"),
                failed_orders=b.get("failed_orders"),
                created_at=b["created_at"]
            )
            for b in batches
        ],
        total=len(batches)
    )


@router.post("/dry-run")
async def dry_run_batch(
    user: UserContext = Depends(require_admin)
) -> dict:
    """
    Simulate batch execution without actually placing orders.

    ADMIN ONLY.

    Returns what would happen if the batch was executed now.
    """
    intention_service = get_order_intention_service()
    pending = await intention_service.get_pending_intentions()

    if not pending:
        return {
            "status": "no_orders",
            "message": "No pending orders to execute.",
            "intentions": 0,
            "aggregated_orders": []
        }

    # Simulate aggregation
    from collections import defaultdict
    groups = defaultdict(list)
    user_ids = set()

    for intention in pending:
        key = (intention["symbol"], intention["conid"], intention["side"])
        groups[key].append(intention)
        user_ids.add(intention["user_id"])

    aggregated = [
        {
            "symbol": symbol,
            "conid": conid,
            "side": side,
            "total_quantity": sum(i["quantity"] for i in intentions),
            "num_users": len(set(i["user_id"] for i in intentions)),
            "estimated_value": sum(i.get("estimated_value", 0) or 0 for i in intentions)
        }
        for (symbol, conid, side), intentions in groups.items()
    ]

    total_value = sum(a["estimated_value"] for a in aggregated)

    return {
        "status": "dry_run_complete",
        "message": f"Would execute {len(aggregated)} aggregated orders from {len(pending)} intentions.",
        "total_users": len(user_ids),
        "total_intentions": len(pending),
        "total_aggregated_orders": len(aggregated),
        "estimated_total_value": total_value,
        "aggregated_orders": aggregated
    }
