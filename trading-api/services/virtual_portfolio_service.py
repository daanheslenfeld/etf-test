"""Virtual Portfolio Service for batch trading system.

Manages user virtual portfolios (cash balances and share holdings) with complete isolation.
Supports optional virtual_account_id for multi-account trading.
"""
import httpx
from decimal import Decimal
from typing import Optional
from datetime import datetime
from config import get_settings
import logging

logger = logging.getLogger(__name__)


class VirtualPortfolioError(Exception):
    """Custom exception for virtual portfolio errors."""

    def __init__(self, message: str, status_code: int = None, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class VirtualPortfolioService:
    """Service for managing user virtual portfolios."""

    def __init__(self):
        settings = get_settings()
        self.base_url = f"{settings.supabase_url}/rest/v1"
        # Use service_role key to bypass RLS for backend access
        api_key = settings.supabase_service_role_key or settings.supabase_key
        self.headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self._configured = bool(api_key)
        if not self._configured:
            logger.warning("VirtualPortfolioService not configured: missing supabase keys")
        elif not settings.supabase_service_role_key:
            logger.warning("VirtualPortfolioService using anon key - RLS may block access")

    def is_configured(self) -> bool:
        """Check if service is properly configured."""
        return self._configured

    def _account_filter(self, virtual_account_id: str = None) -> dict:
        """Build filter params for virtual_account_id."""
        if virtual_account_id:
            return {"virtual_account_id": f"eq.{virtual_account_id}"}
        return {"virtual_account_id": "is.null"}

    # =========================================================================
    # PORTFOLIO METHODS
    # =========================================================================

    async def get_portfolio(self, user_id: int, virtual_account_id: str = None) -> Optional[dict]:
        """
        Get user's complete virtual portfolio.

        Cash is read from virtual_accounts (assigned_cash, reserved_cash, available_cash).
        Holdings are read from virtual_holdings.
        The virtual_portfolios row is ensured to exist (for holdings tracking).

        Args:
            user_id: User ID
            virtual_account_id: Optional virtual account ID. If None, gets legacy portfolio.
        """
        if not self._configured:
            logger.debug("VirtualPortfolioService not configured")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Ensure virtual_portfolios row exists (for holdings linkage)
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                portfolio_data = response.json()

                if not portfolio_data:
                    portfolio = await self._create_portfolio(user_id, virtual_account_id)
                    if not portfolio:
                        logger.error(f"Failed to create portfolio for user {user_id} (account: {virtual_account_id})")
                        return None
                else:
                    portfolio = portfolio_data[0]

                holdings = await self.get_holdings(user_id, virtual_account_id)

                # Read cash from virtual_accounts (new cash model)
                if virtual_account_id:
                    acct_response = await client.get(
                        f"{self.base_url}/virtual_accounts",
                        headers=self.headers,
                        params={
                            "id": f"eq.{virtual_account_id}",
                            "select": "assigned_cash,reserved_cash,available_cash"
                        }
                    )
                    acct_response.raise_for_status()
                    acct_data = acct_response.json()
                    if acct_data:
                        assigned = float(acct_data[0].get("assigned_cash", 0))
                        reserved = float(acct_data[0].get("reserved_cash", 0))
                        available = float(acct_data[0].get("available_cash", 0))
                    else:
                        assigned = reserved = available = 0.0
                else:
                    # Legacy portfolio (no virtual account) — read from virtual_portfolios
                    cash = float(portfolio.get("cash_balance", 0))
                    reserved = float(portfolio.get("reserved_balance", 0))
                    assigned = cash
                    available = cash - reserved

                return {
                    "id": portfolio.get("id"),
                    "user_id": user_id,
                    "virtual_account_id": virtual_account_id,
                    # New cash model fields
                    "assigned_cash": assigned,
                    "reserved_cash": reserved,
                    "available_cash": available,
                    # Backward compatibility aliases
                    "cash_balance": available,
                    "reserved_balance": reserved,
                    "available_balance": available,
                    "total_deposited": float(portfolio.get("total_deposited", 0)),
                    "total_withdrawn": float(portfolio.get("total_withdrawn", 0)),
                    "holdings": holdings,
                    "created_at": portfolio.get("created_at"),
                    "updated_at": portfolio.get("updated_at")
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting portfolio for user {user_id}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error getting portfolio for user {user_id}: {type(e).__name__}: {e}")
            return None

    async def _create_portfolio(self, user_id: int, virtual_account_id: str = None) -> dict:
        """Create a new virtual portfolio for a user."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {
                    "user_id": user_id,
                    "cash_balance": 0,
                    "reserved_balance": 0,
                    "total_deposited": 0,
                    "total_withdrawn": 0
                }
                if virtual_account_id:
                    payload["virtual_account_id"] = virtual_account_id

                response = await client.post(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    json=payload
                )

                if response.status_code == 409:
                    logger.info(f"Portfolio already exists for user {user_id}, fetching it")
                    params = {"user_id": f"eq.{user_id}", "select": "*"}
                    params.update(self._account_filter(virtual_account_id))
                    get_response = await client.get(
                        f"{self.base_url}/virtual_portfolios",
                        headers=self.headers,
                        params=params
                    )
                    get_response.raise_for_status()
                    data = get_response.json()
                    return data[0] if data else None

                response.raise_for_status()
                data = response.json()
                result = data[0] if isinstance(data, list) else data
                logger.info(f"Created virtual portfolio for user {user_id} (account: {virtual_account_id})")
                return result
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 409:
                logger.info(f"Portfolio created by race condition for user {user_id}")
                return await self._get_portfolio_raw(user_id, virtual_account_id)
            logger.error(f"Error creating portfolio for user {user_id}: {e}")
            raise VirtualPortfolioError(f"Failed to create portfolio: {e}")
        except Exception as e:
            logger.error(f"Error creating portfolio for user {user_id}: {e}")
            raise VirtualPortfolioError(f"Failed to create portfolio: {e}")

    async def _get_portfolio_raw(self, user_id: int, virtual_account_id: str = None) -> Optional[dict]:
        """Get portfolio without creating if it doesn't exist."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error fetching portfolio for user {user_id}: {e}")
            return None

    async def get_cash_balance(self, user_id: int, virtual_account_id: str = None) -> Decimal:
        """DEPRECATED: Use CashAllocationService.get_account_cash() instead.
        Get user's available cash."""
        logger.warning("DEPRECATED: get_cash_balance() called — use CashAllocationService instead")
        portfolio = await self.get_portfolio(user_id, virtual_account_id)
        if not portfolio:
            return Decimal("0")
        return Decimal(str(portfolio.get("available_balance", 0)))

    async def reserve_cash(self, user_id: int, amount: Decimal, order_id: str = None, virtual_account_id: str = None) -> bool:
        """DEPRECATED: Use CashAllocationService.reserve_for_order() instead.
        Reserve cash for a pending buy order.
        """
        logger.warning("DEPRECATED: reserve_cash() called — use CashAllocationService.reserve_for_order()")
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    logger.error(f"No portfolio found for user {user_id}")
                    return False

                portfolio = data[0]
                cash = Decimal(str(portfolio["cash_balance"]))
                reserved = Decimal(str(portfolio["reserved_balance"]))
                available = cash - reserved

                if available < amount:
                    logger.warning(f"Insufficient funds for user {user_id}: available={available}, required={amount}")
                    return False

                new_reserved = reserved + amount
                patch_params = {"user_id": f"eq.{user_id}"}
                patch_params.update(self._account_filter(virtual_account_id))
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=patch_params,
                    json={"reserved_balance": float(new_reserved)}
                )
                response.raise_for_status()
                logger.info(f"Reserved {amount} for user {user_id} (order: {order_id}, account: {virtual_account_id})")
                return True

        except Exception as e:
            logger.error(f"Error reserving cash for user {user_id}: {e}")
            return False

    async def release_reserved_cash(self, user_id: int, amount: Decimal, order_id: str = None, virtual_account_id: str = None) -> bool:
        """DEPRECATED: Use CashAllocationService.cancel_order() instead."""
        logger.warning("DEPRECATED: release_reserved_cash() called — use CashAllocationService.cancel_order()")
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return False

                portfolio = data[0]
                reserved = Decimal(str(portfolio["reserved_balance"]))
                new_reserved = max(Decimal("0"), reserved - amount)

                patch_params = {"user_id": f"eq.{user_id}"}
                patch_params.update(self._account_filter(virtual_account_id))
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=patch_params,
                    json={"reserved_balance": float(new_reserved)}
                )
                response.raise_for_status()
                logger.info(f"Released {amount} reserved cash for user {user_id} (order: {order_id})")
                return True

        except Exception as e:
            logger.error(f"Error releasing reserved cash for user {user_id}: {e}")
            return False

    async def deduct_cash(
        self,
        user_id: int,
        amount: Decimal,
        from_reserved: bool = True,
        order_id: str = None,
        description: str = None,
        virtual_account_id: str = None
    ) -> bool:
        """DEPRECATED: Use CashAllocationService.settle_buy() instead."""
        logger.warning("DEPRECATED: deduct_cash() called — use CashAllocationService.settle_buy()")
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return False

                portfolio = data[0]
                cash = Decimal(str(portfolio["cash_balance"]))
                reserved = Decimal(str(portfolio["reserved_balance"]))

                new_cash = cash - amount
                new_reserved = reserved - amount if from_reserved else reserved

                if new_cash < 0:
                    logger.error(f"Cannot deduct {amount} from user {user_id}: only {cash} available")
                    return False

                update_data = {"cash_balance": float(new_cash)}
                if from_reserved:
                    update_data["reserved_balance"] = float(max(Decimal("0"), new_reserved))

                patch_params = {"user_id": f"eq.{user_id}"}
                patch_params.update(self._account_filter(virtual_account_id))
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=patch_params,
                    json=update_data
                )
                response.raise_for_status()

                await self._record_transaction(
                    user_id=user_id,
                    type="buy",
                    amount=-float(amount),
                    balance_after=float(new_cash),
                    order_intention_id=order_id,
                    description=description or "Buy order deduction",
                    virtual_account_id=virtual_account_id
                )

                logger.info(f"Deducted {amount} from user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error deducting cash for user {user_id}: {e}")
            return False

    async def credit_cash(
        self,
        user_id: int,
        amount: Decimal,
        order_id: str = None,
        description: str = None,
        virtual_account_id: str = None
    ) -> bool:
        """DEPRECATED: Use CashAllocationService.credit_sell() instead."""
        logger.warning("DEPRECATED: credit_cash() called — use CashAllocationService.credit_sell()")
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    await self._create_portfolio(user_id, virtual_account_id)
                    data = [{"cash_balance": 0}]

                portfolio = data[0]
                cash = Decimal(str(portfolio["cash_balance"]))
                new_cash = cash + amount

                patch_params = {"user_id": f"eq.{user_id}"}
                patch_params.update(self._account_filter(virtual_account_id))
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=patch_params,
                    json={"cash_balance": float(new_cash)}
                )
                response.raise_for_status()

                await self._record_transaction(
                    user_id=user_id,
                    type="sell",
                    amount=float(amount),
                    balance_after=float(new_cash),
                    order_intention_id=order_id,
                    description=description or "Sell proceeds",
                    virtual_account_id=virtual_account_id
                )

                logger.info(f"Credited {amount} to user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error crediting cash for user {user_id}: {e}")
            return False

    async def deposit(self, user_id: int, amount: Decimal, description: str = None, virtual_account_id: str = None) -> bool:
        """DEPRECATED: Use CashAllocationService.admin_allocate() instead."""
        logger.warning("DEPRECATED: deposit() called — use CashAllocationService.admin_allocate()")
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    portfolio = await self._create_portfolio(user_id, virtual_account_id)
                    if portfolio:
                        cash = Decimal(str(portfolio.get("cash_balance", 0)))
                        deposited = Decimal(str(portfolio.get("total_deposited", 0)))
                    else:
                        cash = Decimal("0")
                        deposited = Decimal("0")
                else:
                    cash = Decimal(str(data[0]["cash_balance"]))
                    deposited = Decimal(str(data[0]["total_deposited"]))

                new_cash = cash + amount
                new_deposited = deposited + amount

                patch_params = {"user_id": f"eq.{user_id}"}
                patch_params.update(self._account_filter(virtual_account_id))
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=patch_params,
                    json={
                        "cash_balance": float(new_cash),
                        "total_deposited": float(new_deposited)
                    }
                )
                response.raise_for_status()

                await self._record_transaction(
                    user_id=user_id,
                    type="deposit",
                    amount=float(amount),
                    balance_after=float(new_cash),
                    description=description or "Deposit",
                    virtual_account_id=virtual_account_id
                )

                logger.info(f"Deposited {amount} to user {user_id} (account: {virtual_account_id})")
                return True

        except Exception as e:
            logger.error(f"Error depositing for user {user_id}: {e}")
            return False

    async def withdraw(self, user_id: int, amount: Decimal, description: str = None, virtual_account_id: str = None) -> bool:
        """DEPRECATED: Use CashAllocationService.admin_allocate(negative delta) instead."""
        logger.warning("DEPRECATED: withdraw() called — use CashAllocationService.admin_allocate()")
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"user_id": f"eq.{user_id}", "select": "*"}
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return False

                portfolio = data[0]
                cash = Decimal(str(portfolio["cash_balance"]))
                reserved = Decimal(str(portfolio["reserved_balance"]))
                withdrawn = Decimal(str(portfolio["total_withdrawn"]))
                available = cash - reserved

                if available < amount:
                    logger.warning(f"Insufficient funds for withdrawal: available={available}, requested={amount}")
                    return False

                new_cash = cash - amount
                new_withdrawn = withdrawn + amount

                patch_params = {"user_id": f"eq.{user_id}"}
                patch_params.update(self._account_filter(virtual_account_id))
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params=patch_params,
                    json={
                        "cash_balance": float(new_cash),
                        "total_withdrawn": float(new_withdrawn)
                    }
                )
                response.raise_for_status()

                await self._record_transaction(
                    user_id=user_id,
                    type="withdrawal",
                    amount=-float(amount),
                    balance_after=float(new_cash),
                    description=description or "Withdrawal",
                    virtual_account_id=virtual_account_id
                )

                logger.info(f"Withdrew {amount} from user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error withdrawing for user {user_id}: {e}")
            return False

    # =========================================================================
    # HOLDINGS METHODS
    # =========================================================================

    async def get_holdings(self, user_id: int, virtual_account_id: str = None) -> list[dict]:
        """Get all holdings for a user (optionally scoped to virtual account)."""
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "user_id": f"eq.{user_id}",
                    "select": "*",
                    "quantity": "gt.0"
                }
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_holdings",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                return response.json() or []

        except Exception as e:
            logger.error(f"Error getting holdings for user {user_id}: {e}")
            return []

    async def get_holding(self, user_id: int, symbol: str, virtual_account_id: str = None) -> Optional[dict]:
        """Get a specific holding for a user."""
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "user_id": f"eq.{user_id}",
                    "symbol": f"eq.{symbol}",
                    "select": "*"
                }
                params.update(self._account_filter(virtual_account_id))

                response = await client.get(
                    f"{self.base_url}/virtual_holdings",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None

        except Exception as e:
            logger.error(f"Error getting holding {symbol} for user {user_id}: {e}")
            return None

    async def add_holding(
        self,
        user_id: int,
        symbol: str,
        conid: int,
        quantity: Decimal,
        cost_basis: Decimal,
        isin: str = None,
        name: str = None,
        virtual_account_id: str = None
    ) -> bool:
        """
        Add shares to user's holdings.

        If holding exists, updates quantity and recalculates average cost.
        If new holding, creates it.
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                existing = await self.get_holding(user_id, symbol, virtual_account_id)

                if existing:
                    old_qty = Decimal(str(existing["quantity"]))
                    old_cost = Decimal(str(existing["avg_cost_basis"]))
                    new_qty = old_qty + quantity
                    new_avg_cost = (old_qty * old_cost + quantity * cost_basis) / new_qty

                    response = await client.patch(
                        f"{self.base_url}/virtual_holdings",
                        headers=self.headers,
                        params={"id": f"eq.{existing['id']}"},
                        json={
                            "quantity": float(new_qty),
                            "avg_cost_basis": float(new_avg_cost)
                        }
                    )
                else:
                    payload = {
                        "user_id": user_id,
                        "symbol": symbol,
                        "conid": conid,
                        "isin": isin,
                        "name": name,
                        "quantity": float(quantity),
                        "avg_cost_basis": float(cost_basis)
                    }
                    if virtual_account_id:
                        payload["virtual_account_id"] = virtual_account_id

                    response = await client.post(
                        f"{self.base_url}/virtual_holdings",
                        headers=self.headers,
                        json=payload
                    )

                response.raise_for_status()
                logger.info(f"Added {quantity} shares of {symbol} for user {user_id} at {cost_basis}")
                return True

        except Exception as e:
            logger.error(f"Error adding holding for user {user_id}: {e}")
            return False

    async def remove_holding(
        self,
        user_id: int,
        symbol: str,
        quantity: Decimal,
        virtual_account_id: str = None
    ) -> Optional[Decimal]:
        """
        Remove shares from user's holdings.

        Returns:
            The cost basis of removed shares (for P&L calculation), or None on failure
        """
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                existing = await self.get_holding(user_id, symbol, virtual_account_id)

                if not existing:
                    logger.error(f"No holding found for {symbol} for user {user_id}")
                    return None

                old_qty = Decimal(str(existing["quantity"]))
                cost_basis = Decimal(str(existing["avg_cost_basis"]))

                if old_qty < quantity:
                    logger.error(f"Insufficient shares for {symbol}: have {old_qty}, need {quantity}")
                    return None

                new_qty = old_qty - quantity

                if new_qty == 0:
                    response = await client.delete(
                        f"{self.base_url}/virtual_holdings",
                        headers=self.headers,
                        params={"id": f"eq.{existing['id']}"}
                    )
                else:
                    response = await client.patch(
                        f"{self.base_url}/virtual_holdings",
                        headers=self.headers,
                        params={"id": f"eq.{existing['id']}"},
                        json={"quantity": float(new_qty)}
                    )

                response.raise_for_status()
                logger.info(f"Removed {quantity} shares of {symbol} for user {user_id}")
                return cost_basis

        except Exception as e:
            logger.error(f"Error removing holding for user {user_id}: {e}")
            return None

    # =========================================================================
    # TRANSACTION METHODS
    # =========================================================================

    async def _record_transaction(
        self,
        user_id: int,
        type: str,
        amount: float,
        balance_after: float,
        symbol: str = None,
        quantity: float = None,
        price: float = None,
        order_intention_id: str = None,
        fill_allocation_id: str = None,
        description: str = None,
        virtual_account_id: str = None
    ) -> bool:
        """Record a transaction for audit trail."""
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {
                    "user_id": user_id,
                    "type": type,
                    "symbol": symbol,
                    "quantity": quantity,
                    "price": price,
                    "amount": amount,
                    "balance_after": balance_after,
                    "order_intention_id": order_intention_id,
                    "fill_allocation_id": fill_allocation_id,
                    "description": description
                }
                if virtual_account_id:
                    payload["virtual_account_id"] = virtual_account_id

                response = await client.post(
                    f"{self.base_url}/virtual_transactions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error recording transaction: {e}")
            return False

    async def get_transactions(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        type_filter: str = None,
        virtual_account_id: str = None
    ) -> list[dict]:
        """Get transaction history for a user."""
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "user_id": f"eq.{user_id}",
                    "select": "*",
                    "order": "created_at.desc",
                    "limit": limit,
                    "offset": offset
                }
                params.update(self._account_filter(virtual_account_id))

                if type_filter:
                    params["type"] = f"eq.{type_filter}"

                response = await client.get(
                    f"{self.base_url}/virtual_transactions",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                return response.json() or []

        except Exception as e:
            logger.error(f"Error getting transactions for user {user_id}: {e}")
            return []


# Singleton instance
_virtual_portfolio_service: Optional[VirtualPortfolioService] = None


def get_virtual_portfolio_service() -> VirtualPortfolioService:
    """Get or create VirtualPortfolioService singleton."""
    global _virtual_portfolio_service
    if _virtual_portfolio_service is None:
        _virtual_portfolio_service = VirtualPortfolioService()
    return _virtual_portfolio_service
