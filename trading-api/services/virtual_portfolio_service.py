"""Virtual Portfolio Service for batch trading system.

Manages user virtual portfolios (cash balances and share holdings) with complete isolation.
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

    # =========================================================================
    # PORTFOLIO METHODS
    # =========================================================================

    async def get_portfolio(self, user_id: int) -> Optional[dict]:
        """
        Get user's complete virtual portfolio.

        Returns:
            {
                "cash_balance": Decimal,
                "reserved_balance": Decimal,
                "available_balance": Decimal,
                "total_deposited": Decimal,
                "total_withdrawn": Decimal,
                "holdings": [...],
                "total_holdings_value": Decimal (requires market data),
                "total_value": Decimal
            }
        """
        if not self._configured:
            logger.debug("VirtualPortfolioService not configured")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get cash balance
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
                )
                response.raise_for_status()
                portfolio_data = response.json()

                # If no portfolio exists, create one
                if not portfolio_data:
                    portfolio = await self._create_portfolio(user_id)
                else:
                    portfolio = portfolio_data[0]

                # Get holdings
                holdings = await self.get_holdings(user_id)

                cash = Decimal(str(portfolio.get("cash_balance", 0)))
                reserved = Decimal(str(portfolio.get("reserved_balance", 0)))

                return {
                    "id": portfolio.get("id"),
                    "user_id": user_id,
                    "cash_balance": float(cash),
                    "reserved_balance": float(reserved),
                    "available_balance": float(cash - reserved),
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

    async def _create_portfolio(self, user_id: int) -> dict:
        """Create a new virtual portfolio for a user."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    json={
                        "user_id": user_id,
                        "cash_balance": 0,
                        "reserved_balance": 0,
                        "total_deposited": 0,
                        "total_withdrawn": 0
                    }
                )

                # Handle 409 Conflict (portfolio already exists)
                if response.status_code == 409:
                    logger.info(f"Portfolio already exists for user {user_id}, fetching it")
                    # Fetch the existing portfolio
                    get_response = await client.get(
                        f"{self.base_url}/virtual_portfolios",
                        headers=self.headers,
                        params={"user_id": f"eq.{user_id}", "select": "*"}
                    )
                    get_response.raise_for_status()
                    data = get_response.json()
                    return data[0] if data else None

                response.raise_for_status()
                data = response.json()
                result = data[0] if isinstance(data, list) else data
                logger.info(f"Created virtual portfolio for user {user_id}")
                return result
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 409:
                # Race condition - portfolio was created between our check and create
                logger.info(f"Portfolio created by race condition for user {user_id}")
                return await self._get_portfolio_raw(user_id)
            logger.error(f"Error creating portfolio for user {user_id}: {e}")
            raise VirtualPortfolioError(f"Failed to create portfolio: {e}")
        except Exception as e:
            logger.error(f"Error creating portfolio for user {user_id}: {e}")
            raise VirtualPortfolioError(f"Failed to create portfolio: {e}")

    async def _get_portfolio_raw(self, user_id: int) -> Optional[dict]:
        """Get portfolio without creating if it doesn't exist."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Error fetching portfolio for user {user_id}: {e}")
            return None

    async def get_cash_balance(self, user_id: int) -> Decimal:
        """Get user's available cash (cash - reserved)."""
        portfolio = await self.get_portfolio(user_id)
        if not portfolio:
            return Decimal("0")
        return Decimal(str(portfolio.get("available_balance", 0)))

    async def reserve_cash(self, user_id: int, amount: Decimal, order_id: str = None) -> bool:
        """
        Reserve cash for a pending buy order.

        Args:
            user_id: User ID
            amount: Amount to reserve
            order_id: Optional order ID for logging

        Returns:
            True if successful, False if insufficient funds
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get current portfolio
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
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

                # Update reserved balance
                new_reserved = reserved + amount
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}"},
                    json={"reserved_balance": float(new_reserved)}
                )
                response.raise_for_status()
                logger.info(f"Reserved {amount} for user {user_id} (order: {order_id})")
                return True

        except Exception as e:
            logger.error(f"Error reserving cash for user {user_id}: {e}")
            return False

    async def release_reserved_cash(self, user_id: int, amount: Decimal, order_id: str = None) -> bool:
        """
        Release reserved cash (when order is cancelled/rejected).

        Args:
            user_id: User ID
            amount: Amount to release
            order_id: Optional order ID for logging

        Returns:
            True if successful
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get current portfolio
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return False

                portfolio = data[0]
                reserved = Decimal(str(portfolio["reserved_balance"]))
                new_reserved = max(Decimal("0"), reserved - amount)

                # Update reserved balance
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}"},
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
        description: str = None
    ) -> bool:
        """
        Deduct cash after a buy fill.

        Args:
            user_id: User ID
            amount: Amount to deduct
            from_reserved: If True, also reduce reserved balance
            order_id: Optional order ID for transaction record
            description: Optional description for transaction

        Returns:
            True if successful
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get current portfolio
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
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

                # Update balances
                update_data = {"cash_balance": float(new_cash)}
                if from_reserved:
                    update_data["reserved_balance"] = float(max(Decimal("0"), new_reserved))

                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}"},
                    json=update_data
                )
                response.raise_for_status()

                # Record transaction
                await self._record_transaction(
                    user_id=user_id,
                    type="buy",
                    amount=-float(amount),
                    balance_after=float(new_cash),
                    order_intention_id=order_id,
                    description=description or f"Buy order deduction"
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
        description: str = None
    ) -> bool:
        """
        Credit cash after a sell fill.

        Args:
            user_id: User ID
            amount: Amount to credit
            order_id: Optional order ID for transaction record
            description: Optional description

        Returns:
            True if successful
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get current portfolio
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    # Create portfolio if doesn't exist
                    await self._create_portfolio(user_id)
                    data = [{"cash_balance": 0}]

                portfolio = data[0]
                cash = Decimal(str(portfolio["cash_balance"]))
                new_cash = cash + amount

                # Update cash balance
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}"},
                    json={"cash_balance": float(new_cash)}
                )
                response.raise_for_status()

                # Record transaction
                await self._record_transaction(
                    user_id=user_id,
                    type="sell",
                    amount=float(amount),
                    balance_after=float(new_cash),
                    order_intention_id=order_id,
                    description=description or f"Sell proceeds"
                )

                logger.info(f"Credited {amount} to user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error crediting cash for user {user_id}: {e}")
            return False

    async def deposit(self, user_id: int, amount: Decimal, description: str = None) -> bool:
        """
        Deposit funds to user's virtual portfolio.

        Args:
            user_id: User ID
            amount: Amount to deposit
            description: Optional description

        Returns:
            True if successful
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get or create portfolio
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    # Create portfolio and use returned data
                    portfolio = await self._create_portfolio(user_id)
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

                # Update balances
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}"},
                    json={
                        "cash_balance": float(new_cash),
                        "total_deposited": float(new_deposited)
                    }
                )
                response.raise_for_status()

                # Record transaction
                await self._record_transaction(
                    user_id=user_id,
                    type="deposit",
                    amount=float(amount),
                    balance_after=float(new_cash),
                    description=description or "Deposit"
                )

                logger.info(f"Deposited {amount} to user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error depositing for user {user_id}: {e}")
            return False

    async def withdraw(self, user_id: int, amount: Decimal, description: str = None) -> bool:
        """
        Withdraw funds from user's virtual portfolio.

        Args:
            user_id: User ID
            amount: Amount to withdraw
            description: Optional description

        Returns:
            True if successful, False if insufficient funds
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get portfolio
                response = await client.get(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}", "select": "*"}
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

                # Update balances
                response = await client.patch(
                    f"{self.base_url}/virtual_portfolios",
                    headers=self.headers,
                    params={"user_id": f"eq.{user_id}"},
                    json={
                        "cash_balance": float(new_cash),
                        "total_withdrawn": float(new_withdrawn)
                    }
                )
                response.raise_for_status()

                # Record transaction
                await self._record_transaction(
                    user_id=user_id,
                    type="withdrawal",
                    amount=-float(amount),
                    balance_after=float(new_cash),
                    description=description or "Withdrawal"
                )

                logger.info(f"Withdrew {amount} from user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error withdrawing for user {user_id}: {e}")
            return False

    # =========================================================================
    # HOLDINGS METHODS
    # =========================================================================

    async def get_holdings(self, user_id: int) -> list[dict]:
        """Get all holdings for a user."""
        if not self._configured:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/virtual_holdings",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "select": "*",
                        "quantity": "gt.0"
                    }
                )
                response.raise_for_status()
                return response.json() or []

        except Exception as e:
            logger.error(f"Error getting holdings for user {user_id}: {e}")
            return []

    async def get_holding(self, user_id: int, symbol: str) -> Optional[dict]:
        """Get a specific holding for a user."""
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/virtual_holdings",
                    headers=self.headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "symbol": f"eq.{symbol}",
                        "select": "*"
                    }
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
        name: str = None
    ) -> bool:
        """
        Add shares to user's holdings.

        If holding exists, updates quantity and recalculates average cost.
        If new holding, creates it.

        Args:
            user_id: User ID
            symbol: ETF symbol
            conid: IB contract ID
            quantity: Number of shares to add
            cost_basis: Cost per share for this purchase
            isin: Optional ISIN
            name: Optional ETF name

        Returns:
            True if successful
        """
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Check if holding exists
                existing = await self.get_holding(user_id, symbol)

                if existing:
                    # Calculate new average cost
                    old_qty = Decimal(str(existing["quantity"]))
                    old_cost = Decimal(str(existing["avg_cost_basis"]))
                    new_qty = old_qty + quantity
                    # Weighted average: (old_qty * old_cost + new_qty * new_cost) / total_qty
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
                    # Create new holding
                    response = await client.post(
                        f"{self.base_url}/virtual_holdings",
                        headers=self.headers,
                        json={
                            "user_id": user_id,
                            "symbol": symbol,
                            "conid": conid,
                            "isin": isin,
                            "name": name,
                            "quantity": float(quantity),
                            "avg_cost_basis": float(cost_basis)
                        }
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
        quantity: Decimal
    ) -> Optional[Decimal]:
        """
        Remove shares from user's holdings.

        Args:
            user_id: User ID
            symbol: ETF symbol
            quantity: Number of shares to remove

        Returns:
            The cost basis of removed shares (for P&L calculation), or None on failure
        """
        if not self._configured:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get existing holding
                existing = await self.get_holding(user_id, symbol)

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
                    # Delete the holding
                    response = await client.delete(
                        f"{self.base_url}/virtual_holdings",
                        headers=self.headers,
                        params={"id": f"eq.{existing['id']}"}
                    )
                else:
                    # Update quantity (cost basis stays the same)
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
        description: str = None
    ) -> bool:
        """Record a transaction for audit trail."""
        if not self._configured:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/virtual_transactions",
                    headers=self.headers,
                    json={
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
        type_filter: str = None
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
