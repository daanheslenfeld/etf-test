/**
 * Portfolio Utility Functions
 *
 * Pure utility functions for portfolio calculations, bulk buy logic,
 * and order basket operations.
 */

import { getTradingInfo } from '../data/tradableETFs';
import { getPortfolioDefinition } from '../data/tradablePortfolioDefinitions';
import { getModelPortfolio } from '../data/modelPortfolioDefinitions';

/**
 * Get market price for a symbol
 * Prefers last price, falls back to ask (for buy orders)
 *
 * @param {string} symbol - ETF symbol
 * @param {Object} marketData - Market data object keyed by symbol
 * @returns {number|null} - Price or null if not available
 */
export function getMarketPrice(symbol, marketData) {
  const data = marketData?.[symbol];
  if (!data) return null;

  // Prefer last price, then ask (for buys), then bid
  return data.last || data.ask || data.bid || null;
}

/**
 * Calculate bulk buy orders for a portfolio
 *
 * This function takes a portfolio definition and investment parameters,
 * then calculates the exact number of units to buy for each ETF.
 *
 * Rules:
 * - Units must be whole numbers (floor)
 * - Total cost must not exceed available cash
 * - ETFs with 0 units are skipped
 * - ETFs without price data are skipped
 *
 * @param {string} portfolioKey - Key from TRADABLE_PORTFOLIO_DEFINITIONS or MODEL_PORTFOLIOS
 * @param {number} investmentAmount - Total amount to invest in EUR
 * @param {Object} marketData - Current market data { [symbol]: { last, bid, ask } }
 * @param {number} availableCash - Available funds from broker account
 * @returns {Object} - { orders, totalCost, skippedETFs, remainingCash, portfolioKey, investmentAmount }
 */
export function calculateBulkBuyOrders(portfolioKey, investmentAmount, marketData, availableCash) {
  // Try to get portfolio from old definitions first, then from new model portfolios
  let portfolio = getPortfolioDefinition(portfolioKey);
  if (!portfolio) {
    portfolio = getModelPortfolio(portfolioKey);
  }

  if (!portfolio) {
    return {
      orders: [],
      totalCost: 0,
      skippedETFs: [],
      remainingCash: availableCash,
      portfolioKey,
      investmentAmount,
      error: `Unknown portfolio: ${portfolioKey}`
    };
  }

  const orders = [];
  const skippedETFs = [];
  let totalCost = 0;

  // First pass: calculate orders based on target weights
  for (const holding of portfolio.holdings) {
    const tradingInfo = getTradingInfo(holding.isin);

    // Skip if not tradable
    if (!tradingInfo) {
      skippedETFs.push({
        isin: holding.isin,
        name: holding.name,
        category: holding.category,
        weight: holding.weight,
        reason: 'NOT_TRADABLE',
        allocatedAmount: (holding.weight / 100) * investmentAmount
      });
      continue;
    }

    // Get current price
    const price = getMarketPrice(tradingInfo.symbol, marketData);

    if (!price || price <= 0) {
      skippedETFs.push({
        isin: holding.isin,
        name: holding.name,
        symbol: tradingInfo.symbol,
        category: holding.category,
        weight: holding.weight,
        reason: 'NO_PRICE_DATA',
        allocatedAmount: (holding.weight / 100) * investmentAmount
      });
      continue;
    }

    // Calculate allocated amount and units
    const allocatedAmount = (holding.weight / 100) * investmentAmount;
    const units = Math.floor(allocatedAmount / price);

    // Skip if units would be 0
    if (units === 0) {
      skippedETFs.push({
        isin: holding.isin,
        name: holding.name,
        symbol: tradingInfo.symbol,
        category: holding.category,
        weight: holding.weight,
        reason: 'ZERO_UNITS',
        allocatedAmount,
        price,
        minRequired: price
      });
      continue;
    }

    const actualCost = units * price;

    orders.push({
      isin: holding.isin,
      symbol: tradingInfo.symbol,
      conid: tradingInfo.conid,
      exchange: tradingInfo.exchange,
      name: tradingInfo.name,
      category: holding.category,
      targetWeight: holding.weight,
      allocatedAmount,
      price,
      units,
      actualCost,
      actualWeight: 0 // Calculated after total is known
    });

    totalCost += actualCost;
  }

  // Calculate actual weights based on total cost
  if (totalCost > 0) {
    orders.forEach(order => {
      order.actualWeight = (order.actualCost / totalCost) * 100;
    });
  }

  // Validate against available cash (with 1% buffer for fees)
  const requiredWithBuffer = totalCost * 1.01;
  const effectiveAvailable = Math.min(availableCash, investmentAmount);

  if (requiredWithBuffer > effectiveAvailable && orders.length > 0) {
    // Scale down all orders proportionally
    const scaleFactor = effectiveAvailable / requiredWithBuffer;
    return scaleDownOrders(orders, scaleFactor, marketData, skippedETFs, portfolioKey, investmentAmount, availableCash);
  }

  return {
    orders,
    totalCost,
    skippedETFs,
    remainingCash: availableCash - totalCost,
    portfolioKey,
    investmentAmount,
    availableCash,
    portfolio: {
      name: portfolio.name,
      description: portfolio.description,
      expectedReturn: portfolio.expectedReturn,
      riskLevel: portfolio.riskLevel
    }
  };
}

/**
 * Scale down orders when insufficient funds
 * Proportionally reduces all orders and recalculates units
 *
 * @private
 */
function scaleDownOrders(orders, scaleFactor, marketData, existingSkipped, portfolioKey, investmentAmount, availableCash) {
  const scaledOrders = [];
  const skippedETFs = [...existingSkipped];
  let totalCost = 0;

  for (const order of orders) {
    const scaledAmount = order.allocatedAmount * scaleFactor;
    const units = Math.floor(scaledAmount / order.price);

    if (units === 0) {
      skippedETFs.push({
        isin: order.isin,
        name: order.name,
        symbol: order.symbol,
        category: order.category,
        weight: order.targetWeight,
        reason: 'INSUFFICIENT_FUNDS',
        allocatedAmount: order.allocatedAmount,
        scaledAmount,
        price: order.price
      });
      continue;
    }

    const actualCost = units * order.price;
    scaledOrders.push({
      ...order,
      allocatedAmount: scaledAmount,
      units,
      actualCost
    });
    totalCost += actualCost;
  }

  // Recalculate actual weights
  if (totalCost > 0) {
    scaledOrders.forEach(order => {
      order.actualWeight = (order.actualCost / totalCost) * 100;
    });
  }

  // Try both portfolio sources
  let portfolio = getPortfolioDefinition(portfolioKey);
  if (!portfolio) {
    portfolio = getModelPortfolio(portfolioKey);
  }

  return {
    orders: scaledOrders,
    totalCost,
    skippedETFs,
    remainingCash: availableCash - totalCost,
    portfolioKey,
    investmentAmount,
    availableCash,
    scaledDown: true,
    scaleFactor,
    portfolio: portfolio ? {
      name: portfolio.name,
      description: portfolio.description,
      expectedReturn: portfolio.expectedReturn,
      riskLevel: portfolio.riskLevel
    } : null
  };
}

/**
 * Convert bulk calculation orders to order basket format
 *
 * @param {Array} orders - Orders from calculateBulkBuyOrders
 * @returns {Array} - Orders formatted for addToBasket / addMultipleToBasket
 */
export function bulkOrdersToBasket(orders) {
  return orders.map(order => ({
    symbol: order.symbol,
    conid: order.conid,
    side: 'BUY',
    quantity: order.units,
    orderType: 'MKT',
    // Extended metadata for display
    isin: order.isin,
    name: order.name,
    category: order.category,
    exchange: order.exchange,
    estimatedPrice: order.price,
    estimatedValue: order.actualCost,
    targetWeight: order.targetWeight,
    actualWeight: order.actualWeight
  }));
}

/**
 * Calculate total estimated cost from orders
 *
 * @param {Array} orders - Array of order objects with quantity and estimatedPrice
 * @returns {number} - Total estimated cost
 */
export function calculateTotalCost(orders) {
  return orders.reduce((total, order) => {
    const price = order.estimatedPrice || order.price || 0;
    const quantity = order.quantity || order.units || 0;
    return total + (price * quantity);
  }, 0);
}

/**
 * Validate if a bulk buy can proceed
 *
 * @param {Object} calculation - Result from calculateBulkBuyOrders
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateBulkBuy(calculation) {
  const errors = [];
  const warnings = [];

  if (!calculation) {
    errors.push('Geen berekening beschikbaar');
    return { valid: false, errors, warnings };
  }

  if (calculation.error) {
    errors.push(calculation.error);
    return { valid: false, errors, warnings };
  }

  if (!calculation.orders || calculation.orders.length === 0) {
    errors.push('Geen orders om uit te voeren');
    return { valid: false, errors, warnings };
  }

  if (calculation.totalCost <= 0) {
    errors.push('Totale kosten moeten groter zijn dan 0');
    return { valid: false, errors, warnings };
  }

  // Warnings
  if (calculation.skippedETFs && calculation.skippedETFs.length > 0) {
    const skippedNames = calculation.skippedETFs.map(s => s.name || s.symbol).join(', ');
    warnings.push(`${calculation.skippedETFs.length} ETF(s) overgeslagen: ${skippedNames}`);
  }

  if (calculation.scaledDown) {
    warnings.push(`Orders aangepast vanwege beschikbaar saldo (${Math.round(calculation.scaleFactor * 100)}% van origineel)`);
  }

  return { valid: true, errors, warnings };
}

/**
 * Format currency for display
 *
 * @param {number} amount - Amount in EUR
 * @returns {string} - Formatted string like "€1.234,56"
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '€-';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage for display
 *
 * @param {number} value - Decimal or percentage value
 * @param {boolean} isDecimal - If true, multiplies by 100
 * @returns {string} - Formatted string like "12,5%"
 */
export function formatPercentage(value, isDecimal = false) {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  const pct = isDecimal ? value * 100 : value;
  return `${pct.toFixed(1).replace('.', ',')}%`;
}

/**
 * Group orders by category for display
 *
 * @param {Array} orders - Array of order objects with category
 * @returns {Object} - { [category]: Order[] }
 */
export function groupOrdersByCategory(orders) {
  const groups = {};
  orders.forEach(order => {
    const cat = order.category || 'Overig';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(order);
  });
  return groups;
}

/**
 * Calculate category totals from orders
 *
 * @param {Array} orders - Array of order objects
 * @returns {Object} - { [category]: { weight, cost, count } }
 */
export function calculateCategoryTotals(orders) {
  const totals = {};
  orders.forEach(order => {
    const cat = order.category || 'Overig';
    if (!totals[cat]) {
      totals[cat] = { weight: 0, cost: 0, count: 0 };
    }
    totals[cat].weight += order.actualWeight || order.targetWeight || 0;
    totals[cat].cost += order.actualCost || (order.units * order.price) || 0;
    totals[cat].count += 1;
  });
  return totals;
}
