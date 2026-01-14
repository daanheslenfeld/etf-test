"""Trading safety service with per-user limits and double-submission prevention."""
import asyncio
from datetime import datetime, date
from typing import Optional, Dict, Set
from dataclasses import dataclass, field
from config import get_settings, TradingMode
import logging

logger = logging.getLogger(__name__)


@dataclass
class UserSafetyLimits:
    """Per-user safety limits."""
    max_order_size: int = 100  # Maximum shares per single order
    max_order_value: float = 10000.0  # Maximum EUR value per order
    max_daily_orders: int = 50  # Maximum orders per day
    max_daily_exposure: float = 50000.0  # Maximum daily total exposure in EUR
    large_order_threshold: int = 25  # Orders above this need confirmation
    bulk_order_threshold: int = 3  # Basket with more orders needs confirmation


@dataclass
class UserDailyStats:
    """Track daily trading stats per user."""
    date: date = field(default_factory=date.today)
    order_count: int = 0
    total_exposure: float = 0.0
    order_ids: Set[str] = field(default_factory=set)

    def reset_if_new_day(self):
        """Reset stats if it's a new day."""
        today = date.today()
        if self.date != today:
            self.date = today
            self.order_count = 0
            self.total_exposure = 0.0
            self.order_ids = set()


@dataclass
class SafetyCheckResult:
    """Result of a safety check."""
    allowed: bool
    reason: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_type: Optional[str] = None  # "large_order", "bulk_order", "live_trading"
    warnings: list = field(default_factory=list)


class SafetyService:
    """Service for enforcing trading safety limits."""

    def __init__(self):
        self._user_stats: Dict[int, UserDailyStats] = {}
        self._pending_orders: Dict[str, datetime] = {}  # order_hash -> timestamp
        self._pending_order_ttl = 30  # Seconds before pending order expires
        self._user_limits: Dict[int, UserSafetyLimits] = {}
        self._lock = asyncio.Lock()

    def get_user_limits(self, customer_id: int) -> UserSafetyLimits:
        """Get safety limits for a user. Can be customized per user."""
        if customer_id not in self._user_limits:
            self._user_limits[customer_id] = UserSafetyLimits()
        return self._user_limits[customer_id]

    def set_user_limits(self, customer_id: int, limits: UserSafetyLimits):
        """Set custom limits for a user."""
        self._user_limits[customer_id] = limits

    def _get_user_stats(self, customer_id: int) -> UserDailyStats:
        """Get or create daily stats for a user."""
        if customer_id not in self._user_stats:
            self._user_stats[customer_id] = UserDailyStats()
        stats = self._user_stats[customer_id]
        stats.reset_if_new_day()
        return stats

    def _generate_order_hash(
        self,
        customer_id: int,
        ib_account_id: str,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str
    ) -> str:
        """Generate a unique hash for an order to detect duplicates."""
        return f"{customer_id}:{ib_account_id}:{symbol}:{side}:{quantity}:{order_type}"

    async def check_order_safety(
        self,
        customer_id: int,
        ib_account_id: str,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str,
        estimated_value: float,
        is_live_mode: bool
    ) -> SafetyCheckResult:
        """
        Check if an order passes all safety checks.

        Returns SafetyCheckResult with allowed=True/False and any warnings.
        """
        async with self._lock:
            limits = self.get_user_limits(customer_id)
            stats = self._get_user_stats(customer_id)
            warnings = []

            # Check 1: Order size limit
            if quantity > limits.max_order_size:
                return SafetyCheckResult(
                    allowed=False,
                    reason=f"Order size {quantity} exceeds maximum allowed {limits.max_order_size}"
                )

            # Check 2: Order value limit
            if estimated_value > limits.max_order_value:
                return SafetyCheckResult(
                    allowed=False,
                    reason=f"Order value {estimated_value:.2f} EUR exceeds maximum {limits.max_order_value:.2f} EUR"
                )

            # Check 3: Daily order count
            if stats.order_count >= limits.max_daily_orders:
                return SafetyCheckResult(
                    allowed=False,
                    reason=f"Daily order limit reached ({limits.max_daily_orders} orders)"
                )

            # Check 4: Daily exposure limit
            if stats.total_exposure + estimated_value > limits.max_daily_exposure:
                return SafetyCheckResult(
                    allowed=False,
                    reason=f"Order would exceed daily exposure limit of {limits.max_daily_exposure:.2f} EUR"
                )

            # Check 5: Double submission prevention
            order_hash = self._generate_order_hash(
                customer_id, ib_account_id, symbol, side, quantity, order_type
            )
            if order_hash in self._pending_orders:
                pending_time = self._pending_orders[order_hash]
                age = (datetime.now() - pending_time).total_seconds()
                if age < self._pending_order_ttl:
                    return SafetyCheckResult(
                        allowed=False,
                        reason=f"Duplicate order detected. Please wait {int(self._pending_order_ttl - age)} seconds."
                    )

            # Check for confirmation requirements
            requires_confirmation = False
            confirmation_type = None

            # Large order confirmation
            if quantity >= limits.large_order_threshold:
                requires_confirmation = True
                confirmation_type = "large_order"
                warnings.append(f"Large order: {quantity} shares")

            # Live trading confirmation
            if is_live_mode:
                requires_confirmation = True
                confirmation_type = "live_trading"
                warnings.append("LIVE TRADING: Real money will be used")

            return SafetyCheckResult(
                allowed=True,
                requires_confirmation=requires_confirmation,
                confirmation_type=confirmation_type,
                warnings=warnings
            )

    async def check_basket_safety(
        self,
        customer_id: int,
        ib_account_id: str,
        orders: list,
        is_live_mode: bool
    ) -> SafetyCheckResult:
        """
        Check if a basket of orders passes safety checks.
        """
        limits = self.get_user_limits(customer_id)
        stats = self._get_user_stats(customer_id)
        warnings = []
        total_value = 0.0

        # Calculate total basket value
        for order in orders:
            total_value += order.get("estimated_value", 0.0)

        # Check total basket exposure
        if stats.total_exposure + total_value > limits.max_daily_exposure:
            return SafetyCheckResult(
                allowed=False,
                reason=f"Basket total {total_value:.2f} EUR would exceed daily limit"
            )

        # Check order count
        if stats.order_count + len(orders) > limits.max_daily_orders:
            return SafetyCheckResult(
                allowed=False,
                reason=f"Basket would exceed daily order limit ({limits.max_daily_orders})"
            )

        # Check individual orders
        for order in orders:
            result = await self.check_order_safety(
                customer_id=customer_id,
                ib_account_id=ib_account_id,
                symbol=order.get("symbol", ""),
                side=order.get("side", ""),
                quantity=order.get("quantity", 0),
                order_type=order.get("order_type", "MKT"),
                estimated_value=order.get("estimated_value", 0.0),
                is_live_mode=is_live_mode
            )
            if not result.allowed:
                return result
            warnings.extend(result.warnings)

        # Bulk order confirmation
        requires_confirmation = False
        confirmation_type = None

        if len(orders) >= limits.bulk_order_threshold:
            requires_confirmation = True
            confirmation_type = "bulk_order"
            warnings.append(f"Bulk order: {len(orders)} orders in basket")

        if is_live_mode:
            requires_confirmation = True
            confirmation_type = "live_trading"
            warnings.insert(0, "LIVE TRADING: Real money will be used")

        return SafetyCheckResult(
            allowed=True,
            requires_confirmation=requires_confirmation,
            confirmation_type=confirmation_type,
            warnings=warnings
        )

    async def mark_order_pending(
        self,
        customer_id: int,
        ib_account_id: str,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str
    ):
        """Mark an order as pending to prevent double submission."""
        async with self._lock:
            order_hash = self._generate_order_hash(
                customer_id, ib_account_id, symbol, side, quantity, order_type
            )
            self._pending_orders[order_hash] = datetime.now()

            # Cleanup old pending orders
            now = datetime.now()
            expired = [
                h for h, t in self._pending_orders.items()
                if (now - t).total_seconds() > self._pending_order_ttl
            ]
            for h in expired:
                del self._pending_orders[h]

    async def record_order_executed(
        self,
        customer_id: int,
        ib_account_id: str,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str,
        order_id: str,
        estimated_value: float
    ):
        """Record that an order was successfully executed."""
        async with self._lock:
            stats = self._get_user_stats(customer_id)
            stats.order_count += 1
            stats.total_exposure += estimated_value
            stats.order_ids.add(order_id)

            # Remove from pending
            order_hash = self._generate_order_hash(
                customer_id, ib_account_id, symbol, side, quantity, order_type
            )
            self._pending_orders.pop(order_hash, None)

            logger.info(
                f"Order recorded for user {customer_id}: "
                f"daily_count={stats.order_count}, daily_exposure={stats.total_exposure:.2f}"
            )

    def get_user_daily_stats(self, customer_id: int) -> dict:
        """Get current daily stats for a user."""
        stats = self._get_user_stats(customer_id)
        limits = self.get_user_limits(customer_id)
        return {
            "date": stats.date.isoformat(),
            "order_count": stats.order_count,
            "max_orders": limits.max_daily_orders,
            "total_exposure": stats.total_exposure,
            "max_exposure": limits.max_daily_exposure,
            "orders_remaining": limits.max_daily_orders - stats.order_count,
            "exposure_remaining": limits.max_daily_exposure - stats.total_exposure
        }


# Singleton instance
_safety_service: Optional[SafetyService] = None


def get_safety_service() -> SafetyService:
    """Get or create safety service singleton."""
    global _safety_service
    if _safety_service is None:
        _safety_service = SafetyService()
    return _safety_service
