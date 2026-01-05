"""
LYNX/Interactive Brokers Trading API

FastAPI service for trading ETFs via LYNX/Interactive Brokers.
Requires the IB Client Portal Gateway to be running on localhost:5000.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys

from config import get_settings
from routers import etfs_router, quotes_router, orders_router, positions_router, account_router
from services.ib_client import get_ib_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Disable SSL warnings for IB Gateway self-signed cert
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Trading API...")
    settings = get_settings()
    logger.info(f"IB Gateway URL: {settings.ib_gateway_url}")

    # Check IB Gateway connection
    ib_client = get_ib_client()
    status = await ib_client.check_auth_status()
    if status.get("authenticated"):
        logger.info("Connected to IB Gateway")
    else:
        logger.warning(f"IB Gateway not connected: {status.get('message')}")

    yield

    # Shutdown
    logger.info("Shutting down Trading API...")
    await ib_client.close()


# Create FastAPI app
app = FastAPI(
    title="LYNX Trading API",
    description="API for trading ETFs via LYNX/Interactive Brokers",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(etfs_router)
app.include_router(quotes_router)
app.include_router(orders_router)
app.include_router(positions_router)
app.include_router(account_router)


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": "LYNX Trading API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    ib_client = get_ib_client()
    status = await ib_client.check_auth_status()

    return {
        "status": "healthy",
        "ib_gateway": {
            "authenticated": status.get("authenticated", False),
            "connected": status.get("connected", False),
            "message": status.get("message", "")
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
