"""Interactive Brokers Client Portal Gateway client."""
import httpx
from typing import Optional
from config import get_settings
import logging
import ssl

logger = logging.getLogger(__name__)

# MVP ETF list - start with 1 ETF
MVP_ETFS = [
    {
        "symbol": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "conid": 756733,
        "exchange": "ARCA",
        "currency": "USD"
    }
]

# IB Market data field codes
FIELD_LAST_PRICE = "31"
FIELD_SYMBOL = "55"
FIELD_BID = "84"
FIELD_ASK = "86"
FIELD_BID_SIZE = "88"
FIELD_ASK_SIZE = "85"
FIELD_VOLUME = "87"


class IBClient:
    """Client for Interactive Brokers Client Portal Gateway API."""

    def __init__(self):
        settings = get_settings()
        self.base_url = f"{settings.ib_gateway_url}/v1/api"
        self.timeout = settings.ib_gateway_timeout

        # IB Gateway uses self-signed certificates
        # In production, configure proper SSL verification
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            verify=False  # Gateway uses self-signed cert
        )

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()

    async def check_auth_status(self) -> dict:
        """Check if authenticated with IB Gateway."""
        try:
            response = await self._client.get("/iserver/auth/status")
            response.raise_for_status()
            data = response.json()
            return {
                "authenticated": data.get("authenticated", False),
                "connected": data.get("connected", False),
                "competing": data.get("competing", False),
                "message": "Connected to IB Gateway" if data.get("authenticated") else "Not authenticated"
            }
        except httpx.ConnectError:
            return {
                "authenticated": False,
                "connected": False,
                "competing": False,
                "message": "Cannot connect to IB Gateway. Make sure it's running on https://localhost:5000"
            }
        except Exception as e:
            logger.error(f"Error checking auth status: {e}")
            return {
                "authenticated": False,
                "connected": False,
                "competing": False,
                "message": f"Error: {str(e)}"
            }

    async def tickle(self) -> bool:
        """Keep the session alive by tickling the server."""
        try:
            response = await self._client.post("/tickle")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error tickling server: {e}")
            return False

    async def get_accounts(self) -> list[dict]:
        """Get available trading accounts."""
        try:
            response = await self._client.get("/iserver/accounts")
            response.raise_for_status()
            data = response.json()
            return data.get("accounts", [])
        except Exception as e:
            logger.error(f"Error getting accounts: {e}")
            return []

    async def get_market_data_snapshot(self, conids: list[int]) -> list[dict]:
        """
        Get market data snapshot for given contract IDs.

        Note: First request starts the data stream. Subsequent requests
        return actual data.
        """
        try:
            conids_str = ",".join(str(c) for c in conids)
            fields = ",".join([FIELD_LAST_PRICE, FIELD_SYMBOL, FIELD_BID, FIELD_ASK,
                               FIELD_BID_SIZE, FIELD_ASK_SIZE, FIELD_VOLUME])

            response = await self._client.get(
                "/iserver/marketdata/snapshot",
                params={"conids": conids_str, "fields": fields}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
            return []

    def parse_quote(self, data: dict) -> dict:
        """Parse IB market data response into standardized quote format."""
        return {
            "conid": data.get("conid"),
            "symbol": data.get(FIELD_SYMBOL, data.get("55")),
            "last_price": self._parse_float(data.get(FIELD_LAST_PRICE, data.get("31"))),
            "bid": self._parse_float(data.get(FIELD_BID, data.get("84"))),
            "ask": self._parse_float(data.get(FIELD_ASK, data.get("86"))),
            "bid_size": self._parse_int(data.get(FIELD_BID_SIZE, data.get("88"))),
            "ask_size": self._parse_int(data.get(FIELD_ASK_SIZE, data.get("85"))),
            "volume": self._parse_int(data.get(FIELD_VOLUME, data.get("87")))
        }

    async def place_order(
        self,
        account_id: str,
        conid: int,
        side: str,
        quantity: int,
        order_type: str = "MKT",
        limit_price: Optional[float] = None
    ) -> dict:
        """
        Place an order.

        Args:
            account_id: IB account ID
            conid: Contract ID
            side: BUY or SELL
            quantity: Number of shares
            order_type: MKT or LMT
            limit_price: Price for limit orders
        """
        try:
            order = {
                "conid": conid,
                "orderType": order_type,
                "side": side,
                "quantity": quantity,
                "tif": "DAY"  # Time in force: Day order
            }

            if order_type == "LMT" and limit_price:
                order["price"] = limit_price

            # IB requires orders to be wrapped in an "orders" array
            payload = {"orders": [order]}

            response = await self._client.post(
                f"/iserver/account/{account_id}/orders",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error placing order: {e.response.text}")
            return {"error": True, "message": e.response.text}
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            return {"error": True, "message": str(e)}

    async def confirm_order(self, reply_id: str, confirmed: bool = True) -> dict:
        """
        Confirm an order that requires confirmation.

        IB may ask for order confirmation for certain orders.
        """
        try:
            response = await self._client.post(
                f"/iserver/reply/{reply_id}",
                json={"confirmed": confirmed}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error confirming order: {e}")
            return {"error": True, "message": str(e)}

    async def get_orders(self, filters: Optional[dict] = None) -> list[dict]:
        """Get order status for recent orders."""
        try:
            response = await self._client.get("/iserver/account/orders")
            response.raise_for_status()
            data = response.json()
            return data.get("orders", [])
        except Exception as e:
            logger.error(f"Error getting orders: {e}")
            return []

    async def get_positions(self, account_id: str) -> list[dict]:
        """Get current positions for an account."""
        try:
            # First, request portfolio positions page (required by IB)
            await self._client.get(f"/portfolio/{account_id}/positions/0")

            # Then get the actual positions
            response = await self._client.get(f"/portfolio/{account_id}/positions/0")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            return []

    @staticmethod
    def _parse_float(value) -> Optional[float]:
        """Safely parse a float value."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _parse_int(value) -> Optional[int]:
        """Safely parse an int value."""
        if value is None:
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None

    def get_mvp_etfs(self) -> list[dict]:
        """Get the MVP ETF list."""
        return MVP_ETFS.copy()


# Singleton instance
_ib_client: Optional[IBClient] = None


def get_ib_client() -> IBClient:
    """Get or create IB client singleton."""
    global _ib_client
    if _ib_client is None:
        _ib_client = IBClient()
    return _ib_client
