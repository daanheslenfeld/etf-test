"""Audit logging service for trading activity."""
from supabase import create_client, Client
from config import get_settings
from typing import Optional
import logging
import json

logger = logging.getLogger(__name__)


class AuditService:
    """Service for logging all trading activity."""

    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )

    async def log_action(
        self,
        customer_id: int,
        action: str,
        broker_account_id: Optional[int] = None,
        order_id: Optional[str] = None,
        symbol: Optional[str] = None,
        side: Optional[str] = None,
        quantity: Optional[float] = None,
        price: Optional[float] = None,
        status: Optional[str] = None,
        request_payload: Optional[dict] = None,
        response_payload: Optional[dict] = None,
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> bool:
        """Log a trading action to the audit log."""
        try:
            self.client.table("trade_audit_log").insert({
                "customer_id": customer_id,
                "broker_account_id": broker_account_id,
                "action": action,
                "order_id": order_id,
                "symbol": symbol,
                "side": side,
                "quantity": quantity,
                "price": price,
                "status": status,
                "request_payload": json.dumps(request_payload) if request_payload else None,
                "response_payload": json.dumps(response_payload) if response_payload else None,
                "error_message": error_message,
                "ip_address": ip_address
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error logging audit action: {e}")
            return False

    async def log_order_placed(
        self,
        customer_id: int,
        broker_account_id: int,
        order_id: str,
        symbol: str,
        side: str,
        quantity: float,
        request_payload: dict,
        response_payload: dict,
        ip_address: str
    ):
        """Log an order placement."""
        await self.log_action(
            customer_id=customer_id,
            action="order_placed",
            broker_account_id=broker_account_id,
            order_id=order_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            status="submitted",
            request_payload=request_payload,
            response_payload=response_payload,
            ip_address=ip_address
        )

    async def log_order_error(
        self,
        customer_id: int,
        broker_account_id: int,
        symbol: str,
        side: str,
        quantity: float,
        error_message: str,
        request_payload: dict,
        ip_address: str
    ):
        """Log an order error."""
        await self.log_action(
            customer_id=customer_id,
            action="order_rejected",
            broker_account_id=broker_account_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            status="rejected",
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
