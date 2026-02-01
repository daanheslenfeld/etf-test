/**
 * Tradable Portfolio Definitions
 *
 * IMPORTANT: All ISINs in these portfolios have been verified to exist
 * in TRADABLE_ETFS and are tradable via LYNX/Interactive Brokers.
 *
 * Each portfolio defines:
 * - name: Display name (Dutch)
 * - description: Risk description (Dutch)
 * - expectedReturn: Expected annual return (decimal)
 * - stdDev: Standard deviation / volatility (decimal)
 * - holdings: Array of { isin, weight, category }
 *
 * RULES:
 * - All holdings must sum to 100%
 * - All ISINs must be verified tradable
 * - Weights should allow purchase with common investment amounts (€1000+)
 */

import { isTradable } from './tradableETFs';

// Verified tradable ETFs for portfolio construction
// All conids and exchanges verified against LYNX/IB tradableETFs registry
const VERIFIED_ETFS = {
  // Aandelen (Equity)
  IWDA: { isin: 'IE00B4L5Y983', symbol: 'IWDA', conid: 100292038, exchange: 'AEB', name: 'iShares Core MSCI World UCITS ETF', category: 'Aandelen' },
  EMIM: { isin: 'IE00BKM4GZ66', symbol: 'EMIM', conid: 153454120, exchange: 'AEB', name: 'iShares Core MSCI EM IMI UCITS ETF', category: 'Aandelen' },
  SXR8: { isin: 'IE00B5BMR087', symbol: 'SXR8', conid: 75776072, exchange: 'IBIS2', name: 'iShares Core S&P 500 UCITS ETF', category: 'Aandelen' },
  VWCE: { isin: 'IE00BK5BQT80', symbol: 'VWCE', conid: 375858281, exchange: 'IBIS2', name: 'Vanguard FTSE All-World UCITS ETF', category: 'Aandelen' },
  VUAA: { isin: 'IE00BFMXXD54', symbol: 'VUAA', conid: 399364021, exchange: 'BVME.ETF', name: 'Vanguard S&P 500 UCITS ETF', category: 'Aandelen' },

  // Obligaties (Bonds)
  EUNH: { isin: 'IE00B4WXJJ64', symbol: 'EUNH', conid: 68490077, exchange: 'IBIS2', name: 'iShares Core Euro Government Bond UCITS ETF', category: 'Obligaties' },
  IEAC: { isin: 'IE00B3F81R35', symbol: 'IEAC', conid: 60470164, exchange: 'LSEETF', name: 'iShares Core EUR Corporate Bond UCITS ETF', category: 'Obligaties' },
  VAGE: { isin: 'IE00BG47KB92', symbol: 'VAGE', conid: 371588182, exchange: 'IBIS2', name: 'Vanguard Global Aggregate Bond UCITS ETF', category: 'Obligaties' },

  // Commodities
  SGLD: { isin: 'IE00B579F325', symbol: 'SGLD', conid: 175394979, exchange: 'BVME.ETF', name: 'Invesco Physical Gold A', category: 'Commodities' },

  // Vastgoed (Real Estate)
  IWDP: { isin: 'IE00B1FZS350', symbol: 'IWDP', conid: 42492945, exchange: 'AEB', name: 'iShares Developed Markets Property Yield UCITS ETF', category: 'Vastgoed' },

  // Money Market
  XEON: { isin: 'LU0290358497', symbol: 'XEON', conid: 46041702, exchange: 'IBIS2', name: 'Xtrackers II EUR Overnight Rate Swap UCITS ETF', category: 'Money market' },
};

/**
 * Predefined portfolio allocations using verified tradable ETFs
 */
export const TRADABLE_PORTFOLIO_DEFINITIONS = {
  'bonds100': {
    name: '100% Obligaties',
    description: 'Zeer laag risico - Focus op kapitaalbehoud met stabiele inkomsten',
    expectedReturn: 0.025,
    stdDev: 0.05,
    riskLevel: 1,
    color: '#3B82F6', // blue
    holdings: [
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 50, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 30, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      { isin: VERIFIED_ETFS.XEON.isin, weight: 20, category: 'Money market', name: VERIFIED_ETFS.XEON.name },
    ]
  },

  'defensive': {
    name: 'Defensief',
    description: 'Laag risico - Stabiele groei met bescherming tegen marktschommelingen',
    expectedReturn: 0.035,
    stdDev: 0.08,
    riskLevel: 2,
    color: '#22C55E', // green
    holdings: [
      // Aandelen 25%
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      // Obligaties 55%
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 30, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 25, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      // Commodities 5%
      { isin: VERIFIED_ETFS.SGLD.isin, weight: 5, category: 'Commodities', name: VERIFIED_ETFS.SGLD.name },
      // Vastgoed 5%
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 5, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      // Money market 5%
      { isin: VERIFIED_ETFS.XEON.isin, weight: 5, category: 'Money market', name: VERIFIED_ETFS.XEON.name },
    ]
  },

  'neutral': {
    name: 'Neutraal',
    description: 'Gemiddeld risico - Balans tussen groei en stabiliteit',
    expectedReturn: 0.05,
    stdDev: 0.11,
    riskLevel: 3,
    color: '#F59E0B', // amber
    holdings: [
      // Aandelen 50%
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 30, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.SXR8.isin, weight: 5, category: 'Aandelen', name: VERIFIED_ETFS.SXR8.name },
      // Obligaties 35%
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 20, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 15, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      // Commodities 5%
      { isin: VERIFIED_ETFS.SGLD.isin, weight: 5, category: 'Commodities', name: VERIFIED_ETFS.SGLD.name },
      // Vastgoed 5%
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 5, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      // Money market 5%
      { isin: VERIFIED_ETFS.XEON.isin, weight: 5, category: 'Money market', name: VERIFIED_ETFS.XEON.name },
    ]
  },

  'offensive': {
    name: 'Offensief',
    description: 'Hoger risico - Focus op vermogensgroei met acceptabele volatiliteit',
    expectedReturn: 0.065,
    stdDev: 0.14,
    riskLevel: 4,
    color: '#EF4444', // red
    holdings: [
      // Aandelen 70%
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 40, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 20, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.SXR8.isin, weight: 10, category: 'Aandelen', name: VERIFIED_ETFS.SXR8.name },
      // Obligaties 15%
      { isin: VERIFIED_ETFS.EUNH.isin, weight: 10, category: 'Obligaties', name: VERIFIED_ETFS.EUNH.name },
      { isin: VERIFIED_ETFS.IEAC.isin, weight: 5, category: 'Obligaties', name: VERIFIED_ETFS.IEAC.name },
      // Commodities 7.5%
      { isin: VERIFIED_ETFS.SGLD.isin, weight: 7.5, category: 'Commodities', name: VERIFIED_ETFS.SGLD.name },
      // Vastgoed 5%
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 5, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
      // Money market 2.5%
      { isin: VERIFIED_ETFS.XEON.isin, weight: 2.5, category: 'Money market', name: VERIFIED_ETFS.XEON.name },
    ]
  },

  'veryOffensive': {
    name: 'Zeer Offensief',
    description: 'Hoog risico - Maximale groei voor ervaren beleggers',
    expectedReturn: 0.075,
    stdDev: 0.16,
    riskLevel: 5,
    color: '#DC2626', // dark red
    holdings: [
      // Aandelen 85%
      { isin: VERIFIED_ETFS.IWDA.isin, weight: 45, category: 'Aandelen', name: VERIFIED_ETFS.IWDA.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.SXR8.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.SXR8.name },
      // Commodities 10%
      { isin: VERIFIED_ETFS.SGLD.isin, weight: 10, category: 'Commodities', name: VERIFIED_ETFS.SGLD.name },
      // Vastgoed 5%
      { isin: VERIFIED_ETFS.IWDP.isin, weight: 5, category: 'Vastgoed', name: VERIFIED_ETFS.IWDP.name },
    ]
  },

  'stocks100': {
    name: '100% Aandelen',
    description: 'Maximaal risico - Volledige focus op aandelenrendement',
    expectedReturn: 0.08,
    stdDev: 0.18,
    riskLevel: 5,
    color: '#7C3AED', // purple
    holdings: [
      // Full equity allocation using diversified global funds
      { isin: VERIFIED_ETFS.VWCE.isin, weight: 60, category: 'Aandelen', name: VERIFIED_ETFS.VWCE.name },
      { isin: VERIFIED_ETFS.EMIM.isin, weight: 25, category: 'Aandelen', name: VERIFIED_ETFS.EMIM.name },
      { isin: VERIFIED_ETFS.VUAA.isin, weight: 15, category: 'Aandelen', name: VERIFIED_ETFS.VUAA.name },
    ]
  },
};

/**
 * Get portfolio definition by key
 */
export function getPortfolioDefinition(key) {
  return TRADABLE_PORTFOLIO_DEFINITIONS[key] || null;
}

/**
 * Get all portfolio keys
 */
export function getPortfolioKeys() {
  return Object.keys(TRADABLE_PORTFOLIO_DEFINITIONS);
}

/**
 * Validate all portfolio definitions
 * Returns array of error messages (empty if valid)
 */
export function validatePortfolioDefinitions() {
  const errors = [];

  Object.entries(TRADABLE_PORTFOLIO_DEFINITIONS).forEach(([key, portfolio]) => {
    // Check all holdings are tradable
    portfolio.holdings.forEach(holding => {
      if (!isTradable(holding.isin)) {
        errors.push(`Portfolio "${key}": ISIN ${holding.isin} (${holding.name}) is not tradable`);
      }
    });

    // Check weights sum to 100%
    const totalWeight = portfolio.holdings.reduce((sum, h) => sum + h.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(`Portfolio "${key}": weights sum to ${totalWeight.toFixed(2)}%, expected 100%`);
    }

    // Check required fields
    if (!portfolio.name) errors.push(`Portfolio "${key}": missing name`);
    if (!portfolio.description) errors.push(`Portfolio "${key}": missing description`);
    if (typeof portfolio.expectedReturn !== 'number') errors.push(`Portfolio "${key}": missing expectedReturn`);
    if (typeof portfolio.stdDev !== 'number') errors.push(`Portfolio "${key}": missing stdDev`);
  });

  return errors;
}

/**
 * Get portfolio summary for display
 */
export function getPortfolioSummary(key) {
  const portfolio = TRADABLE_PORTFOLIO_DEFINITIONS[key];
  if (!portfolio) return null;

  // Group holdings by category
  const categories = {};
  portfolio.holdings.forEach(h => {
    categories[h.category] = (categories[h.category] || 0) + h.weight;
  });

  return {
    key,
    name: portfolio.name,
    description: portfolio.description,
    expectedReturn: portfolio.expectedReturn,
    stdDev: portfolio.stdDev,
    riskLevel: portfolio.riskLevel,
    color: portfolio.color,
    holdingsCount: portfolio.holdings.length,
    categories,
  };
}

/**
 * Get all portfolio summaries for display
 */
export function getAllPortfolioSummaries() {
  return Object.keys(TRADABLE_PORTFOLIO_DEFINITIONS).map(key => getPortfolioSummary(key));
}

/**
 * Exported verified ETFs for reference
 */
export { VERIFIED_ETFS };
