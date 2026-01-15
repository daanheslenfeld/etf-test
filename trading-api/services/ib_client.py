"""
Interactive Brokers Gateway Client - Production Ready.

Singleton IB client with:
- Single connection per process
- Auto-reconnect with exponential backoff
- Clean startup/shutdown lifecycle
- No connections at import time
- Real connectivity detection
"""
import asyncio
import logging
from typing import Optional, Callable, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field

from ib_insync import IB, Stock, MarketOrder, LimitOrder, StopOrder, Order, Contract, Trade
import eventkit

logger = logging.getLogger(__name__)


# =============================================================================
# Connection State Machine
# =============================================================================

class ConnectionState(str, Enum):
    """IB Gateway connection states."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    FAILED = "failed"


@dataclass
class ConnectionStatus:
    """Detailed connection status for health checks."""
    state: ConnectionState
    connected: bool
    ready_for_orders: bool
    account: Optional[str]
    last_connected: Optional[datetime]
    last_error: Optional[str]
    reconnect_attempts: int
    next_reconnect_at: Optional[datetime]

    def to_dict(self) -> dict:
        return {
            "state": self.state.value,
            "connected": self.connected,
            "ready_for_orders": self.ready_for_orders,
            "account": self.account,
            "last_connected": self.last_connected.isoformat() if self.last_connected else None,
            "last_error": self.last_error,
            "reconnect_attempts": self.reconnect_attempts,
            "next_reconnect_at": self.next_reconnect_at.isoformat() if self.next_reconnect_at else None,
        }


# =============================================================================
# EU UCITS ETFs - Allowed for trading
# Updated based on IB Gateway investigation (scripts/investigate_etfs.py)
# Must stay in sync with frontend: src/data/tradableETFs.js
# =============================================================================

MVP_ETFS = [
    # S&P 500 ETFs
    {"symbol": "VUSA", "name": "Vanguard S&P 500 UCITS ETF", "conid": 128884495, "exchange": "AEB", "currency": "EUR", "isin": "IE00B3XXRP09"},
    {"symbol": "CSPX", "name": "iShares Core S&P 500 UCITS ETF", "conid": 76023663, "exchange": "EBS", "currency": "USD", "isin": "IE00B5BMR087"},
    {"symbol": "IUSA", "name": "iShares S&P 500 UCITS ETF", "conid": 29651319, "exchange": "AEB", "currency": "EUR", "isin": "IE0031442068"},
    # World ETFs
    {"symbol": "IWDA", "name": "iShares Core MSCI World UCITS ETF", "conid": 100292038, "exchange": "AEB", "currency": "EUR", "isin": "IE00B4L5Y983"},
    {"symbol": "VWRL", "name": "Vanguard FTSE All-World UCITS ETF", "conid": 128831206, "exchange": "AEB", "currency": "EUR", "isin": "IE00B3RBWM25"},
    {"symbol": "VWCE", "name": "Vanguard FTSE All-World UCITS ETF Acc", "conid": 375858281, "exchange": "AEB", "currency": "EUR", "isin": "IE00BK5BQT80"},
    # Emerging Markets ETFs
    {"symbol": "IEMM", "name": "iShares MSCI EM UCITS ETF", "conid": 37036647, "exchange": "AEB", "currency": "EUR", "isin": "IE00B0M63177"},
    {"symbol": "EMIM", "name": "iShares Core MSCI EM IMI UCITS ETF", "conid": 153454120, "exchange": "AEB", "currency": "EUR", "isin": "IE00BKM4GZ66"},
]


# =============================================================================
# IB Client - Singleton
# =============================================================================

class IBClient:
    """
    Production-ready IB Gateway client.

    Features:
    - No connection at instantiation (connect explicitly)
    - Single connection per process
    - Auto-reconnect with exponential backoff
    - Clean disconnect on shutdown
    - Real connectivity detection
    """

    def __init__(self, settings=None):
        """Initialize client without connecting."""
        # Lazy import to avoid connection at module load
        if settings is None:
            from config import get_settings
            settings = get_settings()

        self._settings = settings
        self._ib: Optional[IB] = None

        # Connection state
        self._state = ConnectionState.DISCONNECTED
        self._connection_ready = asyncio.Event()
        self._primary_account: Optional[str] = None
        self._next_valid_id: Optional[int] = None

        # Error tracking
        self._last_error: Optional[str] = None
        self._last_connected: Optional[datetime] = None

        # Reconnection state
        self._reconnect_task: Optional[asyncio.Task] = None
        self._reconnect_attempts = 0
        self._next_reconnect_at: Optional[datetime] = None
        self._shutdown_requested = False

        # Position cache
        self._positions_cache: dict[str, list] = {}
        self._positions_subscribed = False

        # Market data cache: {conid: {bid, ask, last, bidSize, askSize, volume, timestamp, delayed}}
        self._market_data_cache: dict[int, dict] = {}
        self._market_data_tickers: dict[int, Any] = {}  # Track active ticker subscriptions
        self._market_data_contracts: dict[int, Contract] = {}

        # Callbacks
        self._on_connect_callbacks: list[Callable] = []
        self._on_disconnect_callbacks: list[Callable] = []

        logger.info(f"IBClient initialized (not connected): host={settings.ib_gateway_host}, port={settings.ib_gateway_port}")

    # =========================================================================
    # Connection Lifecycle
    # =========================================================================

    async def connect(self) -> bool:
        """
        Connect to IB Gateway.

        Returns True if connected successfully, False otherwise.
        Does NOT auto-reconnect - call start_auto_reconnect() for that.
        """
        if self._state == ConnectionState.CONNECTED and self._ib and self._ib.isConnected():
            logger.debug("Already connected")
            return True

        if self._state == ConnectionState.CONNECTING:
            logger.warning("Connection already in progress")
            return False

        self._state = ConnectionState.CONNECTING
        self._patch_eventkit_loop()

        try:
            # Clean up any existing connection
            if self._ib is not None:
                try:
                    self._ib.disconnect()
                except Exception:
                    pass

            # Create fresh IB instance
            self._ib = IB()
            self._setup_event_handlers()

            # Reset state
            self._connection_ready.clear()
            self._last_error = None

            logger.info(f"Connecting to IB Gateway at {self._settings.ib_gateway_host}:{self._settings.ib_gateway_port}...")

            await self._ib.connectAsync(
                host=self._settings.ib_gateway_host,
                port=self._settings.ib_gateway_port,
                clientId=self._settings.ib_client_id,
                timeout=self._settings.ib_connection_timeout,
                readonly=False
            )

            if self._ib.isConnected():
                self._state = ConnectionState.CONNECTED
                self._next_valid_id = self._ib.client.getReqId()
                self._connection_ready.set()
                self._last_connected = datetime.now()
                self._reconnect_attempts = 0

                # Get accounts
                accounts = self._ib.managedAccounts()
                self._primary_account = accounts[0] if accounts else None

                logger.info(f"Connected to IB Gateway! Account: {self._primary_account}, nextValidId: {self._next_valid_id}")

                # Subscribe to positions (non-critical, don't fail connect)
                try:
                    self._subscribe_positions()
                except Exception as e:
                    logger.warning(f"Position subscription failed (non-critical): {e}")

                # Subscribe to account updates for real-time account values
                try:
                    self._ib.reqAccountUpdates(subscribe=True, account=self._primary_account)
                    logger.info(f"Subscribed to account updates for {self._primary_account}")
                except Exception as e:
                    logger.warning(f"Account updates subscription failed (non-critical): {e}")

                # Fire callbacks
                for cb in self._on_connect_callbacks:
                    try:
                        cb()
                    except Exception as e:
                        logger.warning(f"Connect callback error: {e}")

                return True
            else:
                self._state = ConnectionState.FAILED
                self._last_error = "Connection did not succeed"
                logger.error("Connection failed: IB not connected after connectAsync")
                return False

        except asyncio.TimeoutError:
            self._state = ConnectionState.FAILED
            self._last_error = f"Connection timeout after {self._settings.ib_connection_timeout}s"
            logger.error(self._last_error)
            return False
        except ConnectionRefusedError:
            self._state = ConnectionState.FAILED
            self._last_error = f"Connection refused at {self._settings.ib_gateway_host}:{self._settings.ib_gateway_port}"
            logger.error(self._last_error)
            return False
        except Exception as e:
            self._state = ConnectionState.FAILED
            self._last_error = f"{type(e).__name__}: {e}"
            logger.error(f"Connection error: {self._last_error}")
            return False

    async def disconnect(self):
        """Clean disconnect from IB Gateway."""
        self._shutdown_requested = True

        # Cancel reconnect task
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
            try:
                await self._reconnect_task
            except asyncio.CancelledError:
                pass
            self._reconnect_task = None

        # Disconnect from IB
        if self._ib is not None:
            if self._ib.isConnected():
                logger.info("Disconnecting from IB Gateway...")
                if self._positions_subscribed:
                    try:
                        self._ib.cancelPositions()
                    except Exception:
                        pass
                self._ib.disconnect()
            self._ib = None

        # Reset state
        self._state = ConnectionState.DISCONNECTED
        self._connection_ready.clear()
        self._primary_account = None
        self._next_valid_id = None
        self._positions_cache.clear()
        self._positions_subscribed = False
        self._reconnect_attempts = 0
        self._next_reconnect_at = None

        logger.info("Disconnected from IB Gateway")

    async def start_auto_reconnect(self):
        """Start auto-reconnect background task."""
        if not self._settings.ib_reconnect_enabled:
            logger.info("Auto-reconnect disabled in settings")
            return

        if self._reconnect_task and not self._reconnect_task.done():
            logger.debug("Auto-reconnect already running")
            return

        self._shutdown_requested = False
        self._reconnect_task = asyncio.create_task(self._reconnect_loop())
        logger.info("Auto-reconnect started")

    async def stop_auto_reconnect(self):
        """Stop auto-reconnect background task."""
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
            try:
                await self._reconnect_task
            except asyncio.CancelledError:
                pass
        self._reconnect_task = None
        logger.info("Auto-reconnect stopped")

    async def _reconnect_loop(self):
        """Background task for auto-reconnection with exponential backoff."""
        delay = self._settings.ib_reconnect_delay_initial

        while not self._shutdown_requested:
            try:
                # Wait if connected
                if self.is_connected():
                    await asyncio.sleep(5)
                    continue

                # Check max attempts
                max_attempts = self._settings.ib_reconnect_max_attempts
                if max_attempts > 0 and self._reconnect_attempts >= max_attempts:
                    logger.error(f"Max reconnect attempts ({max_attempts}) reached")
                    self._state = ConnectionState.FAILED
                    break

                self._state = ConnectionState.RECONNECTING
                self._reconnect_attempts += 1
                self._next_reconnect_at = datetime.now()

                logger.info(f"Reconnect attempt {self._reconnect_attempts} (delay: {delay:.1f}s)")

                if await self.connect():
                    delay = self._settings.ib_reconnect_delay_initial
                else:
                    # Exponential backoff
                    await asyncio.sleep(delay)
                    delay = min(
                        delay * self._settings.ib_reconnect_delay_multiplier,
                        self._settings.ib_reconnect_delay_max
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Reconnect loop error: {e}")
                await asyncio.sleep(delay)

    # =========================================================================
    # Event Handlers
    # =========================================================================

    def _setup_event_handlers(self):
        """Set up IB event handlers."""
        self._ib.connectedEvent += self._on_connected
        self._ib.disconnectedEvent += self._on_disconnected
        self._ib.errorEvent += self._on_error
        self._ib.newOrderEvent += self._on_new_order
        self._ib.positionEvent += self._on_position

    def _on_connected(self):
        """Handle connection established."""
        logger.info("IB Gateway: connected event")
        self._state = ConnectionState.CONNECTED

    def _on_disconnected(self):
        """Handle connection lost."""
        logger.warning("IB Gateway: disconnected event")
        was_connected = self._state == ConnectionState.CONNECTED
        self._state = ConnectionState.DISCONNECTED
        self._connection_ready.clear()

        # Fire callbacks
        for cb in self._on_disconnect_callbacks:
            try:
                cb()
            except Exception as e:
                logger.warning(f"Disconnect callback error: {e}")

        # Trigger reconnect if not shutting down
        if was_connected and not self._shutdown_requested and self._settings.ib_reconnect_enabled:
            logger.info("Connection lost, will auto-reconnect...")

    def _on_error(self, reqId: int, errorCode: int, errorString: str, contract: Contract = None):
        """Handle IB error messages."""
        info_codes = {2104, 2106, 2158, 2119}

        if errorCode in info_codes:
            logger.debug(f"IB Info [{errorCode}]: {errorString}")
        elif errorCode == 1100:
            logger.error(f"IB CONNECTIVITY LOST [{errorCode}]: {errorString}")
            self._state = ConnectionState.DISCONNECTED
        elif errorCode == 1102:
            logger.info(f"IB Connectivity restored [{errorCode}]")
        elif errorCode == 326:
            self._last_error = f"Client ID {self._settings.ib_client_id} already in use"
            logger.error(self._last_error)
        elif errorCode in {200, 201, 202, 203, 399}:
            logger.error(f"IB Order Error [{errorCode}]: {errorString}")
        else:
            logger.warning(f"IB Error [{errorCode}]: {errorString}")

    def _on_new_order(self, trade: Trade):
        """Handle new order events."""
        logger.info(f"Order: {trade.order.action} {trade.order.totalQuantity} {trade.contract.symbol} - {trade.orderStatus.status}")

    def _on_position(self, position):
        """Cache position updates."""
        account = position.account
        if account not in self._positions_cache:
            self._positions_cache[account] = []

        existing = [p for p in self._positions_cache[account] if p.contract.conId == position.contract.conId]
        if existing:
            idx = self._positions_cache[account].index(existing[0])
            self._positions_cache[account][idx] = position
        else:
            self._positions_cache[account].append(position)

    def _subscribe_positions(self):
        """Subscribe to position updates once."""
        if self._positions_subscribed:
            return
        self._positions_cache.clear()
        self._ib.reqPositions()
        self._positions_subscribed = True
        logger.debug("Subscribed to position updates")

    def _patch_eventkit_loop(self):
        """Patch eventkit to use current event loop."""
        try:
            loop = asyncio.get_running_loop()
            eventkit.util.main_event_loop = loop
            asyncio.set_event_loop(loop)
        except RuntimeError:
            pass

    # =========================================================================
    # Status Methods
    # =========================================================================

    def is_connected(self) -> bool:
        """Check if connected to IB Gateway."""
        return self._ib is not None and self._ib.isConnected()

    def is_ready_for_orders(self) -> bool:
        """Check if ready to place orders."""
        return self.is_connected() and self._connection_ready.is_set()

    def get_status(self) -> ConnectionStatus:
        """Get detailed connection status for health checks."""
        return ConnectionStatus(
            state=self._state,
            connected=self.is_connected(),
            ready_for_orders=self.is_ready_for_orders(),
            account=self._primary_account,
            last_connected=self._last_connected,
            last_error=self._last_error,
            reconnect_attempts=self._reconnect_attempts,
            next_reconnect_at=self._next_reconnect_at,
        )

    def get_primary_account(self) -> Optional[str]:
        """Get primary IB account ID."""
        return self._primary_account

    async def get_accounts(self) -> list[str]:
        """Get list of available accounts."""
        if not self.is_connected():
            return []
        return self._ib.managedAccounts()

    async def check_auth_status(self) -> dict:
        """Check connection status (legacy compatibility)."""
        if not self.is_connected():
            return {
                "authenticated": False,
                "connected": False,
                "competing": False,
                "message": self._last_error or "Not connected"
            }

        accounts = self._ib.managedAccounts()
        return {
            "authenticated": True,
            "connected": True,
            "competing": False,
            "message": f"Connected to IB Gateway. Accounts: {', '.join(accounts) if accounts else 'None'}"
        }

    # =========================================================================
    # Trading Methods
    # =========================================================================

    async def place_order(
        self,
        account_id: str,
        conid: int,
        side: str,
        quantity: int,
        order_type: str = "MKT",
        limit_price: Optional[float] = None,
        stop_price: Optional[float] = None
    ) -> dict:
        """Place an order via IB Gateway."""
        from config import get_settings, TradingMode
        settings = get_settings()

        # Log order with environment info
        order_log = {
            "action": "order_attempt",
            "trading_mode": settings.trading_mode.value,
            "account": account_id,
            "conid": conid,
            "side": side,
            "quantity": quantity,
            "order_type": order_type,
            "limit_price": limit_price,
            "stop_price": stop_price,
            "timestamp": datetime.now().isoformat(),
        }

        if settings.log_orders:
            logger.info(f"ORDER: {order_log}")

        # Safety check: block live trading unless explicitly enabled
        if settings.trading_mode == TradingMode.LIVE and not settings.is_live_trading_enabled():
            error_msg = "LIVE TRADING BLOCKED: Set LIVE_TRADING_CONFIRMATION environment variable"
            logger.error(error_msg)
            return {"error": True, "message": error_msg}

        # Connection check
        if not self.is_connected():
            return {"error": True, "message": f"Not connected to IB Gateway"}

        if not self.is_ready_for_orders():
            return {"error": True, "message": "Connection not ready for orders"}

        # Account verification
        accounts = self._ib.managedAccounts()
        if account_id not in accounts:
            return {"error": True, "message": f"Account {account_id} not found. Available: {accounts}"}

        # Find ETF
        etf_info = next((e for e in MVP_ETFS if e["conid"] == conid), None)
        if not etf_info:
            return {"error": True, "message": f"Contract ID {conid} not in allowed ETF list"}

        try:
            # Create contract
            contract = Stock(etf_info["symbol"], "SMART", etf_info["currency"])
            contract.conId = conid

            # Create order
            if order_type == "MKT":
                order = MarketOrder(action=side, totalQuantity=quantity, account=account_id, tif="DAY")
            elif order_type == "LMT":
                if limit_price is None:
                    return {"error": True, "message": "Limit price required for LMT orders"}
                order = LimitOrder(action=side, totalQuantity=quantity, lmtPrice=limit_price, account=account_id, tif="DAY")
            elif order_type == "STP":
                if stop_price is None:
                    return {"error": True, "message": "Stop price required for STP orders"}
                order = StopOrder(action=side, totalQuantity=quantity, stopPrice=stop_price, account=account_id, tif="DAY")
            elif order_type == "STP_LMT":
                if stop_price is None:
                    return {"error": True, "message": "Stop price required for STP_LMT orders"}
                if limit_price is None:
                    return {"error": True, "message": "Limit price required for STP_LMT orders"}
                order = Order(
                    action=side,
                    totalQuantity=quantity,
                    orderType="STP LMT",
                    auxPrice=stop_price,
                    lmtPrice=limit_price,
                    account=account_id,
                    tif="DAY"
                )
            else:
                return {"error": True, "message": f"Unsupported order type: {order_type}"}

            # Place order
            trade = self._ib.placeOrder(contract, order)
            await asyncio.sleep(0.5)

            status = trade.orderStatus.status
            order_id = trade.order.orderId

            result = {
                "error": False,
                "order_id": order_id,
                "orderId": order_id,
                "status": status,
                "message": f"Order {order_id} submitted",
                "details": {
                    "symbol": etf_info["symbol"],
                    "side": side,
                    "quantity": quantity,
                    "order_type": order_type,
                    "limit_price": limit_price,
                    "account": account_id,
                    "trading_mode": settings.trading_mode.value,
                    "filled": trade.orderStatus.filled,
                    "remaining": trade.orderStatus.remaining,
                    "avgFillPrice": trade.orderStatus.avgFillPrice
                }
            }

            if settings.log_orders:
                logger.info(f"ORDER RESULT: {result}")

            return result

        except Exception as e:
            error_msg = f"Error placing order: {type(e).__name__}: {e}"
            logger.error(error_msg)
            return {"error": True, "message": error_msg}

    async def get_orders(self, filters: Optional[dict] = None) -> list[dict]:
        """Get recent orders."""
        if not self.is_connected():
            return []

        try:
            trades = self._ib.trades()
            return [{
                "orderId": t.order.orderId,
                "order_id": t.order.orderId,
                "ticker": t.contract.symbol,
                "symbol": t.contract.symbol,
                "side": t.order.action,
                "totalSize": t.order.totalQuantity,
                "quantity": t.order.totalQuantity,
                "filledQuantity": t.orderStatus.filled,
                "filled": t.orderStatus.filled,
                "status": t.orderStatus.status,
                "avgPrice": t.orderStatus.avgFillPrice,
                "lastExecutionTime": str(t.log[-1].time) if t.log else None
            } for t in trades]
        except Exception as e:
            logger.error(f"Error getting orders: {e}")
            return []

    async def get_positions(self, account_id: str) -> list[dict]:
        """Get positions from cache."""
        if not self.is_connected():
            return []

        try:
            cached = self._positions_cache.get(account_id, [])
            return [{
                "conid": p.contract.conId,
                "contractDesc": p.contract.symbol,
                "ticker": p.contract.symbol,
                "position": p.position,
                "avgCost": p.avgCost,
                "mktValue": None,
                "unrealizedPnl": None,
                "realizedPnl": None,
                "currency": p.contract.currency
            } for p in cached if p.position != 0]
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            return []

    async def get_account_values(self, account_id: str) -> dict:
        """Get account values including cash balance from IB."""
        if not self.is_connected():
            return {}

        try:
            account_values = {}

            # Method 1: Use accountValues() - works with subscribed account updates
            for av in self._ib.accountValues(account_id):
                if av.currency in ('EUR', 'BASE', ''):
                    try:
                        account_values[av.tag] = float(av.value) if av.value else 0
                    except (ValueError, TypeError):
                        pass

            # If we got values, return them
            if account_values:
                logger.debug(f"Account values from accountValues(): {list(account_values.keys())}")
                return account_values

            # Method 2: Request account summary explicitly
            self._ib.reqAccountSummary()
            await asyncio.sleep(1.0)  # Wait longer for data

            for av in self._ib.accountSummary():
                if av.account == account_id or not account_id:
                    try:
                        account_values[av.tag] = float(av.value) if av.value else 0
                    except (ValueError, TypeError):
                        pass

            self._ib.cancelAccountSummary()

            if account_values:
                logger.debug(f"Account values from accountSummary(): {list(account_values.keys())}")
            else:
                logger.warning(f"No account values retrieved for {account_id}")

            return account_values
        except Exception as e:
            logger.error(f"Error getting account values: {e}")
            return {}

    async def get_market_data_snapshot(self, conids: list[int]) -> list[dict]:
        """Get market data snapshot."""
        if not self.is_connected():
            return []

        results = []
        etf_map = {e["conid"]: e for e in MVP_ETFS}

        for conid in conids:
            etf_info = etf_map.get(conid, {})
            symbol = etf_info.get("symbol", "UNKNOWN")

            try:
                contract = Stock(symbol, "SMART", etf_info.get("currency", "USD"))
                contract.conId = conid
                ticker = self._ib.reqMktData(contract, snapshot=True)
                await asyncio.sleep(0.5)

                results.append({
                    "conid": conid,
                    "55": symbol,
                    "31": ticker.last if ticker.last and ticker.last > 0 else None,
                    "84": ticker.bid if ticker.bid and ticker.bid > 0 else None,
                    "86": ticker.ask if ticker.ask and ticker.ask > 0 else None,
                    "88": ticker.bidSize if ticker.bidSize else None,
                    "85": ticker.askSize if ticker.askSize else None,
                    "87": ticker.volume if ticker.volume else None,
                })
                self._ib.cancelMktData(contract)
            except Exception as e:
                logger.warning(f"Market data error for {symbol}: {e}")
                results.append({"conid": conid, "55": symbol, "31": None, "84": None, "86": None, "88": None, "85": None, "87": None})

        return results

    # =========================================================================
    # Streaming Market Data
    # =========================================================================

    def _on_ticker_update(self, ticker):
        """Handle ticker update from IB."""
        if not ticker.contract:
            return

        conid = ticker.contract.conId
        if conid not in self._market_data_cache:
            return

        # Check if data is delayed (marketDataType 3 = delayed, 4 = delayed-frozen)
        delayed = getattr(ticker, 'marketDataType', 1) in (3, 4)

        # Update cache with latest values
        self._market_data_cache[conid].update({
            "bid": ticker.bid if ticker.bid and ticker.bid > 0 else self._market_data_cache[conid].get("bid"),
            "ask": ticker.ask if ticker.ask and ticker.ask > 0 else self._market_data_cache[conid].get("ask"),
            "last": ticker.last if ticker.last and ticker.last > 0 else self._market_data_cache[conid].get("last"),
            "bidSize": ticker.bidSize if ticker.bidSize else self._market_data_cache[conid].get("bidSize"),
            "askSize": ticker.askSize if ticker.askSize else self._market_data_cache[conid].get("askSize"),
            "volume": ticker.volume if ticker.volume else self._market_data_cache[conid].get("volume"),
            "timestamp": datetime.now().isoformat(),
            "delayed": delayed,
        })

    async def subscribe_market_data(self, conid: int) -> bool:
        """Subscribe to streaming market data for a contract."""
        if not self.is_connected():
            return False

        # Already subscribed
        if conid in self._market_data_tickers:
            return True

        # Find ETF info
        etf_info = next((e for e in MVP_ETFS if e["conid"] == conid), None)
        if not etf_info:
            logger.warning(f"Cannot subscribe to unknown conid: {conid}")
            return False

        try:
            # Create contract
            contract = Stock(etf_info["symbol"], "SMART", etf_info["currency"])
            contract.conId = conid

            # Initialize cache entry
            self._market_data_cache[conid] = {
                "conid": conid,
                "symbol": etf_info["symbol"],
                "bid": None,
                "ask": None,
                "last": None,
                "bidSize": None,
                "askSize": None,
                "volume": None,
                "timestamp": None,
                "delayed": False,
            }

            # Request streaming market data (empty string = default tick types)
            ticker = self._ib.reqMktData(contract, genericTickList="", snapshot=False, regulatorySnapshot=False)

            # Register update callback
            ticker.updateEvent += self._on_ticker_update

            # Store references
            self._market_data_tickers[conid] = ticker
            self._market_data_contracts[conid] = contract

            logger.info(f"Subscribed to market data for {etf_info['symbol']} (conid: {conid})")
            return True

        except Exception as e:
            logger.error(f"Error subscribing to market data for conid {conid}: {e}")
            return False

    async def unsubscribe_market_data(self, conid: int) -> bool:
        """Unsubscribe from market data for a contract."""
        if conid not in self._market_data_tickers:
            return True

        try:
            ticker = self._market_data_tickers[conid]
            contract = self._market_data_contracts.get(conid)

            if contract and self._ib and self._ib.isConnected():
                self._ib.cancelMktData(contract)

            # Clean up
            del self._market_data_tickers[conid]
            if conid in self._market_data_contracts:
                del self._market_data_contracts[conid]
            if conid in self._market_data_cache:
                del self._market_data_cache[conid]

            logger.info(f"Unsubscribed from market data for conid: {conid}")
            return True

        except Exception as e:
            logger.error(f"Error unsubscribing from market data: {e}")
            return False

    async def subscribe_all_etfs(self) -> int:
        """Subscribe to market data for all MVP ETFs. Returns count of successful subscriptions."""
        count = 0
        for etf in MVP_ETFS:
            if await self.subscribe_market_data(etf["conid"]):
                count += 1
            await asyncio.sleep(0.1)  # Small delay to avoid overwhelming IB
        return count

    def unsubscribe_all_market_data(self):
        """Unsubscribe from all market data."""
        for conid in list(self._market_data_tickers.keys()):
            try:
                contract = self._market_data_contracts.get(conid)
                if contract and self._ib and self._ib.isConnected():
                    self._ib.cancelMktData(contract)
            except Exception:
                pass

        self._market_data_tickers.clear()
        self._market_data_contracts.clear()
        self._market_data_cache.clear()
        logger.info("Unsubscribed from all market data")

    def get_market_data(self, conid: int) -> Optional[dict]:
        """Get cached market data for a contract."""
        return self._market_data_cache.get(conid)

    def get_all_market_data(self) -> dict[int, dict]:
        """Get all cached market data."""
        return self._market_data_cache.copy()

    async def get_market_data_for_symbol(self, symbol: str) -> Optional[dict]:
        """Get market data by symbol. Subscribes if not already subscribed."""
        etf_info = next((e for e in MVP_ETFS if e["symbol"].upper() == symbol.upper()), None)
        if not etf_info:
            return None

        conid = etf_info["conid"]

        # Subscribe if not already
        if conid not in self._market_data_tickers:
            await self.subscribe_market_data(conid)
            await asyncio.sleep(0.5)  # Wait for initial data

        return self.get_market_data(conid)

    async def confirm_order(self, reply_id: str, confirmed: bool = True) -> dict:
        """Order confirmation (TWS protocol doesn't need this)."""
        return {"confirmed": confirmed, "message": "TWS protocol does not require confirmation"}

    def refresh_positions(self) -> bool:
        """Force refresh positions cache."""
        if not self.is_connected():
            return False
        try:
            if self._positions_subscribed:
                self._ib.cancelPositions()
                self._positions_subscribed = False
            self._positions_cache.clear()
            self._ib.reqPositions()
            self._positions_subscribed = True
            return True
        except Exception as e:
            logger.error(f"Error refreshing positions: {e}")
            return False

    def get_mvp_etfs(self) -> list[dict]:
        """Get allowed ETF list."""
        return MVP_ETFS.copy()

    def parse_quote(self, raw: dict) -> dict:
        """Parse raw quote data into standardized format."""
        return {
            "conid": raw.get("conid"),
            "symbol": raw.get("55") or raw.get("symbol"),
            "last_price": raw.get("31") or raw.get("last"),
            "bid": raw.get("84") or raw.get("bid"),
            "ask": raw.get("86") or raw.get("ask"),
            "bid_size": raw.get("88") or raw.get("bidSize"),
            "ask_size": raw.get("85") or raw.get("askSize"),
            "volume": raw.get("87") or raw.get("volume"),
        }

    def create_etf_contract(self, symbol: str, exchange: str = "SMART", currency: str = "USD") -> Stock:
        """Create ETF contract."""
        return Stock(symbol, exchange, currency)

    async def qualify_contract(self, contract: Contract) -> bool:
        """Qualify a contract with IB."""
        if not self.is_connected():
            return False
        try:
            qualified = await self._ib.qualifyContractsAsync(contract)
            return bool(qualified)
        except Exception as e:
            logger.error(f"Error qualifying contract: {e}")
            return False


# =============================================================================
# Singleton Instance Management
# =============================================================================

_ib_client: Optional[IBClient] = None


def get_ib_client() -> IBClient:
    """Get or create IB client singleton (does NOT connect)."""
    global _ib_client
    if _ib_client is None:
        _ib_client = IBClient()
    return _ib_client


async def shutdown_ib_client():
    """Shutdown IB client cleanly."""
    global _ib_client
    if _ib_client is not None:
        await _ib_client.disconnect()
        _ib_client = None


async def reconnect_ib_client() -> bool:
    """Reconnect IB client."""
    client = get_ib_client()
    await client.disconnect()
    await asyncio.sleep(1)
    return await client.connect()
