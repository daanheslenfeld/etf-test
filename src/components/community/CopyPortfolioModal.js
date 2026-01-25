/**
 * CopyPortfolioModal Component
 *
 * Modal for copying a community portfolio to the order basket.
 * Allows users to set investment amount and preview orders before adding.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Users,
  Copy
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { getTradingInfo } from '../../data/tradableETFs';
import { formatCurrency, formatPercentage, groupOrdersByCategory } from '../../utils/portfolioUtils';

// Investment amount presets
const AMOUNT_PRESETS = [1000, 2500, 5000, 10000, 25000];

/**
 * Calculate orders for a community portfolio
 * Similar to calculateBulkBuyOrders but works with community portfolio positions
 */
function calculateCommunityPortfolioOrders(portfolio, investmentAmount, marketData) {
  const orders = [];
  const skippedETFs = [];
  let totalCost = 0;

  if (!portfolio?.positions || portfolio.positions.length === 0) {
    return {
      orders: [],
      totalCost: 0,
      skippedETFs: [],
      error: 'Portfolio heeft geen posities'
    };
  }

  // Calculate total weight to normalize (in case weights don't sum to 100%)
  const totalWeight = portfolio.positions.reduce((sum, pos) => sum + (pos.weight || 0), 0);

  for (const position of portfolio.positions) {
    // Normalize weight to percentage of total
    const normalizedWeight = totalWeight > 0 ? (position.weight / totalWeight) * 100 : 0;

    // Try to get trading info by symbol or ISIN
    let tradingInfo = null;
    if (position.isin) {
      tradingInfo = getTradingInfo(position.isin);
    }
    if (!tradingInfo && position.symbol) {
      // Fallback: search by symbol in market data
      tradingInfo = { symbol: position.symbol };
    }

    if (!tradingInfo?.symbol) {
      skippedETFs.push({
        name: position.name || position.symbol || 'Unknown',
        symbol: position.symbol,
        weight: normalizedWeight,
        reason: 'NOT_TRADABLE',
        allocatedAmount: (normalizedWeight / 100) * investmentAmount
      });
      continue;
    }

    // Get current price from market data
    const symbolData = marketData?.[tradingInfo.symbol];
    const price = symbolData?.last || symbolData?.ask || symbolData?.bid || position.lastPrice || 0;

    if (!price || price <= 0) {
      skippedETFs.push({
        name: position.name || tradingInfo.symbol,
        symbol: tradingInfo.symbol,
        weight: normalizedWeight,
        reason: 'NO_PRICE_DATA',
        allocatedAmount: (normalizedWeight / 100) * investmentAmount
      });
      continue;
    }

    // Calculate allocated amount and units
    const allocatedAmount = (normalizedWeight / 100) * investmentAmount;
    const units = Math.floor(allocatedAmount / price);

    if (units === 0) {
      skippedETFs.push({
        name: position.name || tradingInfo.symbol,
        symbol: tradingInfo.symbol,
        weight: normalizedWeight,
        reason: 'ZERO_UNITS',
        allocatedAmount,
        price,
        minRequired: price
      });
      continue;
    }

    const actualCost = units * price;

    orders.push({
      isin: position.isin,
      symbol: tradingInfo.symbol,
      conid: tradingInfo.conid,
      exchange: tradingInfo.exchange || 'SMART',
      name: position.name || tradingInfo.name || tradingInfo.symbol,
      category: position.category || 'ETF',
      targetWeight: normalizedWeight,
      allocatedAmount,
      price,
      units,
      actualCost,
      actualWeight: 0
    });

    totalCost += actualCost;
  }

  // Calculate actual weights
  if (totalCost > 0) {
    orders.forEach(order => {
      order.actualWeight = (order.actualCost / totalCost) * 100;
    });
  }

  return {
    orders,
    totalCost,
    skippedETFs,
    portfolio: {
      name: portfolio.name,
      description: portfolio.description,
      creator: portfolio.creator_name || portfolio.creator
    }
  };
}

/**
 * Convert calculation orders to basket format
 */
function ordersToBasket(orders) {
  return orders.map(order => ({
    symbol: order.symbol,
    conid: order.conid,
    side: 'BUY',
    quantity: order.units,
    orderType: 'MKT',
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

export default function CopyPortfolioModal({
  isOpen,
  onClose,
  portfolio
}) {
  const {
    marketData,
    cashBalance,
    connected,
    addMultipleToBasket
  } = useTrading();

  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [addedToBasket, setAddedToBasket] = useState(false);
  const [error, setError] = useState(null);

  // Calculate orders when portfolio or amount changes
  const calculateOrders = useCallback((amount) => {
    if (!portfolio) return;

    setIsCalculating(true);
    setError(null);

    try {
      const result = calculateCommunityPortfolioOrders(portfolio, amount, marketData);

      if (result.error) {
        setError(result.error);
        setCalculation(null);
      } else {
        setCalculation(result);
      }
    } catch (err) {
      console.error('Error calculating orders:', err);
      setError('Fout bij berekenen van orders');
      setCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  }, [portfolio, marketData]);

  // Calculate when modal opens or amount changes
  useEffect(() => {
    if (isOpen && portfolio) {
      setAddedToBasket(false);
      calculateOrders(investmentAmount);
    }
  }, [isOpen, portfolio, investmentAmount, calculateOrders]);

  // Handle amount preset click
  const handleAmountChange = (amount) => {
    setInvestmentAmount(amount);
    setCustomAmount('');
    calculateOrders(amount);
  };

  // Handle custom amount input
  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    if (value && parseInt(value) > 0) {
      const amount = parseInt(value);
      setInvestmentAmount(amount);
      calculateOrders(amount);
    }
  };

  // Handle add to basket
  const handleAddToBasket = () => {
    if (!calculation?.orders || calculation.orders.length === 0) return;

    const basketOrders = ordersToBasket(calculation.orders);
    addMultipleToBasket(basketOrders, `copy-${portfolio?.id || Date.now()}`);
    setAddedToBasket(true);

    // Close modal after delay
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const orders = calculation?.orders || [];
  const skippedETFs = calculation?.skippedETFs || [];
  const groupedOrders = groupOrdersByCategory(orders);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#FEFEFE] rounded-2xl shadow-[0_8px_32px_rgba(45,52,54,0.12)] border border-[#E8E8E6]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7C9885]/10 rounded-xl flex items-center justify-center">
              <Copy className="w-5 h-5 text-[#7C9885]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3436]">
                Portfolio kopieren
              </h2>
              <p className="text-sm text-[#636E72] mt-0.5">
                {portfolio?.name} van {portfolio?.creator_name || portfolio?.creator}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F5F6F4] transition-colors"
          >
            <X className="w-5 h-5 text-[#636E72]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Connection status */}
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl ${
            connected ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C9A962]/10 text-[#C9A962]'
          }`}>
            {connected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Verbonden - Live prijzen beschikbaar</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline - Gecachete prijzen worden gebruikt</span>
              </>
            )}
          </div>

          {/* Investment Amount Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#2D3436] mb-3">
              Investeringsbedrag
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {AMOUNT_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountChange(amount)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                    investmentAmount === amount && !customAmount
                      ? 'bg-[#7C9885] text-white shadow-sm'
                      : 'bg-[#F5F6F4] text-[#636E72] hover:bg-[#ECEEED]'
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#636E72]">of:</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636E72]">€</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Ander bedrag"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885] focus:ring-2 focus:ring-[#7C9885]/20"
                />
              </div>
            </div>
            {cashBalance > 0 && (
              <p className="text-xs text-[#B2BEC3] mt-2">
                Beschikbaar saldo: {formatCurrency(cashBalance)}
              </p>
            )}
          </div>

          {/* Loading state */}
          {isCalculating && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#7C9885] animate-spin" />
              <span className="ml-3 text-[#636E72]">Berekenen...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isCalculating && (
            <div className="flex items-start gap-3 p-4 bg-[#C0736D]/10 rounded-xl mb-4">
              <AlertTriangle className="w-5 h-5 text-[#C0736D] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#C0736D] font-medium">Fout bij berekening</p>
                <p className="text-[#C0736D]/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Calculation results */}
          {!isCalculating && calculation && !error && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F5F6F4] rounded-xl p-4">
                  <div className="text-sm text-[#636E72] mb-1">Totale kosten</div>
                  <div className="text-xl font-bold text-[#2D3436]">
                    {formatCurrency(calculation.totalCost)}
                  </div>
                </div>
                <div className="bg-[#F5F6F4] rounded-xl p-4">
                  <div className="text-sm text-[#636E72] mb-1">Aantal ETFs</div>
                  <div className="text-xl font-bold text-[#2D3436]">
                    {orders.length}
                    {skippedETFs.length > 0 && (
                      <span className="text-sm font-normal text-[#636E72] ml-1">
                        van {orders.length + skippedETFs.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* No orders warning */}
              {orders.length === 0 && (
                <div className="flex items-start gap-3 p-4 bg-[#C9A962]/10 rounded-xl mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#C9A962] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#C9A962] font-medium">Geen orders mogelijk</p>
                    <p className="text-[#C9A962]/80 text-sm mt-1">
                      Met dit bedrag kunnen geen posities worden gekocht. Verhoog het investeringsbedrag.
                    </p>
                  </div>
                </div>
              )}

              {/* Orders by category */}
              {Object.entries(groupedOrders).map(([category, categoryOrders]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-semibold text-[#636E72] mb-2 flex items-center gap-2">
                    <span>{category}</span>
                    <span className="text-xs font-normal text-[#B2BEC3]">
                      ({categoryOrders.length} ETF{categoryOrders.length !== 1 ? 's' : ''})
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {categoryOrders.map((order) => (
                      <div
                        key={order.symbol}
                        className="flex items-center justify-between p-3 bg-[#F5F6F4] rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#2D3436]">{order.symbol}</span>
                            <span className="text-xs text-[#B2BEC3] px-1.5 py-0.5 bg-[#ECEEED] rounded">
                              {formatPercentage(order.actualWeight)}
                            </span>
                          </div>
                          <div className="text-xs text-[#636E72] truncate">
                            {order.name}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-[#2D3436]">
                            {order.units} x {formatCurrency(order.price)}
                          </div>
                          <div className="text-xs text-[#636E72]">
                            {formatCurrency(order.actualCost)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Skipped ETFs */}
              {skippedETFs.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowSkipped(!showSkipped)}
                    className="flex items-center gap-2 text-sm text-[#636E72] hover:text-[#2D3436]"
                  >
                    {showSkipped ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {skippedETFs.length} ETF{skippedETFs.length !== 1 ? 's' : ''} overgeslagen
                  </button>
                  {showSkipped && (
                    <div className="mt-2 space-y-2">
                      {skippedETFs.map((etf, idx) => (
                        <div
                          key={etf.symbol || idx}
                          className="flex items-center justify-between p-3 bg-[#F5F6F4]/50 rounded-xl text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[#636E72]">{etf.name || etf.symbol}</span>
                          </div>
                          <div className="text-xs text-[#B2BEC3]">
                            {etf.reason === 'ZERO_UNITS' && `Min. ${formatCurrency(etf.minRequired)} nodig`}
                            {etf.reason === 'NO_PRICE_DATA' && 'Geen koersdata'}
                            {etf.reason === 'NOT_TRADABLE' && 'Niet verhandelbaar'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E8E6] bg-[#FEFEFE]">
          {addedToBasket ? (
            <div className="flex items-center justify-center gap-2 text-[#7C9885]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Toegevoegd aan basket!</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#636E72]">Totaal</div>
                <div className="text-xl font-bold text-[#2D3436]">
                  {formatCurrency(calculation?.totalCost || 0)}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-medium bg-[#ECEEED] text-[#636E72] hover:bg-[#E8E8E6] transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddToBasket}
                  disabled={!calculation || orders.length === 0 || isCalculating}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#7C9885] text-white hover:bg-[#6B8A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Toevoegen aan basket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
