/**
 * BulkBuyFlow Component
 *
 * Wrapper component that provides TradingContext and manages the bulk buy workflow.
 * This component can be used anywhere in the app to enable portfolio bulk buying.
 */

import React from 'react';
import { TradingProvider, useTrading } from '../../context/TradingContext';
import { useBulkBuy } from '../../hooks/useBulkBuy';
import BulkBuyModal from './BulkBuyModal';
import { getPortfolioDefinition } from '../../data/tradablePortfolioDefinitions';

/**
 * Inner component that uses the trading context
 */
function BulkBuyFlowInner({
  isOpen,
  onClose,
  portfolioKey,
  onAddedToBasket
}) {
  const { connected, isDataStale, marketData } = useTrading();

  const {
    calculation,
    calculationSummary,
    isCalculating,
    error,
    availableCash,
    hasMarketData,
    prepareBulkBuy,
    addToBasket,
    clearCalculation
  } = useBulkBuy();

  // Get portfolio definition for display
  const portfolio = portfolioKey ? {
    key: portfolioKey,
    ...getPortfolioDefinition(portfolioKey)
  } : null;

  // Handle close
  const handleClose = () => {
    clearCalculation();
    onClose();
  };

  // Handle calculate
  const handleCalculate = (key, amount) => {
    prepareBulkBuy(key, amount);
  };

  // Handle add to basket
  const handleAddToBasket = () => {
    const success = addToBasket();
    if (success && onAddedToBasket) {
      onAddedToBasket();
    }
    return success;
  };

  return (
    <BulkBuyModal
      isOpen={isOpen}
      onClose={handleClose}
      portfolio={portfolio}
      calculation={calculation}
      calculationSummary={calculationSummary}
      isCalculating={isCalculating}
      error={error}
      availableCash={availableCash}
      canExecute={connected && !isDataStale}
      hasMarketData={hasMarketData}
      onCalculate={handleCalculate}
      onAddToBasket={handleAddToBasket}
    />
  );
}

/**
 * Main wrapper component that provides TradingContext
 */
export default function BulkBuyFlow({
  user,
  isOpen,
  onClose,
  portfolioKey,
  onAddedToBasket
}) {
  if (!isOpen) return null;

  return (
    <TradingProvider user={user}>
      <BulkBuyFlowInner
        isOpen={isOpen}
        onClose={onClose}
        portfolioKey={portfolioKey}
        onAddedToBasket={onAddedToBasket}
      />
    </TradingProvider>
  );
}
