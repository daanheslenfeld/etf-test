/**
 * useBulkBuy Hook
 *
 * Hook for managing bulk portfolio purchases.
 * Calculates orders based on portfolio weights, validates against available cash,
 * and handles adding orders to the trading basket.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  calculateBulkBuyOrders,
  bulkOrdersToBasket,
  validateBulkBuy,
  formatCurrency
} from '../utils/portfolioUtils';
import { TRADABLE_PORTFOLIO_DEFINITIONS, getPortfolioDefinition } from '../data/tradablePortfolioDefinitions';

/**
 * Hook for managing bulk portfolio purchases
 *
 * @returns {Object} Bulk buy state and actions
 */
export function useBulkBuy() {
  const {
    marketData,
    accountSummary,
    connected,
    isDataStale,
    addMultipleToBasket
  } = useTrading();

  // Local state for bulk buy workflow
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [error, setError] = useState(null);

  // Get available cash from account summary
  const availableCash = useMemo(() => {
    if (!accountSummary) return 0;
    // Prefer AvailableFunds, then NetLiquidation, then TotalCashValue
    return accountSummary.AvailableFunds ||
           accountSummary.NetLiquidation ||
           accountSummary.TotalCashValue ||
           0;
  }, [accountSummary]);

  // Check if we have valid market data
  const hasMarketData = useMemo(() => {
    return marketData && Object.keys(marketData).length > 0;
  }, [marketData]);

  // Check if we can execute orders (connected and not stale)
  const canExecute = useMemo(() => {
    return connected && !isDataStale;
  }, [connected, isDataStale]);

  // Get all available portfolios
  const availablePortfolios = useMemo(() => {
    return Object.entries(TRADABLE_PORTFOLIO_DEFINITIONS).map(([key, portfolio]) => ({
      key,
      name: portfolio.name,
      description: portfolio.description,
      expectedReturn: portfolio.expectedReturn,
      stdDev: portfolio.stdDev,
      riskLevel: portfolio.riskLevel,
      color: portfolio.color,
      holdingsCount: portfolio.holdings.length
    }));
  }, []);

  /**
   * Prepare bulk buy calculation for a portfolio
   *
   * @param {string} portfolioKey - Key from TRADABLE_PORTFOLIO_DEFINITIONS
   * @param {number} amount - Investment amount in EUR
   * @returns {Object} Calculation result
   */
  const prepareBulkBuy = useCallback(async (portfolioKey, amount) => {
    setIsCalculating(true);
    setError(null);

    try {
      const portfolio = getPortfolioDefinition(portfolioKey);
      if (!portfolio) {
        throw new Error(`Onbekend portfolio: ${portfolioKey}`);
      }

      if (!amount || amount <= 0) {
        throw new Error('Investeringsbedrag moet groter zijn dan 0');
      }

      // Use available cash or the investment amount if no account data
      const effectiveAvailable = availableCash > 0 ? availableCash : amount;

      // Calculate orders
      const result = calculateBulkBuyOrders(
        portfolioKey,
        amount,
        marketData || {},
        effectiveAvailable
      );

      setSelectedPortfolio(portfolioKey);
      setInvestmentAmount(amount);
      setCalculation(result);

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Berekening mislukt';
      setError(errorMessage);
      return { error: errorMessage, orders: [], totalCost: 0 };
    } finally {
      setIsCalculating(false);
    }
  }, [marketData, availableCash]);

  /**
   * Recalculate with new investment amount
   */
  const recalculate = useCallback((newAmount) => {
    if (selectedPortfolio && newAmount > 0) {
      return prepareBulkBuy(selectedPortfolio, newAmount);
    }
    return null;
  }, [selectedPortfolio, prepareBulkBuy]);

  /**
   * Add calculated orders to the trading basket
   *
   * @returns {boolean} Success status
   */
  const addToBasket = useCallback(() => {
    if (!calculation?.orders?.length) {
      setError('Geen orders om toe te voegen');
      return false;
    }

    // Validate calculation
    const validation = validateBulkBuy(calculation);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    // Convert to basket format
    const basketOrders = bulkOrdersToBasket(calculation.orders);

    // Add to basket with bulk grouping
    addMultipleToBasket(basketOrders);

    // Clear calculation state after successful add
    setCalculation(null);
    setSelectedPortfolio(null);
    setInvestmentAmount(0);
    setError(null);

    return true;
  }, [calculation, addMultipleToBasket]);

  /**
   * Clear the current calculation
   */
  const clearCalculation = useCallback(() => {
    setCalculation(null);
    setSelectedPortfolio(null);
    setInvestmentAmount(0);
    setError(null);
  }, []);

  /**
   * Get summary of current calculation for display
   */
  const calculationSummary = useMemo(() => {
    if (!calculation) return null;

    const portfolio = getPortfolioDefinition(selectedPortfolio);

    return {
      portfolioName: portfolio?.name || 'Onbekend',
      portfolioDescription: portfolio?.description || '',
      investmentAmount,
      investmentAmountFormatted: formatCurrency(investmentAmount),
      totalCost: calculation.totalCost,
      totalCostFormatted: formatCurrency(calculation.totalCost),
      remainingCash: calculation.remainingCash,
      remainingCashFormatted: formatCurrency(calculation.remainingCash),
      orderCount: calculation.orders?.length || 0,
      skippedCount: calculation.skippedETFs?.length || 0,
      scaledDown: calculation.scaledDown || false,
      scaleFactor: calculation.scaleFactor || 1,
      canProceed: calculation.orders?.length > 0 && !calculation.error
    };
  }, [calculation, selectedPortfolio, investmentAmount]);

  return {
    // State
    calculation,
    calculationSummary,
    selectedPortfolio,
    investmentAmount,
    isCalculating,
    error,

    // Derived state
    availableCash,
    hasMarketData,
    canExecute,
    availablePortfolios,

    // Actions
    prepareBulkBuy,
    recalculate,
    addToBasket,
    clearCalculation,
    setError,
    setInvestmentAmount
  };
}

export default useBulkBuy;
