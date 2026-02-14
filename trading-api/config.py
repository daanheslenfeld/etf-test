"""Configuration settings for the trading API."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from enum import Enum
from typing import Literal


class TradingMode(str, Enum):
    """Trading environment mode."""
    PAPER = "paper"
    LIVE = "live"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str = "https://rfmbhdgfovnglegqxjnj.supabase.co"
    supabase_key: str = ""  # anon key for public access
    supabase_service_role_key: str = ""  # service role key for backend (bypasses RLS)

    # ==========================================================================
    # TRADING MODE - CRITICAL SAFETY SETTING
    # ==========================================================================
    # Set to "live" ONLY when you want to trade with real money.
    # Default is "paper" for safety.
    trading_mode: TradingMode = TradingMode.PAPER

    # Extra confirmation required to enable live trading
    # Must be set to "I_UNDERSTAND_THIS_IS_REAL_MONEY" to allow live mode
    live_trading_confirmation: str = ""

    # ==========================================================================
    # IB Gateway Connection
    # ==========================================================================
    # Port 4001 = IB Gateway paper trading
    # Port 4002 = IB Gateway live trading
    # Port 7497 = TWS paper trading
    # Port 7496 = TWS live trading
    ib_gateway_host: str = "37.97.173.109"
    ib_gateway_port: int = 4001  # Paper trading port
    ib_client_id: int = 2  # Unique client ID for this connection
    ib_connection_timeout: int = 30  # Seconds to wait for connection

    # ==========================================================================
    # Connection Resilience
    # ==========================================================================
    ib_reconnect_enabled: bool = True
    ib_reconnect_delay_initial: float = 1.0  # Initial delay in seconds
    ib_reconnect_delay_max: float = 60.0  # Max delay between retries
    ib_reconnect_delay_multiplier: float = 2.0  # Exponential backoff multiplier
    ib_reconnect_max_attempts: int = 0  # 0 = unlimited retries

    # ==========================================================================
    # CORS
    # ==========================================================================
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://etf-test.vercel.app",
        "https://uncarnivorously-unbrewed-carri.ngrok-free.dev",
    ]

    # ==========================================================================
    # Logging
    # ==========================================================================
    log_level: str = "INFO"
    log_format: Literal["json", "text"] = "text"  # json for production
    log_orders: bool = True  # Log every order with full details

    # ==========================================================================
    # App settings
    # ==========================================================================
    debug: bool = True

    # Local development mode - disables database requirements and owner checks
    local_dev_mode: bool = False

    # API server port - MUST be 8002 to match frontend expectations
    api_port: int = 8002

    class Config:
        env_file = (".env", "../.env")  # Check current dir first, then parent
        env_file_encoding = "utf-8"
        extra = "ignore"

    def is_live_trading_enabled(self) -> bool:
        """Check if live trading is properly enabled with confirmation."""
        if self.trading_mode != TradingMode.LIVE:
            return False
        return self.live_trading_confirmation == "I_UNDERSTAND_THIS_IS_REAL_MONEY"

    def get_expected_port(self) -> int:
        """Get the expected IB Gateway port for current trading mode."""
        if self.trading_mode == TradingMode.LIVE:
            return 4002  # Live trading port
        return 4001  # Paper trading port

    def validate_port_matches_mode(self) -> tuple[bool, str]:
        """Validate that configured port matches trading mode."""
        expected = self.get_expected_port()
        if self.ib_gateway_port != expected:
            return False, (
                f"Port mismatch: trading_mode={self.trading_mode.value} "
                f"expects port {expected}, but ib_gateway_port={self.ib_gateway_port}"
            )
        return True, "OK"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def clear_settings_cache():
    """Clear settings cache (useful for testing)."""
    get_settings.cache_clear()
