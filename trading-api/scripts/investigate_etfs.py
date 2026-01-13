"""
Investigate tradable ETFs via IB Gateway.

Run with: python scripts/investigate_etfs.py
Requires: IB Gateway running on port 4001 (paper) or 7497 (TWS paper)
"""
import asyncio

# Python 3.10+ / 3.14+ compatibility for ib_insync/eventkit
class _Py310CompatEventLoopPolicy(asyncio.DefaultEventLoopPolicy):
    def get_event_loop(self):
        try:
            return super().get_event_loop()
        except RuntimeError:
            loop = self.new_event_loop()
            self.set_event_loop(loop)
            return loop

asyncio.set_event_loop_policy(_Py310CompatEventLoopPolicy())

import sys
from ib_insync import IB, Stock, Contract
from datetime import datetime

# Configuration
IB_HOST = "127.0.0.1"
IB_PORTS = [4001, 7497]  # Paper trading ports: IB Gateway, TWS
CLIENT_ID = 99  # Use different ID than main app

# Known EU UCITS ETFs to test
TEST_ETFS = [
    # Current MVP ETFs
    {"symbol": "VUSA", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "IWDA", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "CSPX", "exchange": "EBS", "currency": "USD"},
    {"symbol": "IUSA", "exchange": "AEB", "currency": "EUR"},
    # Additional popular EU ETFs to test
    {"symbol": "VWRL", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "VWCE", "exchange": "XETRA", "currency": "EUR"},
    {"symbol": "EUNL", "exchange": "XETRA", "currency": "EUR"},
    {"symbol": "IEMM", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "ISAC", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "EMIM", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "AGGH", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "IEGA", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "IGLN", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "SGLN", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "IWQU", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "SWDA", "exchange": "AEB", "currency": "EUR"},
    # Try different exchanges
    {"symbol": "VUSA", "exchange": "SMART", "currency": "EUR"},
    {"symbol": "IWDA", "exchange": "SMART", "currency": "EUR"},
    {"symbol": "VWCE", "exchange": "AEB", "currency": "EUR"},
    {"symbol": "VWCE", "exchange": "SMART", "currency": "EUR"},
]


async def investigate_etfs():
    ib = IB()

    print("=" * 70)
    print("ETF TRADABILITY INVESTIGATION")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 70)

    # Try connecting to multiple ports
    connected = False
    connected_port = None
    for port in IB_PORTS:
        try:
            print(f"\nTrying to connect to {IB_HOST}:{port}...")
            await ib.connectAsync(IB_HOST, port, clientId=CLIENT_ID, timeout=5)
            print(f"[OK] Connected to IB Gateway at {IB_HOST}:{port}")
            connected = True
            connected_port = port
            break
        except Exception as e:
            print(f"[FAIL] Port {port}: {type(e).__name__}")
            continue

    if not connected:
        print("\n[ERROR] Could not connect to IB Gateway/TWS")
        print("Make sure IB Gateway or TWS is running with API enabled:")
        print("  - IB Gateway paper: port 4001")
        print("  - TWS paper: port 7497")
        return

    # Get account info
    accounts = ib.managedAccounts()
    print(f"[OK] Account(s): {accounts}")

    # Results storage
    tradable = []
    not_tradable = []
    errors = []

    print("\n" + "-" * 70)
    print("TESTING ETF CONTRACTS")
    print("-" * 70)

    for etf in TEST_ETFS:
        symbol = etf["symbol"]
        exchange = etf["exchange"]
        currency = etf["currency"]

        # Create contract
        contract = Stock(symbol, exchange, currency)

        try:
            # Qualify contract (get full details from IB)
            qualified = await ib.qualifyContractsAsync(contract)

            if qualified:
                q = qualified[0]
                result = {
                    "symbol": q.symbol,
                    "exchange": q.exchange,
                    "primaryExchange": q.primaryExchange,
                    "currency": q.currency,
                    "conId": q.conId,
                    "tradingClass": q.tradingClass,
                    "secType": q.secType,
                    "localSymbol": q.localSymbol,
                }
                tradable.append(result)
                print(f"[OK] {symbol:6} | {exchange:6} | {currency} | conId={q.conId} | class={q.tradingClass}")
            else:
                not_tradable.append({"symbol": symbol, "exchange": exchange, "currency": currency, "reason": "Not qualified"})
                print(f"[X] {symbol:6} | {exchange:6} | {currency} | NOT QUALIFIED")

        except Exception as e:
            errors.append({"symbol": symbol, "exchange": exchange, "currency": currency, "error": str(e)})
            print(f"[X] {symbol:6} | {exchange:6} | {currency} | ERROR: {e}")

    # Search for ETFs by scanning
    print("\n" + "-" * 70)
    print("SEARCHING FOR ETF CONTRACTS BY SYMBOL PATTERN")
    print("-" * 70)

    # Try contract search for popular ETF symbols
    search_symbols = ["VT", "VTI", "VOO", "SPY", "QQQ", "IVV", "VEA", "VWO", "BND", "AGG"]

    for sym in search_symbols:
        try:
            matches = await ib.reqMatchingSymbolsAsync(sym)
            if matches:
                for m in matches[:3]:  # Top 3 matches
                    c = m.contract
                    print(f"  Found: {c.symbol:6} | {c.secType:4} | {c.exchange:6} | {c.currency} | conId={c.conId}")
        except Exception as e:
            print(f"  Search '{sym}' failed: {e}")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"\nTradable ETFs found: {len(tradable)}")
    print(f"Not tradable: {len(not_tradable)}")
    print(f"Errors: {len(errors)}")

    if tradable:
        print("\n--- TRADABLE ETFs ---")
        for t in tradable:
            print(f"  {t['symbol']:6} | conId={t['conId']:10} | {t['exchange']:6} | {t['primaryExchange']:6} | {t['currency']} | class={t['tradingClass']}")

    if not_tradable:
        print("\n--- NOT TRADABLE ---")
        for nt in not_tradable:
            print(f"  {nt['symbol']:6} | {nt['exchange']:6} | {nt['currency']} | {nt['reason']}")

    if errors:
        print("\n--- ERRORS ---")
        for e in errors:
            print(f"  {e['symbol']:6} | {e['exchange']:6} | {e['error']}")

    # Check account trading permissions
    print("\n" + "-" * 70)
    print("ACCOUNT TRADING PERMISSIONS CHECK")
    print("-" * 70)

    # Request account summary
    try:
        summary = ib.accountSummary()
        if summary:
            for s in summary[:10]:
                print(f"  {s.tag}: {s.value}")
    except Exception as e:
        print(f"  Could not get account summary: {e}")

    # Disconnect
    ib.disconnect()
    print(f"\n[OK] Disconnected from IB Gateway")
    print(f"Finished: {datetime.now().isoformat()}")


if __name__ == "__main__":
    asyncio.run(investigate_etfs())
