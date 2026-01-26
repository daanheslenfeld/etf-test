"""Broker link management endpoints for user settings."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from models.schemas import UserContext, BrokerLinkStatus
from middleware.auth import get_current_user
from services.supabase_service import get_supabase_service, SupabaseServiceError
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/broker", tags=["Broker"])


class BrokerLinkStatusResponse(BaseModel):
    """Response for broker link status."""
    linked: bool
    status: str  # unlinked, linked, disabled
    ib_account_id: Optional[str] = None
    broker: str = "LYNX"
    message: Optional[str] = None


class LinkBrokerRequest(BaseModel):
    """Request to link a broker account."""
    ib_account_id: str = Field(..., min_length=3, max_length=20)

    @field_validator('ib_account_id')
    @classmethod
    def validate_ib_account_id(cls, v: str) -> str:
        """Validate IB account ID format: DU followed by digits."""
        v = v.strip().upper()
        if not re.match(r'^DU[0-9]+$', v):
            raise ValueError('IB account ID must match format DUxxxxxx (DU followed by numbers)')
        return v


class LinkBrokerResponse(BaseModel):
    """Response for link broker operation."""
    success: bool
    message: str
    ib_account_id: Optional[str] = None
    status: Optional[str] = None


@router.get("/link", response_model=BrokerLinkStatusResponse)
async def get_broker_link(
    user: UserContext = Depends(get_current_user)
) -> BrokerLinkStatusResponse:
    """
    Get the current user's broker link status.

    Returns whether the user has linked a LYNX account and the account ID if linked.
    """
    db = get_supabase_service()

    if not db.is_configured():
        logger.warning("Supabase not configured")
        return BrokerLinkStatusResponse(
            linked=False,
            status="unlinked",
            message="Database not configured"
        )

    try:
        broker_link = await db.get_broker_link(user.customer_id, "LYNX")

        if not broker_link:
            return BrokerLinkStatusResponse(
                linked=False,
                status="unlinked",
                message="No broker account linked. Add your LYNX account ID to start trading."
            )

        status = broker_link.get("status", "unlinked")
        ib_account_id = broker_link.get("ib_account_id")
        is_linked = status == "linked" and ib_account_id is not None

        return BrokerLinkStatusResponse(
            linked=is_linked,
            status=status,
            ib_account_id=ib_account_id,
            broker="LYNX",
            message="Broker account linked successfully" if is_linked else f"Status: {status}"
        )

    except Exception as e:
        logger.error(f"Error getting broker link: {e}")
        return BrokerLinkStatusResponse(
            linked=False,
            status="unlinked",
            message=f"Error retrieving broker link: {str(e)}"
        )


@router.post("/link", response_model=LinkBrokerResponse)
async def link_broker(
    request: LinkBrokerRequest,
    user: UserContext = Depends(get_current_user)
) -> LinkBrokerResponse:
    """
    Link a LYNX broker account to the current user.

    The ib_account_id must be in format DUxxxxxx (demo account).
    Only one broker link per user is allowed.
    """
    db = get_supabase_service()

    if not db.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Cannot save broker link."
        )

    ib_account_id = request.ib_account_id

    logger.info(f"User {user.customer_id} ({user.email}) linking broker account: {ib_account_id}")

    try:
        # Use upsert to create or update
        result = await db.upsert_broker_link(
            user_id=user.customer_id,
            ib_account_id=ib_account_id,
            broker="LYNX",
            status="linked"
        )

        if result:
            logger.info(f"Successfully linked broker account {ib_account_id} for user {user.customer_id}")
            return LinkBrokerResponse(
                success=True,
                message=f"LYNX account {ib_account_id} linked successfully",
                ib_account_id=ib_account_id,
                status="linked"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to save broker link to database"
            )

    except SupabaseServiceError as e:
        logger.error(f"Database error linking broker: {e.message}")
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=f"Database error: {e.message}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking broker: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to link broker account: {str(e)}"
        )


@router.delete("/link", response_model=LinkBrokerResponse)
async def unlink_broker(
    user: UserContext = Depends(get_current_user)
) -> LinkBrokerResponse:
    """
    Unlink the current user's LYNX broker account.

    Sets the broker link status to 'unlinked' and clears the account ID.
    """
    db = get_supabase_service()

    if not db.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Database not configured"
        )

    logger.info(f"User {user.customer_id} ({user.email}) unlinking broker account")

    try:
        # Check if user has a broker link
        existing = await db.get_broker_link(user.customer_id, "LYNX")

        if not existing:
            return LinkBrokerResponse(
                success=True,
                message="No broker account was linked",
                status="unlinked"
            )

        # Unlink the broker
        success = await db.unlink_broker(user.customer_id, "LYNX")

        if success:
            logger.info(f"Successfully unlinked broker account for user {user.customer_id}")
            return LinkBrokerResponse(
                success=True,
                message="LYNX account disconnected successfully",
                status="unlinked"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to unlink broker account"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unlinking broker: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to unlink broker account: {str(e)}"
        )
