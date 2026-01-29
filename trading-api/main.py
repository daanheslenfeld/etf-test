# Load environment variables from .env file FIRST
from dotenv import load_dotenv
load_dotenv()  # Load .env from current directory

# Python 3.10+ / 3.14+ compatibility for ib_insync/eventkit
import asyncio

class _Py310CompatEventLoopPolicy(asyncio.DefaultEventLoopPolicy):
    """Event loop policy that creates loops on demand (pre-3.10 behavior)."""
    def get_event_loop(self):
        try:
            return super().get_event_loop()
        except RuntimeError:
            loop = self.new_event_loop()
            self.set_event_loop(loop)
            return loop

asyncio.set_event_loop_policy(_Py310CompatEventLoopPolicy())

"""
LYNX/Interactive Brokers Trading API - Production Ready

Clean startup/shutdown lifecycle:
1. Startup: Connect to IB Gateway, start auto-reconnect
2. Runtime: Handle requests, auto-reconnect on disconnect
3. Shutdown: Stop reconnect, disconnect cleanly
"""
import logging
import logging.handlers
import sys
import json
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings, TradingMode
from routers import etfs_router, quotes_router, orders_router, positions_router, account_router, health_router, marketdata_router, holdings_router, tradability_router, indices_router
from routers.portfolios import router as portfolios_router
from routers.community import router as community_router
from routers.notifications import router as notifications_router
from routers.competitions import router as competitions_router
from routers.broker import router as broker_router
# Batch trading routers
from routers.virtual_portfolio import router as virtual_portfolio_router
from routers.order_intentions import router as order_intentions_router
from routers.batch_admin import router as batch_admin_router


# =============================================================================
# Structured Logging Setup
# =============================================================================

class JSONFormatter(logging.Formatter):
    """JSON log formatter for production."""
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def setup_logging():
    """Configure logging based on settings."""
    settings = get_settings()

    # Root logger config
    root = logging.getLogger()
    root.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    # Clear existing handlers
    root.handlers.clear()

    # Console handler
    handler = logging.StreamHandler(sys.stdout)

    if settings.log_format == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        ))

    root.addHandler(handler)

    # Reduce noise from libraries
    logging.getLogger("ib_insync").setLevel(logging.WARNING)
    logging.getLogger("eventkit").setLevel(logging.WARNING)

    return logging.getLogger(__name__)


logger = setup_logging()


# =============================================================================
# Application Lifespan
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.

    Startup:
    - Validate settings (port vs trading mode)
    - Connect to IB Gateway
    - Start auto-reconnect

    Shutdown:
    - Stop auto-reconnect
    - Disconnect from IB Gateway
    """
    # Late import to avoid connection at module load
    from services.ib_client import get_ib_client, shutdown_ib_client
    from scheduler import start_scheduler, stop_scheduler

    settings = get_settings()

    # ==========================================================================
    # STARTUP
    # ==========================================================================
    logger.info("=" * 60)
    logger.info("Starting LYNX Trading API")
    logger.info("=" * 60)

    # Log trading mode prominently
    if settings.trading_mode == TradingMode.LIVE:
        if settings.is_live_trading_enabled():
            logger.warning("!!! LIVE TRADING MODE - REAL MONEY !!!")
        else:
            logger.info("LIVE mode configured but NOT ENABLED (missing confirmation)")
    else:
        logger.info(f"PAPER TRADING MODE")

    # Validate port matches trading mode
    port_ok, port_msg = settings.validate_port_matches_mode()
    if not port_ok:
        logger.warning(f"Configuration warning: {port_msg}")

    logger.info(f"IB Gateway: {settings.ib_gateway_host}:{settings.ib_gateway_port}")
    logger.info(f"Client ID: {settings.ib_client_id}")
    logger.info(f"Auto-reconnect: {settings.ib_reconnect_enabled}")

    # Get IB client (does NOT connect yet)
    ib_client = get_ib_client()

    # Connect to IB Gateway
    logger.info("Connecting to IB Gateway...")
    connected = await ib_client.connect()

    if connected:
        logger.info("=" * 60)
        logger.info("SUCCESS: Connected to IB Gateway")
        logger.info(f"Account: {ib_client.get_primary_account()}")
        logger.info("Ready to accept trading requests")
        logger.info("=" * 60)
    else:
        status = ib_client.get_status()
        logger.warning("=" * 60)
        logger.warning("WARNING: Could not connect to IB Gateway")
        logger.warning(f"Error: {status.last_error}")
        logger.warning(f"Ensure IB Gateway is running on {settings.ib_gateway_host}:{settings.ib_gateway_port}")
        logger.warning("=" * 60)

    # Start auto-reconnect (will retry in background if not connected)
    await ib_client.start_auto_reconnect()

    # Start batch trading scheduler (runs at 14:00 CET daily)
    await start_scheduler()
    logger.info("Batch trading scheduler started (14:00 CET daily)")

    yield

    # ==========================================================================
    # SHUTDOWN
    # ==========================================================================
    logger.info("=" * 60)
    logger.info("Shutting down Trading API...")
    await stop_scheduler()
    await shutdown_ib_client()
    logger.info("Trading API shutdown complete")
    logger.info("=" * 60)


# =============================================================================
# FastAPI Application
# =============================================================================

settings = get_settings()

app = FastAPI(
    title="LYNX Trading API",
    description="Production-ready API for trading ETFs via LYNX/Interactive Brokers",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(etfs_router)
app.include_router(quotes_router)
app.include_router(orders_router)
app.include_router(positions_router)
app.include_router(account_router)
app.include_router(health_router)
app.include_router(marketdata_router)
app.include_router(holdings_router)
app.include_router(tradability_router)
app.include_router(indices_router)
app.include_router(portfolios_router)
app.include_router(community_router)
app.include_router(notifications_router)
app.include_router(competitions_router)
app.include_router(broker_router)
# Batch trading routers
app.include_router(virtual_portfolio_router)
app.include_router(order_intentions_router)
app.include_router(batch_admin_router)


# =============================================================================
# Core Endpoints
# =============================================================================

@app.get("/")
async def root():
    """API info."""
    return {
        "name": "LYNX Trading API",
        "version": "2.0.0",
        "trading_mode": settings.trading_mode.value,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check with real connectivity status.

    Returns detailed connection state for frontend display.
    """
    from services.ib_client import get_ib_client

    ib_client = get_ib_client()
    status = ib_client.get_status()

    return {
        "status": "healthy" if status.connected else "degraded",
        "trading_mode": settings.trading_mode.value,
        "live_trading_enabled": settings.is_live_trading_enabled() if settings.trading_mode == TradingMode.LIVE else None,
        "ib_gateway": {
            "state": status.state.value,
            "connected": status.connected,
            "ready_for_orders": status.ready_for_orders,
            "account": status.account,
            "last_connected": status.last_connected.isoformat() if status.last_connected else None,
            "last_error": status.last_error,
            "reconnect_attempts": status.reconnect_attempts,
        }
    }


@app.get("/health/ready")
async def readiness_check():
    """
    Kubernetes readiness probe.

    Returns 200 only if ready to accept trading requests.
    """
    from services.ib_client import get_ib_client
    from fastapi import HTTPException

    ib_client = get_ib_client()

    if not ib_client.is_ready_for_orders():
        raise HTTPException(status_code=503, detail="Not ready for orders")

    return {"ready": True}


@app.get("/health/live")
async def liveness_check():
    """
    Kubernetes liveness probe.

    Returns 200 if the service is running (even if IB is disconnected).
    """
    return {"alive": True}


# =============================================================================
# Run with uvicorn
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.api_port,  # Always 8002
        reload=True
    )
