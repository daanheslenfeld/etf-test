"""Generate tradableETFs.js file for the frontend from the API data."""
import json
from pathlib import Path

def main():
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'
    frontend_dir = script_dir.parent.parent / 'src' / 'data'

    # Load tradability data
    with open(data_dir / 'etf_tradability.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    etfs = data.get('etfs', {})
    tradable_etfs = {
        isin: etf for isin, etf in etfs.items()
        if etf.get('tradable_via_lynx')
    }

    print(f"Found {len(tradable_etfs)} tradable ETFs")

    # Generate JavaScript file
    js_content = '''/**
 * Tradable ETFs Registry
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: trading-api/data/etf_tradability.json
 *
 * To regenerate:
 * 1. Run: python trading-api/scripts/check_etf_tradability.py
 * 2. Run: python trading-api/scripts/generate_frontend_tradability.py
 *
 * Total tradable: ''' + str(len(tradable_etfs)) + '''
 */

// ISIN → Trading Metadata
export const TRADABLE_ETFS = {
'''

    for isin, etf in sorted(tradable_etfs.items()):
        contract = etf.get('contract', {}) or {}
        name = etf.get('name', '').replace("'", "\\'").replace('"', '\\"')[:60]
        symbol = contract.get('symbol', '')
        conid = contract.get('conId', 0)
        exchange = contract.get('primaryExchange', contract.get('exchange', ''))
        currency = contract.get('currency', 'EUR')

        js_content += f'''  '{isin}': {{
    symbol: '{symbol}',
    conid: {conid},
    exchange: '{exchange}',
    currency: '{currency}',
    name: '{name}'
  }},
'''

    js_content += '''};

/**
 * Check if an ETF is tradable via LYNX
 * @param {string} isin - The ISIN of the ETF
 * @returns {boolean} - True if tradable
 */
export function isTradable(isin) {
  return isin in TRADABLE_ETFS;
}

/**
 * Get trading info for an ETF
 * @param {string} isin - The ISIN of the ETF
 * @returns {object|null} - Trading metadata or null if not tradable
 */
export function getTradingInfo(isin) {
  return TRADABLE_ETFS[isin] || null;
}

/**
 * Get all tradable ISINs
 * @returns {string[]} - Array of tradable ISINs
 */
export function getAllTradableISINs() {
  return Object.keys(TRADABLE_ETFS);
}

/**
 * Get count of tradable ETFs
 * @returns {number} - Number of tradable ETFs
 */
export function getTradableCount() {
  return Object.keys(TRADABLE_ETFS).length;
}

/**
 * Enrich an ETF object with tradability info
 * @param {object} etf - ETF object with isin property
 * @returns {object} - ETF object with isTradableViaLynx and tradingInfo
 */
export function enrichWithTradability(etf) {
  const tradingInfo = getTradingInfo(etf.isin);
  return {
    ...etf,
    isTradableViaLynx: !!tradingInfo,
    tradingInfo: tradingInfo,
  };
}

/**
 * Validate if a portfolio is fully tradable
 * @param {array} portfolio - Array of ETF objects with isin
 * @returns {object} - { isFullyTradable, tradableCount, nonTradableItems }
 */
export function validatePortfolioTradability(portfolio) {
  const nonTradable = portfolio.filter(item => !isTradable(item.isin));
  const tradable = portfolio.filter(item => isTradable(item.isin));

  return {
    isFullyTradable: nonTradable.length === 0,
    tradableCount: tradable.length,
    totalCount: portfolio.length,
    nonTradableItems: nonTradable,
    tradableItems: tradable,
  };
}
'''

    # Write to frontend
    output_path = frontend_dir / 'tradableETFs.js'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Generated: {output_path}")
    print(f"Total tradable ETFs: {len(tradable_etfs)}")

if __name__ == "__main__":
    main()
