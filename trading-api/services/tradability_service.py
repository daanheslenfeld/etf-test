"""
ETF Tradability Service.

Reads tradability data from the pre-checked JSON file.
This is the single source of truth for ETF tradability.
"""
import json
import logging
from pathlib import Path
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

# Path to tradability data
DATA_DIR = Path(__file__).parent.parent / "data"
TRADABILITY_FILE = DATA_DIR / "etf_tradability.json"


class TradabilityService:
    """Service for ETF tradability lookups."""

    def __init__(self):
        self._data: Optional[dict] = None
        self._load_data()

    def _load_data(self):
        """Load tradability data from JSON file."""
        if not TRADABILITY_FILE.exists():
            logger.warning(f"Tradability file not found: {TRADABILITY_FILE}")
            self._data = {"metadata": {}, "etfs": {}}
            return

        try:
            with open(TRADABILITY_FILE, 'r', encoding='utf-8') as f:
                self._data = json.load(f)
            logger.info(f"Loaded tradability data: {self._data['metadata'].get('total_tradable', 0)} tradable ETFs")
        except Exception as e:
            logger.error(f"Failed to load tradability data: {e}")
            self._data = {"metadata": {}, "etfs": {}}

    def reload(self):
        """Reload tradability data from file."""
        self._load_data()

    def get_metadata(self) -> dict:
        """Get metadata about the tradability check."""
        return self._data.get("metadata", {})

    def is_tradable(self, isin: str) -> bool:
        """Check if an ETF is tradable by ISIN."""
        etf = self._data.get("etfs", {}).get(isin)
        return etf.get("tradable_via_lynx", False) if etf else False

    def get_etf_info(self, isin: str) -> Optional[dict]:
        """Get full tradability info for an ETF."""
        return self._data.get("etfs", {}).get(isin)

    def get_all_tradable(self) -> list[dict]:
        """Get all tradable ETFs."""
        etfs = self._data.get("etfs", {})
        return [
            etf for etf in etfs.values()
            if etf.get("tradable_via_lynx", False)
        ]

    def get_all_blocked(self) -> list[dict]:
        """Get all blocked (non-tradable) ETFs."""
        etfs = self._data.get("etfs", {})
        return [
            etf for etf in etfs.values()
            if not etf.get("tradable_via_lynx", False)
        ]

    def get_contract(self, isin: str) -> Optional[dict]:
        """Get IB contract details for a tradable ETF."""
        etf = self._data.get("etfs", {}).get(isin)
        if etf and etf.get("tradable_via_lynx"):
            return etf.get("contract")
        return None

    def filter_tradable(self, isins: list[str]) -> list[str]:
        """Filter a list of ISINs to only tradable ones."""
        return [isin for isin in isins if self.is_tradable(isin)]

    def get_tradable_isins(self) -> list[str]:
        """Get list of all tradable ISINs."""
        return [
            isin for isin, etf in self._data.get("etfs", {}).items()
            if etf.get("tradable_via_lynx", False)
        ]

    def get_stats(self) -> dict:
        """Get tradability statistics."""
        metadata = self._data.get("metadata", {})
        return {
            "total_checked": metadata.get("total_checked", 0),
            "total_tradable": metadata.get("total_tradable", 0),
            "total_blocked": metadata.get("total_blocked", 0),
            "blocked_by_reason": metadata.get("blocked_by_reason", {}),
            "checked_at": metadata.get("checked_at"),
            "account": metadata.get("account"),
            "ib_port": metadata.get("ib_port"),
            "data_available": TRADABILITY_FILE.exists(),
        }

    def get_blocked_etfs_by_reason(self, reason: str) -> list[dict]:
        """Get all blocked ETFs with a specific reason."""
        etfs = self._data.get("etfs", {})
        return [
            etf for etf in etfs.values()
            if not etf.get("tradable_via_lynx", False)
            and etf.get("reason_if_not_tradable") == reason
        ]

    def enrich_etf_with_tradability(self, etf: dict) -> dict:
        """
        Enrich an ETF object with tradability info.

        Args:
            etf: ETF dict with 'isin' key

        Returns:
            ETF dict with added tradability fields
        """
        isin = etf.get("isin")
        if not isin:
            return {**etf, "tradable_via_lynx": False, "reason_if_not_tradable": "no_isin"}

        trad_info = self.get_etf_info(isin)
        if not trad_info:
            return {**etf, "tradable_via_lynx": False, "reason_if_not_tradable": "not_checked"}

        return {
            **etf,
            "tradable_via_lynx": trad_info.get("tradable_via_lynx", False),
            "reason_if_not_tradable": trad_info.get("reason_if_not_tradable"),
            "contract": trad_info.get("contract"),
            "checked_at": trad_info.get("checked_at"),
        }


# Singleton instance
_tradability_service: Optional[TradabilityService] = None


def get_tradability_service() -> TradabilityService:
    """Get the singleton tradability service instance."""
    global _tradability_service
    if _tradability_service is None:
        _tradability_service = TradabilityService()
    return _tradability_service
