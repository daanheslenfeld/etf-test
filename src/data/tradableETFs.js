/**
 * Tradable ETFs Registry
 *
 * Single source of truth for ETF tradability via LYNX/Interactive Brokers.
 * Maps ISIN to trading metadata (symbol, conid, exchange, currency).
 *
 * This registry must stay in sync with trading-api/services/ib_client.py MVP_ETFS
 */

// ISIN → Trading Metadata
export const TRADABLE_ETFS = {
  // Vanguard S&P 500 UCITS ETF (USD) Distributing
  'IE00B3XXRP09': {
    symbol: 'VUSA',
    conid: 128884495,
    exchange: 'AEB',
    currency: 'EUR',
    name: 'Vanguard S&P 500 UCITS ETF'
  },
  // iShares Core MSCI World UCITS ETF USD (Acc)
  'IE00B4L5Y983': {
    symbol: 'IWDA',
    conid: 100292038,
    exchange: 'AEB',
    currency: 'EUR',
    name: 'iShares Core MSCI World UCITS ETF'
  },
  // iShares Core S&P 500 UCITS ETF USD (Acc)
  'IE00B5BMR087': {
    symbol: 'CSPX',
    conid: 76023663,
    exchange: 'EBS',
    currency: 'USD',
    name: 'iShares Core S&P 500 UCITS ETF'
  },
  // iShares S&P 500 UCITS ETF (Dist)
  'IE0031442068': {
    symbol: 'IUSA',
    conid: 29651319,
    exchange: 'AEB',
    currency: 'EUR',
    name: 'iShares S&P 500 UCITS ETF'
  },
};

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
