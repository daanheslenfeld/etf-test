"""Audit logging service for trading activity with comprehensive logging."""
import httpx
from config import get_settings, TradingMode
from typing import Optional
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)


class AuditService:
    """Service for logging all trading activity with full audit trail."""

    def __init__(self):
        settings = get_settings()
        self.base_url = f"{settings.supabase_url}/rest/v1"
        self.headers = {
            "apikey": settings.supabase_key,
            "Authorization": f"Bearer {settings.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        self._configured = bool(settings.supabase_key)

    async def log_action(
        self,
        customer_id: int,
        action: str,
        broker_account_id: Optional[int] = None,
        ib_account_id: Optional[str] = None,
        order_id: Optional[str] = None,
        symbol: Optional[str] = None,
        side: Optional[str] = None,
        quantity: Optional[float] = None,
        price: Optional[float] = None,
        order_type: Optional[str] = None,
        status: Optional[str] = None,
        trading_mode: Optional[str] = None,
        request_payload: Optional[dict] = None,
        response_payload: Optional[dict] = None,
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        safety_warnings: Optional[list] = None
    ) -> bool:
        """Log a trading action to the audit log with full details."""
        timestamp = datetime.utcnow().isoformat()

        # Always log to console for immediate visibility
        log_entry = {
            "timestamp": timestamp,
            "customer_id": customer_id,
            "ib_account_id": ib_account_id,
            "action": action,
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "order_type": order_type,
            "trading_mode": trading_mode,
            "status": status,
            "order_id": order_id,
            "ip_address": ip_address
        }

        if action in ["order_placed", "order_rejected", "safety_blocked"]:
            logger.info(f"AUDIT: {json.dumps(log_entry)}")

        # Try to log to database
        if not self._configured:
            logger.debug("Audit service not configured - skipping database log")
            return True

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/trade_audit_log",
                    headers=self.headers,
                    json={
                        "customer_id": customer_id,
                        "broker_account_id": broker_account_id,
                        "ib_account_id": ib_account_id,
                        "action": action,
                        "order_id": order_id,
                        "symbol": symbol,
                        "side": side,
                        "quantity": quantity,
                        "price": price,
                        "order_type": order_type,
                        "status": status,
                        "trading_mode": trading_mode,
                        "request_payload": request_payload,
                        "response_payload": response_payload,
                        "error_message": error_message,
                        "ip_address": ip_address,
                        "user_agent": user_agent,
                        "safety_warnings": safety_warnings
                    }
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error logging audit action to database: {e}")
            # Still return True since we logged to console
            return True

    async def log_safety_block(
        self,
        customer_id: int,
        ib_account_id: str,
        symbol: str,
        side: str,
        quantity: int,
        reason: str,
        trading_mode: str,
        ip_address: str
    ):
        """Log when an order is blocked by safety checks."""
        await self.log_action(
            customer_id=customer_id,
            action="safety_blocked",
            ib_account_id=ib_account_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            status="blocked",
            trading_mode=trading_mode,
            error_message=reason,
            ip_address=ip_address
        )

    async def log_order_placed(
        self,
        customer_id: int,
        broker_account_id: int,
        ib_account_id: str,
        order_id: str,
        symbol: str,
        side: str,
        quantity: float,
        order_type: str,
        trading_mode: str,
        request_payload: dict,
        response_payload: dict,
        ip_address: str,
        safety_warnings: list = None
    ):
        """Log an order placement with full audit details."""
        await self.log_action(
            customer_id=customer_id,
            action="order_placed",
            broker_account_id=broker_account_id,
            ib_account_id=ib_account_id,
            order_id=order_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            order_type=order_type,
            status="submitted",
            trading_mode=trading_mode,
            request_payload=request_payload,
            response_payload=response_payload,
            ip_address=ip_address,
            safety_warnings=safety_warnings
        )

    async def log_order_error(
        self,
        customer_id: int,
        broker_account_id: int,
        ib_account_id: str,
        symbol: str,
        side: str,
        quantity: float,
        order_type: str,
        trading_mode: str,
        error_message: str,
        request_payload: dict,
        ip_address: str
    ):
        """Log an order error with full audit details."""
        await self.log_action(
            customer_id=customer_id,
            action="order_rejected",
            broker_account_id=broker_account_id,
            ib_account_id=ib_account_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            order_type=order_type,
            status="rejected",
            trading_mode=trading_mode,
            request_payload=request_payload,
            error_message=error_message,
            ip_address=ip_address
        )

    async def log_quote_request(
        self,
        customer_id: int,
        symbols: list[str],
        ip_address: str
    ):
        """Log a quote request."""
        await self.log_action(
            customer_id=customer_id,
            action="quote_requested",
            symbol=",".join(symbols),
            ip_address=ip_address
        )


# Singleton instance
_audit_service: Optional[AuditService] = None


def get_audit_service() -> AuditService:
    """Get or create audit service singleton."""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditService()
    return _audit_service
