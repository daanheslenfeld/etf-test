"""
ETF Tradability Checker for LYNX/IB Account.

Checks which ETFs from the database are actually tradable via IB Gateway.
Results are persisted to avoid repeated IB API calls.

For each ETF:
1. Builds IB contract using ISIN (preferred)
2. Calls reqContractDetails to verify contract exists
3. Checks trading permissions and regulatory restrictions
4. Classifies reason if not tradable

Run: python scripts/check_etf_tradability.py [--port 4001] [--batch-size 50]
"""
import asyncio
import json
import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional
import time

# Python 3.10+ compatibility
class _Py310CompatEventLoopPolicy(asyncio.DefaultEventLoopPolicy):
    def get_event_loop(self):
        try:
            return super().get_event_loop()
        except RuntimeError:
            loop = self.new_event_loop()
            self.set_event_loop(loop)
            return loop

asyncio.set_event_loop_policy(_Py310CompatEventLoopPolicy())

import pandas as pd
from ib_insync import IB, Stock, Contract

# Configuration
IB_HOST = "127.0.0.1"
DEFAULT_PORT = 4001  # Paper trading port
CLIENT_ID = 98  # Different from main app (1) and investigate script (99)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
ETF_EXCEL_PATH = PROJECT_ROOT / "public" / "ETF_overzicht_met_subcategorie.xlsx"
OUTPUT_PATH = SCRIPT_DIR.parent / "data" / "etf_tradability.json"

# Rate limiting
REQUESTS_PER_SECOND = 3  # Be conservative with IB API
DELAY_BETWEEN_BATCHES = 3  # seconds
DELAY_BETWEEN_REQUESTS = 0.5  # seconds

# Reason codes for non-tradable ETFs
REASON_NO_CONTRACT = "no_contract"
REASON_NO_PERMISSION = "no_trading_permission"
REASON_REGULATORY = "regulatory_restriction"
REASON_UNKNOWN = "unknown"


class TradabilityChecker:
    """Checks ETF tradability against IB Gateway."""

    def __init__(self, port: int = DEFAULT_PORT):
        self.ib = IB()
        self.port = port
        self.account = None
        self.results = {
            "metadata": {
                "checked_at": None,
                "total_checked": 0,
                "total_tradable": 0,
                "total_blocked": 0,
                "ib_port": port,
                "account": None,
            },
            "etfs": {}
        }
        # Track IB error messages for permission detection
        self._last_error_code = None
        self._last_error_msg = None

    def _on_error(self, reqId: int, errorCode: int, errorString: str, contract=None):
        """Capture IB error messages for permission detection."""
        self._last_error_code = errorCode
        self._last_error_msg = errorString
        # Don't log info messages
        if errorCode not in {2104, 2106, 2158, 2119}:
            if errorCode in {200, 321, 354}:  # Contract/permission related
                pass  # We handle these in check_single_etf
            else:
                print(f"      [IB Error {errorCode}]: {errorString}")

    async def connect(self) -> bool:
        """Connect to IB Gateway."""
        try:
            print(f"Connecting to IB Gateway at {IB_HOST}:{self.port}...")
            await self.ib.connectAsync(IB_HOST, self.port, clientId=CLIENT_ID, timeout=15)

            # Set up error handler
            self.ib.errorEvent += self._on_error

            accounts = self.ib.managedAccounts()
            self.account = accounts[0] if accounts else None
            self.results["metadata"]["account"] = self.account

            print(f"[OK] Connected. Account: {accounts}")
            return True
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}")
            return False

    def disconnect(self):
        """Disconnect from IB Gateway."""
        if self.ib.isConnected():
            self.ib.errorEvent -= self._on_error
            self.ib.disconnect()
            print("[OK] Disconnected from IB Gateway")

    def load_etf_database(self) -> pd.DataFrame:
        """Load ETFs from Excel database."""
        print(f"Loading ETFs from {ETF_EXCEL_PATH}...")

        df = pd.read_excel(ETF_EXCEL_PATH)

        # Filter valid ETFs (must have ISIN)
        df = df[df['isin'].notna() & (df['isin'] != '')]
        df = df[df['isin'].str.match(r'^[A-Z]{2}[A-Z0-9]{10}$', na=False)]

        # Extract relevant columns
        etfs = df[['isin', 'naam', 'fund ccy', 'categorie', 'subcategorie']].copy()
        etfs.columns = ['isin', 'name', 'currency', 'category', 'subcategory']

        # Clean up
        etfs = etfs.drop_duplicates(subset=['isin'])
        etfs = etfs.reset_index(drop=True)

        print(f"[OK] Found {len(etfs)} unique ETFs with valid ISINs")
        return etfs

    async def check_single_etf(self, isin: str, name: str, currency: str) -> dict:
        """
        Check tradability of a single ETF.

        Steps:
        1. Try to find contract using ISIN with different exchanges
        2. Request full contract details to verify it's valid
        3. Check for regulatory restrictions (error codes 354, 10197)
        4. Classify reason if not tradable
        """
        result = {
            "isin": isin,
            "name": name,
            "input_currency": currency,
            "tradable_via_lynx": False,
            "reason_if_not_tradable": None,
            "contract": None,
            "checked_at": datetime.now().isoformat(),
        }

        # Reset error tracking
        self._last_error_code = None
        self._last_error_msg = None

        # Preferred exchanges to try (EU-focused for UCITS ETFs)
        exchanges_to_try = [
            ("SMART", "EUR"),
            ("AEB", "EUR"),      # Euronext Amsterdam
            ("IBIS", "EUR"),     # Xetra
            ("IBIS2", "EUR"),    # Xetra 2
            ("EBS", "EUR"),      # SIX Swiss Exchange
            ("BVME.ETF", "EUR"), # Borsa Italiana ETF
            ("LSE", "GBP"),      # London Stock Exchange
            ("SMART", "USD"),
            ("AEB", "USD"),
        ]

        found_contract = None

        for exchange, curr in exchanges_to_try:
            try:
                # Create contract with ISIN (preferred method for EU ETFs)
                contract = Stock(
                    symbol="",
                    exchange=exchange,
                    currency=curr
                )
                contract.secIdType = "ISIN"
                contract.secId = isin

                # Try to qualify the contract
                qualified = await self.ib.qualifyContractsAsync(contract)

                if qualified and len(qualified) > 0:
                    found_contract = qualified[0]
                    break

            except Exception:
                continue

            # Small delay between exchange attempts
            await asyncio.sleep(0.1)

        if not found_contract:
            result["reason_if_not_tradable"] = REASON_NO_CONTRACT
            return result

        # We found a contract, now verify it's actually tradable
        # by requesting contract details (this also checks permissions)
        try:
            self._last_error_code = None

            # Request contract details - this triggers permission checks
            details = await self.ib.reqContractDetailsAsync(found_contract)

            if not details:
                # No details returned - likely no permission
                if self._last_error_code in {200, 321}:
                    result["reason_if_not_tradable"] = REASON_NO_CONTRACT
                elif self._last_error_code in {354, 10197}:
                    result["reason_if_not_tradable"] = REASON_REGULATORY
                elif self._last_error_code in {162}:
                    result["reason_if_not_tradable"] = REASON_NO_PERMISSION
                else:
                    result["reason_if_not_tradable"] = REASON_NO_PERMISSION
                return result

            # Contract details received - ETF is tradable
            d = details[0]
            result["tradable_via_lynx"] = True
            result["contract"] = {
                "conId": d.contract.conId,
                "symbol": d.contract.symbol,
                "exchange": d.contract.exchange,
                "primaryExchange": d.contract.primaryExchange,
                "currency": d.contract.currency,
                "secType": d.contract.secType,
                "localSymbol": d.contract.localSymbol,
                "tradingClass": d.contract.tradingClass,
            }

            # Check for any trading restrictions in contract details
            # Some ETFs show in contract details but have trading restrictions
            if hasattr(d, 'tradingHours') and not d.tradingHours:
                result["tradable_via_lynx"] = False
                result["reason_if_not_tradable"] = REASON_REGULATORY
                result["contract"] = None

        except Exception as e:
            err_str = str(e).lower()
            if "permission" in err_str or "not allowed" in err_str:
                result["reason_if_not_tradable"] = REASON_NO_PERMISSION
            elif "regulatory" in err_str or "mifid" in err_str or "priips" in err_str:
                result["reason_if_not_tradable"] = REASON_REGULATORY
            else:
                result["reason_if_not_tradable"] = REASON_UNKNOWN

        return result

    async def check_batch(self, etfs: list[dict], batch_num: int, total_batches: int) -> list[dict]:
        """Check a batch of ETFs with rate limiting."""
        results = []
        batch_start = time.time()
        tradable_count = 0

        print(f"\n--- Batch {batch_num}/{total_batches} ({len(etfs)} ETFs) ---")

        for i, etf in enumerate(etfs):
            isin = etf['isin']
            name = etf.get('name', 'Unknown')
            currency = etf.get('currency', 'EUR')

            result = await self.check_single_etf(isin, name, currency)
            results.append(result)

            # Progress indicator
            if result['tradable_via_lynx']:
                status = "OK"
                tradable_count += 1
                symbol = result['contract']['symbol']
                exchange = result['contract']['primaryExchange'] or result['contract']['exchange']
                print(f"  [{status}] {isin} | {symbol:8} | {exchange:10} | {name[:35]}")
            else:
                status = "X "
                reason = result.get('reason_if_not_tradable', 'unknown')[:15]
                print(f"  [{status}] {isin} | {reason:17} | {name[:35]}")

            # Rate limiting within batch
            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

        batch_time = time.time() - batch_start
        print(f"  Batch: {tradable_count}/{len(etfs)} tradable ({batch_time:.1f}s)")

        return results

    async def check_all_etfs(self, batch_size: int = 50, limit: Optional[int] = None, resume_from: Optional[str] = None):
        """
        Check tradability of all ETFs in the database.

        Args:
            batch_size: Number of ETFs per batch
            limit: Limit total ETFs to check (for testing)
            resume_from: ISIN to resume from (skip already checked)
        """
        # Load ETF database
        etfs_df = self.load_etf_database()

        # Resume support: skip ETFs we already checked
        if resume_from:
            idx = etfs_df[etfs_df['isin'] == resume_from].index
            if len(idx) > 0:
                etfs_df = etfs_df.iloc[idx[0]:]
                print(f"[INFO] Resuming from ISIN: {resume_from} ({len(etfs_df)} remaining)")

        if limit:
            etfs_df = etfs_df.head(limit)
            print(f"[INFO] Limited to {limit} ETFs")

        etfs_list = etfs_df.to_dict('records')
        total = len(etfs_list)

        print(f"[INFO] Will check {total} ETFs")

        # Connect to IB
        if not await self.connect():
            return

        try:
            # Process in batches
            total_batches = (total + batch_size - 1) // batch_size
            all_results = []

            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min(start_idx + batch_size, total)
                batch = etfs_list[start_idx:end_idx]

                results = await self.check_batch(batch, batch_num + 1, total_batches)
                all_results.extend(results)

                # Save intermediate results (for recovery)
                if batch_num > 0 and batch_num % 5 == 0:
                    self._save_intermediate(all_results)

                # Delay between batches to avoid overwhelming IB
                if batch_num < total_batches - 1:
                    print(f"  Waiting {DELAY_BETWEEN_BATCHES}s before next batch...")
                    await asyncio.sleep(DELAY_BETWEEN_BATCHES)

            # Compile final results
            self.compile_results(all_results)

        finally:
            self.disconnect()

    def _save_intermediate(self, results: list[dict]):
        """Save intermediate results for recovery."""
        temp_path = OUTPUT_PATH.with_suffix('.temp.json')
        tradable = [r for r in results if r['tradable_via_lynx']]
        blocked = [r for r in results if not r['tradable_via_lynx']]

        temp_data = {
            "metadata": {
                "checked_at": datetime.now().isoformat(),
                "total_checked": len(results),
                "total_tradable": len(tradable),
                "total_blocked": len(blocked),
                "ib_port": self.port,
                "status": "in_progress",
            },
            "etfs": {r["isin"]: r for r in results}
        }
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(temp_data, f, indent=2, ensure_ascii=False)
        print(f"  [Checkpoint] Saved {len(results)} results")

    def compile_results(self, results: list[dict]):
        """Compile and save results."""
        tradable = [r for r in results if r['tradable_via_lynx']]
        blocked = [r for r in results if not r['tradable_via_lynx']]

        # Count by reason
        reasons = {}
        for b in blocked:
            reason = b.get('reason_if_not_tradable', REASON_UNKNOWN)
            reasons[reason] = reasons.get(reason, 0) + 1

        self.results["metadata"]["checked_at"] = datetime.now().isoformat()
        self.results["metadata"]["total_checked"] = len(results)
        self.results["metadata"]["total_tradable"] = len(tradable)
        self.results["metadata"]["total_blocked"] = len(blocked)
        self.results["metadata"]["blocked_by_reason"] = reasons

        # Store by ISIN for fast lookup
        for r in results:
            self.results["etfs"][r["isin"]] = r

        # Save to file
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)

        print(f"\n{'='*70}")
        print("TRADABILITY CHECK SUMMARY")
        print(f"{'='*70}")
        print(f"Account:             {self.account}")
        print(f"IB Gateway Port:     {self.port}")
        print(f"{'='*70}")
        print(f"Total ETFs checked:  {len(results)}")
        print(f"Total TRADABLE:      {len(tradable)}")
        print(f"Total BLOCKED:       {len(blocked)}")
        print(f"{'='*70}")

        # Show breakdown by reason
        if reasons:
            print(f"\nBLOCKED BY REASON:")
            reason_labels = {
                REASON_NO_CONTRACT: "No contract found",
                REASON_NO_PERMISSION: "No trading permission",
                REASON_REGULATORY: "Regulatory restriction (PRIIPs/MiFID)",
                REASON_UNKNOWN: "Unknown reason",
            }
            for reason, count in sorted(reasons.items(), key=lambda x: -x[1]):
                label = reason_labels.get(reason, reason)
                pct = count / len(blocked) * 100 if blocked else 0
                print(f"  {label}: {count} ({pct:.1f}%)")

        # Show top tradable ETFs
        if tradable:
            print(f"\n--- TOP 20 TRADABLE ETFs ---")
            for t in tradable[:20]:
                c = t['contract']
                primary = c.get('primaryExchange') or c.get('exchange', '')
                print(f"  {t['isin']} | {c['symbol']:8} | {primary:10} | {c['currency']} | {t['name'][:30]}")

        print(f"\n{'='*70}")
        print(f"Results saved to: {OUTPUT_PATH}")
        print(f"{'='*70}")


async def main():
    parser = argparse.ArgumentParser(description="Check ETF tradability via IB Gateway")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"IB Gateway port (default: {DEFAULT_PORT})")
    parser.add_argument("--batch-size", type=int, default=25, help="Batch size (default: 25)")
    parser.add_argument("--limit", type=int, help="Limit number of ETFs to check (for testing)")
    parser.add_argument("--resume-from", type=str, help="ISIN to resume from (skip already checked)")
    args = parser.parse_args()

    print("="*70)
    print("ETF TRADABILITY CHECKER FOR LYNX/IB")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Port: {args.port} ({'LIVE' if args.port == 4001 else 'PAPER' if args.port == 4002 else 'CUSTOM'})")
    print("="*70)

    checker = TradabilityChecker(port=args.port)
    await checker.check_all_etfs(
        batch_size=args.batch_size,
        limit=args.limit,
        resume_from=args.resume_from
    )

    print(f"\nFinished: {datetime.now().isoformat()}")


if __name__ == "__main__":
    asyncio.run(main())
