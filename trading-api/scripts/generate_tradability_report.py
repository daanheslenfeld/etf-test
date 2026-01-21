"""Generate comprehensive ETF tradability report."""
import json
import pandas as pd
from pathlib import Path
from datetime import datetime

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent

    # Load ETF database
    excel_path = project_root / 'public' / 'ETF_overzicht_met_subcategorie.xlsx'
    df = pd.read_excel(excel_path)
    df = df[df['isin'].notna() & df['isin'].str.match(r'^[A-Z]{2}[A-Z0-9]{10}$', na=False)]

    # Load tradability data
    tradability_path = script_dir.parent / 'data' / 'etf_tradability.temp.json'
    with open(tradability_path, 'r') as f:
        tradability_data = json.load(f)

    checked_etfs = tradability_data.get('etfs', {})

    print("="*100)
    print("ETF TRADABILITY REPORT - LYNX/Interactive Brokers")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*100)

    # Summary statistics
    print("\n" + "="*50)
    print("SUMMARY STATISTICS")
    print("="*50)
    print(f"Total ETFs in database: {len(df)}")
    print(f"ETFs checked: {len(checked_etfs)}")
    print(f"ETFs not yet checked: {len(df) - len(checked_etfs)}")

    tradable_count = sum(1 for e in checked_etfs.values() if e.get('tradable_via_lynx'))
    blocked_count = sum(1 for e in checked_etfs.values() if not e.get('tradable_via_lynx'))

    print(f"\nOf checked ETFs:")
    print(f"  Tradable: {tradable_count} ({tradable_count/len(checked_etfs)*100:.1f}%)")
    print(f"  Not tradable: {blocked_count} ({blocked_count/len(checked_etfs)*100:.1f}%)")

    # By category
    print("\n" + "="*50)
    print("TRADABILITY BY CATEGORY")
    print("="*50)

    category_stats = {}
    for _, row in df.iterrows():
        isin = row['isin']
        cat = row.get('categorie', 'Unknown')

        if cat not in category_stats:
            category_stats[cat] = {'total': 0, 'checked': 0, 'tradable': 0, 'blocked': 0}

        category_stats[cat]['total'] += 1

        if isin in checked_etfs:
            category_stats[cat]['checked'] += 1
            if checked_etfs[isin].get('tradable_via_lynx'):
                category_stats[cat]['tradable'] += 1
            else:
                category_stats[cat]['blocked'] += 1

    print(f"\n{'Category':<15} {'Total':<8} {'Checked':<10} {'Tradable':<12} {'Blocked':<10} {'Rate':<8}")
    print("-"*65)
    for cat, stats in sorted(category_stats.items(), key=lambda x: -x[1]['total']):
        rate = f"{stats['tradable']/stats['checked']*100:.0f}%" if stats['checked'] > 0 else "N/A"
        print(f"{cat:<15} {stats['total']:<8} {stats['checked']:<10} {stats['tradable']:<12} {stats['blocked']:<10} {rate:<8}")

    # Exchange breakdown
    print("\n" + "="*50)
    print("EXCHANGE BREAKDOWN (Tradable ETFs)")
    print("="*50)

    exchange_stats = {}
    for etf in checked_etfs.values():
        if etf.get('tradable_via_lynx') and etf.get('contract'):
            exch = etf['contract'].get('primaryExchange', 'Unknown')
            curr = etf['contract'].get('currency', 'Unknown')
            key = f"{exch} ({curr})"
            exchange_stats[key] = exchange_stats.get(key, 0) + 1

    print(f"\n{'Exchange':<25} {'Count':<10} {'Percentage':<10}")
    print("-"*45)
    for exch, count in sorted(exchange_stats.items(), key=lambda x: -x[1]):
        pct = count / tradable_count * 100 if tradable_count > 0 else 0
        print(f"{exch:<25} {count:<10} {pct:.1f}%")

    # Top issuers
    print("\n" + "="*50)
    print("TOP ETF ISSUERS (Tradable)")
    print("="*50)

    issuer_keywords = {
        'iShares': ['ishares', 'i shares'],
        'Vanguard': ['vanguard'],
        'Invesco': ['invesco'],
        'Amundi': ['amundi'],
        'Xtrackers': ['xtrackers', 'x trackers'],
        'SPDR': ['spdr'],
        'Lyxor': ['lyxor'],
        'VanEck': ['vaneck', 'van eck'],
        'WisdomTree': ['wisdomtree', 'wisdom tree'],
        'UBS': ['ubs etf'],
        'HSBC': ['hsbc'],
        'BNP Paribas': ['bnp paribas', 'bnpp'],
        'Franklin': ['franklin'],
        'JPMorgan': ['jpmorgan', 'jp morgan'],
    }

    issuer_stats = {k: 0 for k in issuer_keywords}
    issuer_stats['Other'] = 0

    for etf in checked_etfs.values():
        if etf.get('tradable_via_lynx'):
            name = etf.get('name', '').lower()
            found = False
            for issuer, keywords in issuer_keywords.items():
                if any(kw in name for kw in keywords):
                    issuer_stats[issuer] += 1
                    found = True
                    break
            if not found:
                issuer_stats['Other'] += 1

    print(f"\n{'Issuer':<20} {'Tradable Count':<15}")
    print("-"*35)
    for issuer, count in sorted(issuer_stats.items(), key=lambda x: -x[1]):
        if count > 0:
            print(f"{issuer:<20} {count:<15}")

    # Blocked ETFs detail
    print("\n" + "="*50)
    print("BLOCKED ETFs - DETAIL")
    print("="*50)

    blocked_etfs = [(isin, data) for isin, data in checked_etfs.items()
                    if not data.get('tradable_via_lynx')]

    if blocked_etfs:
        print(f"\n{'ISIN':<15} {'Name':<50} {'Reason':<30}")
        print("-"*95)
        for isin, data in blocked_etfs[:50]:  # Show first 50
            name = data.get('name', 'Unknown')[:48]
            reason = data.get('reason_if_not_tradable', 'Unknown')[:28]
            print(f"{isin:<15} {name:<50} {reason:<30}")
        if len(blocked_etfs) > 50:
            print(f"\n... and {len(blocked_etfs) - 50} more blocked ETFs")
    else:
        print("\nNo blocked ETFs found in checked set.")

    # Sample tradable ETFs by category
    print("\n" + "="*50)
    print("SAMPLE TRADABLE ETFs BY CATEGORY")
    print("="*50)

    # Group checked ETFs by category
    df_with_tradability = df.copy()
    df_with_tradability['is_tradable'] = df_with_tradability['isin'].apply(
        lambda x: checked_etfs.get(x, {}).get('tradable_via_lynx', None)
    )
    df_with_tradability['symbol'] = df_with_tradability['isin'].apply(
        lambda x: (checked_etfs.get(x, {}).get('contract') or {}).get('symbol', '')
    )
    df_with_tradability['exchange'] = df_with_tradability['isin'].apply(
        lambda x: (checked_etfs.get(x, {}).get('contract') or {}).get('primaryExchange', '')
    )
    df_with_tradability['currency'] = df_with_tradability['isin'].apply(
        lambda x: (checked_etfs.get(x, {}).get('contract') or {}).get('currency', '')
    )

    for category in df_with_tradability['categorie'].unique():
        cat_df = df_with_tradability[
            (df_with_tradability['categorie'] == category) &
            (df_with_tradability['is_tradable'] == True)
        ].head(5)

        if len(cat_df) > 0:
            print(f"\n--- {category} ---")
            print(f"{'Symbol':<10} {'ISIN':<15} {'Exchange':<12} {'Currency':<8} {'Name':<40}")
            print("-"*90)
            for _, row in cat_df.iterrows():
                name = str(row['naam'])[:38] if pd.notna(row['naam']) else 'Unknown'
                print(f"{row['symbol']:<10} {row['isin']:<15} {row['exchange']:<12} {row['currency']:<8} {name:<40}")

    # Export to CSV
    print("\n" + "="*50)
    print("EXPORTING FULL DATA TO CSV")
    print("="*50)

    export_df = df_with_tradability[['isin', 'naam', 'categorie', 'symbol', 'exchange', 'currency', 'is_tradable']].copy()
    export_df.columns = ['ISIN', 'Name', 'Category', 'Symbol', 'Exchange', 'Currency', 'Tradable']
    export_df['Tradable'] = export_df['Tradable'].map({True: 'Yes', False: 'No', None: 'Not checked'})

    csv_path = script_dir.parent / 'data' / 'etf_tradability_report.csv'
    export_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\nCSV exported to: {csv_path}")

    # JSON export with full details
    json_export = []
    for _, row in df.iterrows():
        isin = row['isin']
        etf_data = checked_etfs.get(isin, {})
        contract = etf_data.get('contract') or {}

        json_export.append({
            'isin': isin,
            'name': row.get('naam', ''),
            'category': row.get('categorie', ''),
            'subcategory': row.get('subcategorie', ''),
            'symbol': contract.get('symbol', '') if contract else '',
            'exchange': contract.get('primaryExchange', '') if contract else '',
            'currency': contract.get('currency', '') if contract else '',
            'tradable_via_lynx': etf_data.get('tradable_via_lynx', None),
            'reason_if_not_tradable': etf_data.get('reason_if_not_tradable', ''),
            'checked': isin in checked_etfs
        })

    json_path = script_dir.parent / 'data' / 'etf_tradability_report.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_export, f, indent=2, ensure_ascii=False)
    print(f"JSON exported to: {json_path}")

    print("\n" + "="*100)
    print("REPORT COMPLETE")
    print("="*100)

if __name__ == "__main__":
    main()
