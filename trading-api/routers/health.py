"""Health and status endpoints for frontend integration."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from config import get_settings, TradingMode
from services.ib_client import get_ib_client, ConnectionState

router = APIRouter(tags=["Health"])


class IBGatewayStatus(BaseModel):
    """IB Gateway connection status."""
    state: str
    connected: bool
    ready_for_orders: bool
    account: Optional[str]
    last_connected: Optional[str]
    last_error: Optional[str]
    reconnect_attempts: int
    auto_reconnect_enabled: bool


class TradingModeInfo(BaseModel):
    """Trading mode configuration."""
    mode: str
    is_paper: bool
    is_live: bool
    live_enabled: bool
    port: int
    expected_port: int
    port_matches_mode: bool


class HealthResponse(BaseModel):
    """Comprehensive health response for frontend."""
    status: str  # "healthy", "degraded", "unhealthy"
    can_trade: bool
    trading_mode: TradingModeInfo
    ib_gateway: IBGatewayStatus
    timestamp: str


class ReadinessResponse(BaseModel):
    """Simple readiness response."""
    ready: bool
    reason: Optional[str] = None


@router.get("/status", response_model=HealthResponse)
async def get_full_status():
    """
    Get comprehensive system status for frontend display.

    This endpoint provides all information needed to show
    connection status and trading readiness in the UI.
    """
    settings = get_settings()
    ib_client = get_ib_client()
    conn_status = ib_client.get_status()

    # Determine overall health
    if conn_status.ready_for_orders:
        status = "healthy"
    elif conn_status.connected:
        status = "degraded"  # Connected but not ready
    elif conn_status.state == ConnectionState.RECONNECTING:
        status = "degraded"  # Actively reconnecting
    else:
        status = "unhealthy"

    # Can trade = ready for orders + live trading enabled (if in live mode)
    can_trade = conn_status.ready_for_orders
    if settings.trading_mode == TradingMode.LIVE and not settings.is_live_trading_enabled():
        can_trade = False

    port_ok, _ = settings.validate_port_matches_mode()

    return HealthResponse(
        status=status,
        can_trade=can_trade,
        trading_mode=TradingModeInfo(
            mode=settings.trading_mode.value,
            is_paper=settings.trading_mode == TradingMode.PAPER,
            is_live=settings.trading_mode == TradingMode.LIVE,
            live_enabled=settings.is_live_trading_enabled(),
            port=settings.ib_gateway_port,
            expected_port=settings.get_expected_port(),
            port_matches_mode=port_ok,
        ),
        ib_gateway=IBGatewayStatus(
            state=conn_status.state.value,
            connected=conn_status.connected,
            ready_for_orders=conn_status.ready_for_orders,
            account=conn_status.account,
            last_connected=conn_status.last_connected.isoformat() if conn_status.last_connected else None,
            last_error=conn_status.last_error,
            reconnect_attempts=conn_status.reconnect_attempts,
            auto_reconnect_enabled=settings.ib_reconnect_enabled,
        ),
        timestamp=datetime.now().isoformat(),
    )


@router.get("/status/simple")
async def get_simple_status():
    """
    Simple status check for quick frontend polling.

    Returns minimal data for efficient polling.
    """
    ib_client = get_ib_client()
    settings = get_settings()

    connected = ib_client.is_connected()
    ready = ib_client.is_ready_for_orders()

    can_trade = ready
    if settings.trading_mode == TradingMode.LIVE and not settings.is_live_trading_enabled():
        can_trade = False

    return {
        "connected": connected,
        "ready": ready,
        "can_trade": can_trade,
        "account": ib_client.get_primary_account(),
        "mode": settings.trading_mode.value,
    }


@router.get("/ready", response_model=ReadinessResponse)
async def check_readiness():
    """
    Check if system is ready for trading.

    Use this before showing trading UI or enabling order buttons.
    """
    ib_client = get_ib_client()
    settings = get_settings()

    if not ib_client.is_connected():
        status = ib_client.get_status()
        return ReadinessResponse(
            ready=False,
            reason=status.last_error or "Not connected to IB Gateway"
        )

    if not ib_client.is_ready_for_orders():
        return ReadinessResponse(
            ready=False,
            reason="Connected but not ready for orders (waiting for nextValidId)"
        )

    if settings.trading_mode == TradingMode.LIVE and not settings.is_live_trading_enabled():
        return ReadinessResponse(
            ready=False,
            reason="Live trading mode requires LIVE_TRADING_CONFIRMATION"
        )

    return ReadinessResponse(ready=True)


@router.post("/reconnect")
async def trigger_reconnect():
    """
    Manually trigger reconnection to IB Gateway.

    Use this when auto-reconnect has failed or user wants to force reconnect.
    """
    from services.ib_client import reconnect_ib_client

    success = await reconnect_ib_client()
    ib_client = get_ib_client()
    status = ib_client.get_status()

    return {
        "success": success,
        "connected": status.connected,
        "ready_for_orders": status.ready_for_orders,
        "account": status.account,
        "error": status.last_error if not success else None,
    }
