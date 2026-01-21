"""Check tradability for all ETF categories (bonds, commodities, crypto, real estate, money market)."""
import asyncio
import json
import sys
import os
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding for Unicode
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Python 3.10+ / 3.14+ compatibility
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
from ib_insync import IB, Stock

# Exchanges to try for each ETF
EXCHANGES = [
    ('SMART', 'EUR'),
    ('AEB', 'EUR'),
    ('IBIS2', 'EUR'),
    ('IBIS', 'EUR'),
    ('EBS', 'EUR'),
    ('BVME.ETF', 'EUR'),
    ('SBF', 'EUR'),
    ('GETTEX', 'EUR'),
    ('GETTEX2', 'EUR'),
    ('LSE', 'GBP'),
    ('LSEETF', 'GBP'),
    ('SMART', 'USD'),
    ('AEB', 'USD'),
]

async def check_etf(ib, isin, name):
    """Check if an ETF is tradable via IB."""
    for exchange, curr in EXCHANGES:
        try:
            contract = Stock(symbol='', exchange=exchange, currency=curr)
            contract.secIdType = 'ISIN'
            contract.secId = isin

            qualified = await ib.qualifyContractsAsync(contract)
            if qualified:
                c = qualified[0]
                details = await ib.reqContractDetailsAsync(c)
                if details:
                    return {
                        'tradable_via_lynx': True,
                        'reason_if_not_tradable': None,
                        'contract': {
                            'conId': c.conId,
                            'symbol': c.symbol,
                            'exchange': c.exchange,
                            'primaryExchange': details[0].contract.primaryExchange or c.exchange,
                            'currency': c.currency,
                            'secType': c.secType,
                            'localSymbol': c.localSymbol,
                            'tradingClass': details[0].contract.tradingClass
                        }
                    }
        except Exception as e:
            pass
        await asyncio.sleep(0.05)  # Small delay between exchange attempts

    return {
        'tradable_via_lynx': False,
        'reason_if_not_tradable': 'no_contract',
        'contract': None
    }

async def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    data_dir = script_dir.parent / 'data'

    # Load ETF database
    excel_path = project_root / 'public' / 'ETF_overzicht_met_subcategorie.xlsx'
    df = pd.read_excel(excel_path)
    df = df[df['isin'].notna() & df['isin'].str.match(r'^[A-Z]{2}[A-Z0-9]{10}$', na=False)]

    # Load existing tradability data
    tradability_path = data_dir / 'etf_tradability.temp.json'
    if tradability_path.exists():
        with open(tradability_path, 'r') as f:
            tradability_data = json.load(f)
    else:
        tradability_data = {'metadata': {}, 'etfs': {}}

    already_checked = set(tradability_data.get('etfs', {}).keys())

    # Filter to unchecked ETFs in non-equity categories
    categories_to_check = ['Obligaties', 'Commodities', 'Crypto ETF', 'Vastgoed', 'Money market']
    unchecked_df = df[
        (df['categorie'].isin(categories_to_check)) &
        (~df['isin'].isin(already_checked))
    ]

    print(f"\n{'='*80}")
    print("COMPREHENSIVE ETF TRADABILITY CHECK - NON-EQUITY CATEGORIES")
    print(f"{'='*80}")
    print(f"Total ETFs to check: {len(unchecked_df)}")
    print(f"Categories: {', '.join(categories_to_check)}")

    # Category breakdown
    print("\nBreakdown by category:")
    for cat in categories_to_check:
        count = len(unchecked_df[unchecked_df['categorie'] == cat])
        print(f"  {cat}: {count}")

    # Connect to IB
    ib = IB()
    try:
        print(f"\nConnecting to IB Gateway...")
        await ib.connectAsync('127.0.0.1', 4001, clientId=99, timeout=15)
        print(f"Connected! Account: {ib.managedAccounts()}")
    except Exception as e:
        print(f"Connection failed: {e}")
        print("Make sure IB Gateway is running on port 4001")
        return

    # Process ETFs
    results = {'tradable': 0, 'blocked': 0}
    start_time = datetime.now()
    total = len(unchecked_df)

    print(f"\n{'='*80}")
    print("CHECKING ETFs...")
    print(f"{'='*80}\n")

    for idx, (_, row) in enumerate(unchecked_df.iterrows()):
        isin = row['isin']
        # Clean name to remove zero-width spaces and other problematic Unicode
        name = str(row['naam'])[:50].encode('ascii', 'ignore').decode('ascii')
        category = row['categorie']

        result = await check_etf(ib, isin, name)

        # Update tradability data
        tradability_data['etfs'][isin] = {
            'isin': isin,
            'name': row['naam'],
            'input_currency': row.get('valuta', 'EUR'),
            'category': category,
            **result,
            'checked_at': datetime.now().isoformat()
        }

        if result['tradable_via_lynx']:
            results['tradable'] += 1
            symbol = result['contract']['symbol']
            exchange = result['contract']['primaryExchange']
            status = f"[OK] {symbol:8} | {exchange:12}"
        else:
            results['blocked'] += 1
            status = f"[X ] NOT FOUND"

        # Progress indicator
        pct = (idx + 1) / total * 100
        print(f"{pct:5.1f}% | {isin} | {category:12} | {status} | {name}")

        # Save progress every 50 ETFs
        if (idx + 1) % 50 == 0:
            tradability_data['metadata']['last_updated'] = datetime.now().isoformat()
            tradability_data['metadata']['total_checked'] = len(tradability_data['etfs'])
            with open(tradability_path, 'w') as f:
                json.dump(tradability_data, f, indent=2)
            print(f"\n  >> Progress saved ({idx + 1}/{total})\n")

        await asyncio.sleep(0.3)  # Rate limiting

    ib.disconnect()

    # Final save
    tradability_data['metadata'] = {
        'checked_at': datetime.now().isoformat(),
        'total_checked': len(tradability_data['etfs']),
        'total_tradable': sum(1 for e in tradability_data['etfs'].values() if e.get('tradable_via_lynx')),
        'total_blocked': sum(1 for e in tradability_data['etfs'].values() if not e.get('tradable_via_lynx')),
        'ib_port': 4001,
        'status': 'complete'
    }

    with open(tradability_path, 'w') as f:
        json.dump(tradability_data, f, indent=2)

    # Summary
    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"ETFs checked this run: {total}")
    print(f"  Tradable: {results['tradable']} ({results['tradable']/total*100:.1f}%)")
    print(f"  Blocked:  {results['blocked']} ({results['blocked']/total*100:.1f}%)")
    print(f"\nTotal in database:")
    print(f"  Checked: {tradability_data['metadata']['total_checked']}")
    print(f"  Tradable: {tradability_data['metadata']['total_tradable']}")
    print(f"  Blocked: {tradability_data['metadata']['total_blocked']}")
    print(f"\nTime elapsed: {elapsed:.0f} seconds ({elapsed/60:.1f} minutes)")
    print(f"Results saved to: {tradability_path}")
    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
