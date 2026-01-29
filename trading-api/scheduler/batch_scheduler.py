"""Batch Scheduler for automated daily batch execution.

Uses APScheduler to run batch execution at a configured time (default: 14:00 CET).
"""
import asyncio
import logging
from datetime import datetime, time
from typing import Optional, Callable, Awaitable

logger = logging.getLogger(__name__)

# Global scheduler state
_scheduler_running = False
_scheduler_task: Optional[asyncio.Task] = None
_batch_time = time(14, 0)  # 14:00 local time
_orders_locked = False


class BatchScheduler:
    """
    Simple async scheduler for daily batch execution.

    Uses asyncio instead of APScheduler for simplicity and better async compatibility.
    """

    def __init__(self, batch_hour: int = 14, batch_minute: int = 0):
        """
        Initialize scheduler.

        Args:
            batch_hour: Hour to run batch (0-23, local time)
            batch_minute: Minute to run batch (0-59)
        """
        self.batch_time = time(batch_hour, batch_minute)
        self.running = False
        self._task: Optional[asyncio.Task] = None
        self._lock_minutes_before = 5  # Lock orders 5 min before batch

    async def start(self):
        """Start the scheduler."""
        if self.running:
            logger.warning("Scheduler already running")
            return

        self.running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        logger.info(f"Batch scheduler started. Daily execution at {self.batch_time}")

    async def stop(self):
        """Stop the scheduler."""
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Batch scheduler stopped")

    async def _scheduler_loop(self):
        """Main scheduler loop - checks every minute if it's batch time."""
        while self.running:
            try:
                now = datetime.now()
                current_time = now.time()

                # Check if it's batch time (within the same minute)
                if (current_time.hour == self.batch_time.hour and
                    current_time.minute == self.batch_time.minute):

                    logger.info("Batch time reached, executing batch...")
                    await self._run_batch()

                    # Wait until next minute to avoid re-triggering
                    await asyncio.sleep(60)
                else:
                    # Check every 30 seconds
                    await asyncio.sleep(30)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(60)

    async def _run_batch(self):
        """Execute the batch."""
        global _orders_locked

        try:
            # Lock new order submissions
            _orders_locked = True
            logger.info("Order submissions locked for batch execution")

            # Import here to avoid circular imports
            from services.batch_execution_service import get_batch_execution_service

            service = get_batch_execution_service()

            # Create and execute batch
            batch = await service.create_batch()
            batch_id = batch["id"]

            logger.info(f"Starting scheduled batch execution: {batch_id}")

            result = await service.execute_batch(batch_id)

            logger.info(
                f"Batch {batch_id} completed: status={result['status']}, "
                f"orders={result.get('orders_executed', 0)}, "
                f"successful={result.get('successful', 0)}, "
                f"failed={result.get('failed', 0)}"
            )

        except Exception as e:
            logger.error(f"Batch execution failed: {e}")
        finally:
            # Unlock order submissions
            _orders_locked = False
            logger.info("Order submissions unlocked")

    def is_orders_locked(self) -> bool:
        """Check if order submissions are currently locked."""
        return _orders_locked

    def get_next_batch_time(self) -> datetime:
        """Get the next scheduled batch time."""
        now = datetime.now()
        today_batch = datetime.combine(now.date(), self.batch_time)

        if now.time() >= self.batch_time:
            # Already past today's batch, next is tomorrow
            from datetime import timedelta
            return today_batch + timedelta(days=1)
        else:
            return today_batch

    def get_status(self) -> dict:
        """Get scheduler status."""
        return {
            "running": self.running,
            "batch_time": self.batch_time.isoformat(),
            "orders_locked": _orders_locked,
            "next_batch_at": self.get_next_batch_time().isoformat()
        }


# Global scheduler instance
_scheduler: Optional[BatchScheduler] = None


def get_scheduler() -> BatchScheduler:
    """Get or create the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = BatchScheduler()
    return _scheduler


async def start_scheduler():
    """Start the global scheduler."""
    scheduler = get_scheduler()
    await scheduler.start()


async def stop_scheduler():
    """Stop the global scheduler."""
    global _scheduler
    if _scheduler:
        await _scheduler.stop()
        _scheduler = None


def is_orders_locked() -> bool:
    """Check if order submissions are locked."""
    return _orders_locked
