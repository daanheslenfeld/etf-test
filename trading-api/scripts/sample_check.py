"""Quick sample check of non-equity ETF categories."""
import asyncio
import sys
from pathlib import Path

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

async def check_etf(ib, isin, name):
    """Check if an ETF is tradable."""
    exchanges = [
        ('SMART', 'EUR'),
        ('AEB', 'EUR'),
        ('IBIS2', 'EUR'),
        ('IBIS', 'EUR'),
        ('EBS', 'EUR'),
        ('BVME.ETF', 'EUR'),
        ('LSE', 'GBP'),
        ('SMART', 'USD'),
    ]

    for exchange, curr in exchanges:
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
                        'status': 'TRADABLE',
                        'symbol': c.symbol,
                        'exchange': details[0].contract.primaryExchange or c.exchange,
                        'currency': c.currency,
                    }
        except:
            continue
        await asyncio.sleep(0.1)

    return {'status': 'NOT_FOUND', 'symbol': None, 'exchange': None, 'currency': None}

async def main():
    # Load ETF database
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    excel_path = project_root / 'public' / 'ETF_overzicht_met_subcategorie.xlsx'

    df = pd.read_excel(excel_path)
    df = df[df['isin'].notna() & df['isin'].str.match(r'^[A-Z]{2}[A-Z0-9]{10}$', na=False)]

    # Connect to IB
    ib = IB()
    try:
        print("Connecting to IB Gateway...")
        await ib.connectAsync('127.0.0.1', 4001, clientId=97, timeout=15)
        print(f'Connected! Account: {ib.managedAccounts()}')
    except Exception as e:
        print(f'Connection failed: {e}')
        return

    # Sample ETFs from each category
    categories_to_check = {
        'Obligaties': 10,
        'Commodities': 10,
        'Crypto ETF': 5,
        'Vastgoed': 5,
        'Money market': 5,
    }

    results_summary = {}

    print('\n' + '='*70)
    print('SAMPLE TRADABILITY CHECK - NON-EQUITY ETF CATEGORIES')
    print('='*70)

    for category, count in categories_to_check.items():
        cat_df = df[df['categorie'] == category].head(count)
        print(f'\n--- {category} ({count} samples) ---')

        tradable = 0
        for _, row in cat_df.iterrows():
            isin = row['isin']
            name = str(row['naam'])[:40]

            result = await check_etf(ib, isin, name)

            if result['status'] == 'TRADABLE':
                tradable += 1
                print(f"  [OK] {isin} | {result['symbol']:8} | {result['exchange']:10} | {name}")
            else:
                print(f"  [X ] {isin} | NOT FOUND | {name}")

            await asyncio.sleep(0.5)

        results_summary[category] = {'tradable': tradable, 'total': count}
        print(f'  >> {tradable}/{count} tradable')

    ib.disconnect()

    print('\n' + '='*70)
    print('SUMMARY')
    print('='*70)
    for cat, res in results_summary.items():
        pct = res['tradable'] / res['total'] * 100
        print(f"  {cat}: {res['tradable']}/{res['total']} ({pct:.0f}%)")
    print('\nDone!')

if __name__ == "__main__":
    asyncio.run(main())
