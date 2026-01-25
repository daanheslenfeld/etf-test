"""
Notifications Router

Handles notification operations:
- List user notifications
- Mark notifications as read
- Get unread count for badge
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
import json
import os
import uuid


router = APIRouter(prefix="/notifications", tags=["notifications"])

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
NOTIFICATIONS_FILE = os.path.join(DATA_DIR, "notifications.json")


# ============================================
# Enums
# ============================================

class NotificationType(str, Enum):
    PORTFOLIO_UPDATED = "portfolio_updated"
    PORTFOLIO_FOLLOWED = "portfolio_followed"
    COMPETITION_STARTED = "competition_started"
    COMPETITION_ENDED = "competition_ended"
    BADGE_EARNED = "badge_earned"
    NEW_FOLLOWER = "new_follower"


# ============================================
# Models
# ============================================

class Notification(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[dict] = None  # Additional data like portfolio_id
    read: bool = False
    created_at: str


class NotificationResponse(BaseModel):
    notifications: List[Notification]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class MarkReadResponse(BaseModel):
    success: bool
    message: str


# ============================================
# Data Operations
# ============================================

def load_notifications() -> dict:
    """Load notifications from JSON file."""
    if os.path.exists(NOTIFICATIONS_FILE):
        try:
            with open(NOTIFICATIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"notifications": []}


def save_notifications(data: dict):
    """Save notifications to JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(NOTIFICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def create_notification(
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    data: Optional[dict] = None
) -> Notification:
    """Create and save a new notification."""
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        data=data,
        read=False,
        created_at=datetime.utcnow().isoformat()
    )

    notifications_data = load_notifications()
    notifications_data["notifications"].append(notification.dict())
    save_notifications(notifications_data)

    return notification


# ============================================
# API Endpoints
# ============================================

@router.get("/", response_model=NotificationResponse)
async def get_notifications(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, ge=1, le=100, description="Max notifications to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    unread_only: bool = Query(False, description="Only return unread notifications")
):
    """
    Get notifications for a user.

    Returns notifications sorted by creation date (newest first).
    """
    data = load_notifications()
    all_notifications = data.get("notifications", [])

    # Filter by user_id
    user_notifications = [n for n in all_notifications if n.get("user_id") == user_id]

    # Filter unread only if requested
    if unread_only:
        user_notifications = [n for n in user_notifications if not n.get("read", False)]

    # Sort by created_at descending
    user_notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Count unread
    unread_count = sum(1 for n in user_notifications if not n.get("read", False))

    # Apply pagination
    total = len(user_notifications)
    paginated = user_notifications[offset:offset + limit]

    return NotificationResponse(
        notifications=[Notification(**n) for n in paginated],
        total=total,
        unread_count=unread_count
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    user_id: str = Query(..., description="User ID")
):
    """
    Get the count of unread notifications for badge display.
    """
    data = load_notifications()
    all_notifications = data.get("notifications", [])

    unread_count = sum(
        1 for n in all_notifications
        if n.get("user_id") == user_id and not n.get("read", False)
    )

    return UnreadCountResponse(unread_count=unread_count)


@router.post("/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: str,
    user_id: str = Query(..., description="User ID for verification")
):
    """
    Mark a notification as read.
    """
    data = load_notifications()
    notifications = data.get("notifications", [])

    for notification in notifications:
        if notification.get("id") == notification_id:
            # Verify ownership
            if notification.get("user_id") != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to modify this notification"
                )

            notification["read"] = True
            save_notifications(data)

            return MarkReadResponse(
                success=True,
                message="Notification marked as read"
            )

    raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/mark-all-read", response_model=MarkReadResponse)
async def mark_all_read(
    user_id: str = Query(..., description="User ID")
):
    """
    Mark all notifications as read for a user.
    """
    data = load_notifications()
    notifications = data.get("notifications", [])

    count = 0
    for notification in notifications:
        if notification.get("user_id") == user_id and not notification.get("read", False):
            notification["read"] = True
            count += 1

    if count > 0:
        save_notifications(data)

    return MarkReadResponse(
        success=True,
        message=f"Marked {count} notifications as read"
    )


@router.delete("/{notification_id}", response_model=MarkReadResponse)
async def delete_notification(
    notification_id: str,
    user_id: str = Query(..., description="User ID for verification")
):
    """
    Delete a notification.
    """
    data = load_notifications()
    notifications = data.get("notifications", [])

    for i, notification in enumerate(notifications):
        if notification.get("id") == notification_id:
            # Verify ownership
            if notification.get("user_id") != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to delete this notification"
                )

            notifications.pop(i)
            save_notifications(data)

            return MarkReadResponse(
                success=True,
                message="Notification deleted"
            )

    raise HTTPException(status_code=404, detail="Notification not found")


# ============================================
# Helper for creating notifications from other routers
# ============================================

def notify_portfolio_followers(portfolio_id: str, portfolio_name: str, change_message: str):
    """
    Create notifications for all followers of a portfolio when it's updated.

    Called from portfolios.py when a portfolio is modified.
    """
    from .portfolios import load_portfolios as load_portfolio_data

    # Load follows
    follows_file = os.path.join(DATA_DIR, "portfolio_follows.json")
    if not os.path.exists(follows_file):
        return

    try:
        with open(follows_file, "r", encoding="utf-8") as f:
            follows_data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return

    # Find all followers of this portfolio
    follows = follows_data.get("follows", [])
    follower_ids = [
        f["follower_user_id"]
        for f in follows
        if f.get("portfolio_id") == portfolio_id
    ]

    # Create notification for each follower
    for user_id in follower_ids:
        create_notification(
            user_id=user_id,
            notification_type=NotificationType.PORTFOLIO_UPDATED,
            title=f"Portfolio bijgewerkt",
            message=f"{portfolio_name}: {change_message}",
            data={
                "portfolio_id": portfolio_id,
                "portfolio_name": portfolio_name
            }
        )


def notify_new_follower(portfolio_creator_id: str, follower_name: str, portfolio_name: str, portfolio_id: str):
    """
    Notify a portfolio creator when they get a new follower.
    """
    create_notification(
        user_id=portfolio_creator_id,
        notification_type=NotificationType.NEW_FOLLOWER,
        title="Nieuwe volger",
        message=f"{follower_name} volgt nu je portfolio '{portfolio_name}'",
        data={
            "portfolio_id": portfolio_id,
            "follower_name": follower_name
        }
    )
