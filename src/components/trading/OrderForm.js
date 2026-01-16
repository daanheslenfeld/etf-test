import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

const ORDER_TYPES = [
  { value: 'MKT', label: 'Market', requiresLimit: false, requiresStop: false },
  { value: 'LMT', label: 'Limit', requiresLimit: true, requiresStop: false },
  { value: 'STP', label: 'Stop', requiresLimit: false, requiresStop: true },
  { value: 'STP_LMT', label: 'Stop Limit', requiresLimit: true, requiresStop: true },
];

export default function OrderForm({ onAddToBasket, prefillOrder, onClearPrefill }) {
  const { etfs, marketData, addToBasket, marketDataLoading, isDataStale, lastMarketDataUpdate, safetyLimits, isLive, tradingMode, availableFunds, cashBalance, checkOrderSafety, tradableETFs, isTradableByIsin, tradabilityStats, validateSellOrder, positions } = useTrading();

  const [form, setForm] = useState({
    symbol: '',
    conid: 0,
    side: 'BUY',
    quantity: 1,
    orderType: 'MKT',
    limitPrice: '',
    stopPrice: '',
  });

  const [selectedETF, setSelectedETF] = useState(null);
  const [maxSellQuantity, setMaxSellQuantity] = useState(null);
  const [sellError, setSellError] = useState(null);

  // Handle prefill from PortfolioOverview
  useEffect(() => {
    if (prefillOrder) {
      setForm(prev => ({
        ...prev,
        symbol: prefillOrder.symbol,
        conid: prefillOrder.conid,
        side: prefillOrder.side,
        quantity: prefillOrder.quantity || 1,
        orderType: 'MKT',
        limitPrice: '',
        stopPrice: '',
      }));
      setMaxSellQuantity(prefillOrder.maxQuantity || null);
      setSellError(null);
      // Find the ETF for selected symbol
      const etf = etfs.find(e => e.symbol === prefillOrder.symbol);
      if (etf) setSelectedETF(etf);
    }
  }, [prefillOrder, etfs]);

  // Update max sell quantity when side changes to SELL
  useEffect(() => {
    if (form.side === 'SELL' && form.symbol) {
      const position = positions.find(p => p.symbol === form.symbol);
      if (position) {
        setMaxSellQuantity(Math.floor(parseFloat(position.quantity) || 0));
      } else {
        setMaxSellQuantity(0);
      }
    } else {
      setMaxSellQuantity(null);
    }
    setSellError(null);
  }, [form.side, form.symbol, positions]);

  // Validate sell quantity
  useEffect(() => {
    if (form.side === 'SELL' && maxSellQuantity !== null) {
      if (form.quantity > maxSellQuantity) {
        setSellError(`Cannot sell ${form.quantity} shares. You only own ${maxSellQuantity}.`);
      } else if (maxSellQuantity === 0) {
        setSellError(`No shares owned for ${form.symbol}`);
      } else {
        setSellError(null);
      }
    } else {
      setSellError(null);
    }
  }, [form.quantity, form.side, maxSellQuantity, form.symbol]);

  // Filter ETFs to only show tradable ones
  // Use tradableETFs from backend tradability check as the source of truth
  const tradableETFsList = useMemo(() => {
    if (!tradableETFs || Object.keys(tradableETFs).length === 0) {
      // Fallback to all ETFs if tradability data not loaded yet
      return etfs;
    }
    // Filter to only ETFs that are tradable via LYNX
    return etfs.filter(etf => {
      const tradInfo = tradableETFs[etf.isin];
      return tradInfo?.tradable_via_lynx === true;
    });
  }, [etfs, tradableETFs]);

  // Get current market data for selected symbol
  const currentMarketData = form.symbol ? marketData[form.symbol] : null;

  // Set default ETF on load (from tradable list only)
  useEffect(() => {
    if (tradableETFsList.length > 0 && !form.conid) {
      const first = tradableETFsList[0];
      setForm(prev => ({ ...prev, symbol: first.symbol, conid: first.conid }));
      setSelectedETF(first);
    }
  }, [tradableETFsList, form.conid]);

  // Auto-fill limit price with mid-price when switching to limit order type
  useEffect(() => {
    const orderType = ORDER_TYPES.find(t => t.value === form.orderType);
    if (orderType?.requiresLimit && !form.limitPrice && currentMarketData?.midPrice) {
      setForm(prev => ({ ...prev, limitPrice: currentMarketData.midPrice.toFixed(2) }));
    }
  }, [form.orderType, currentMarketData?.midPrice, form.limitPrice]);

  // Update selected ETF when symbol changes (from tradable list)
  const handleSymbolChange = (e) => {
    const symbol = e.target.value;
    const etf = tradableETFsList.find(e => e.symbol === symbol);
    if (etf) {
      // Get contract info from tradability data for accurate conid
      const tradInfo = tradableETFs[etf.isin];
      const conid = tradInfo?.contract?.conId || etf.conid;
      setForm(prev => ({ ...prev, symbol: etf.symbol, conid: conid, limitPrice: '', stopPrice: '' }));
      setSelectedETF(etf);
    }
  };

  const handleAddToBasket = () => {
    if (!form.conid || form.quantity < 1) return;

    const orderType = ORDER_TYPES.find(t => t.value === form.orderType);

    // Validate required prices
    if (orderType.requiresLimit && !form.limitPrice) {
      alert('Limit price is required for this order type');
      return;
    }
    if (orderType.requiresStop && !form.stopPrice) {
      alert('Stop price is required for this order type');
      return;
    }

    addToBasket({
      symbol: form.symbol,
      conid: form.conid,
      side: form.side,
      quantity: parseInt(form.quantity),
      orderType: form.orderType,
      limitPrice: form.limitPrice ? parseFloat(form.limitPrice) : null,
      stopPrice: form.stopPrice ? parseFloat(form.stopPrice) : null,
    });

    // Reset quantity after adding
    setForm(prev => ({ ...prev, quantity: 1, limitPrice: '', stopPrice: '' }));
  };

  // Set limit price to bid/ask/mid
  const setLimitToPrice = (price) => {
    if (price) {
      setForm(prev => ({ ...prev, limitPrice: price.toFixed(2) }));
    }
  };

  const setStopToPrice = (price) => {
    if (price) {
      setForm(prev => ({ ...prev, stopPrice: price.toFixed(2) }));
    }
  };

  const currentOrderType = ORDER_TYPES.find(t => t.value === form.orderType);

  const formatPrice = (price) => {
    if (!price) return '-';
    return `€${price.toFixed(2)}`;
  };

  // Check if quantity exceeds limit
  const isLargeOrder = form.quantity >= (safetyLimits?.largeOrderThreshold || 25);
  const exceedsMaxSize = form.quantity > (safetyLimits?.maxOrderSize || 100);

  // Calculate estimated order value
  const estimatedPrice = form.limitPrice
    ? parseFloat(form.limitPrice)
    : currentMarketData?.last || currentMarketData?.ask || currentMarketData?.bid || 0;
  const estimatedOrderValue = estimatedPrice * form.quantity;
  const requiredWithBuffer = estimatedOrderValue * 1.01; // 1% buffer for fees

  // Balance check for BUY orders
  const available = availableFunds > 0 ? availableFunds : cashBalance;
  const insufficientBalance = form.side === 'BUY' && requiredWithBuffer > available && available > 0;

  return (
    <div className={`bg-[#1A1B1F] border rounded-xl p-4 ${isLive ? 'border-blue-600/50' : 'border-gray-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#28EBCF]" />
          Add Order to Basket
        </h3>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
          isLive
            ? 'bg-blue-600/30 text-blue-400 border border-blue-600'
            : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
        }`}>
          {tradingMode}
        </div>
      </div>

      <div className="space-y-4">
        {/* Side Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setForm(prev => ({ ...prev, side: 'BUY' }))}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              form.side === 'BUY'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setForm(prev => ({ ...prev, side: 'SELL' }))}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              form.side === 'SELL'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Symbol Select - Only shows tradable ETFs */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">
            Symbol
            {tradabilityStats?.totalTradable > 0 && (
              <span className="text-gray-500 ml-2 text-xs">
                ({tradableETFsList.length} tradable)
              </span>
            )}
          </label>
          <select
            value={form.symbol}
            onChange={handleSymbolChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#28EBCF] focus:outline-none"
          >
            {tradableETFsList.length === 0 ? (
              <option value="" disabled>No tradable ETFs available</option>
            ) : (
              tradableETFsList.map(etf => (
                <option key={etf.isin || etf.conid} value={etf.symbol}>
                  {etf.symbol} - {etf.name}
                </option>
              ))
            )}
          </select>
          {tradableETFsList.length === 0 && etfs.length > 0 && (
            <p className="text-yellow-400 text-xs mt-1">
              Tradability data loading... or no ETFs verified as tradable yet.
            </p>
          )}
        </div>

        {/* Market Data Display */}
        {form.symbol && (
          <div className={`bg-gray-800/50 rounded-lg p-3 ${isDataStale ? 'border border-orange-600/30' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Market Data</span>
              <div className="flex items-center gap-2">
                {isDataStale && (
                  <span className="text-xs text-orange-400 flex items-center gap-1 px-1.5 py-0.5 bg-orange-600/20 rounded">
                    <Clock className="w-3 h-3" />
                    Cached
                  </span>
                )}
                {currentMarketData?.delayed && !isDataStale && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Delayed
                  </span>
                )}
                {marketDataLoading && (
                  <div className="animate-spin h-3 w-3 border border-[#28EBCF] border-t-transparent rounded-full" />
                )}
              </div>
            </div>

            {currentMarketData ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">Bid</div>
                  <div className="text-green-400 font-mono font-medium">
                    {formatPrice(currentMarketData.bid)}
                  </div>
                  {currentMarketData.bidSize && (
                    <div className="text-xs text-gray-500">{currentMarketData.bidSize}</div>
                  )}
                </div>
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">Last</div>
                  <div className="text-white font-mono font-medium">
                    {formatPrice(currentMarketData.last)}
                  </div>
                  {currentMarketData.spread && (
                    <div className="text-xs text-gray-500">
                      Spread: {formatPrice(currentMarketData.spread)}
                    </div>
                  )}
                </div>
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">Ask</div>
                  <div className="text-red-400 font-mono font-medium">
                    {formatPrice(currentMarketData.ask)}
                  </div>
                  {currentMarketData.askSize && (
                    <div className="text-xs text-gray-500">{currentMarketData.askSize}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">
                {marketDataLoading ? 'Loading...' : 'No market data available'}
              </div>
            )}
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">
            Quantity
            {form.side === 'SELL' && maxSellQuantity !== null ? (
              <span className="text-gray-500 ml-2">(max owned: {maxSellQuantity})</span>
            ) : (
              <span className="text-gray-500 ml-2">(max: {safetyLimits?.maxOrderSize || 100})</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            max={form.side === 'SELL' && maxSellQuantity !== null ? maxSellQuantity : (safetyLimits?.maxOrderSize || 100)}
            value={form.quantity}
            onChange={(e) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
              sellError || exceedsMaxSize
                ? 'border-red-500 focus:border-red-500'
                : isLargeOrder
                  ? 'border-orange-500 focus:border-orange-500'
                  : 'border-gray-600 focus:border-[#28EBCF]'
            }`}
          />
          {sellError && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {sellError}
            </p>
          )}
          {!sellError && exceedsMaxSize && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Exceeds max order size ({safetyLimits?.maxOrderSize || 100})
            </p>
          )}
          {!sellError && isLargeOrder && !exceedsMaxSize && (
            <p className="text-orange-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Large order - will require confirmation
            </p>
          )}
          {form.side === 'SELL' && maxSellQuantity !== null && maxSellQuantity > 0 && !sellError && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(maxSellQuantity / 4) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(maxSellQuantity / 2) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(maxSellQuantity * 0.75) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: maxSellQuantity }))}
                className="flex-1 text-xs py-1 px-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
              >
                100%
              </button>
            </div>
          )}
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">Order Type</label>
          <select
            value={form.orderType}
            onChange={(e) => setForm(prev => ({ ...prev, orderType: e.target.value, limitPrice: '', stopPrice: '' }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#28EBCF] focus:outline-none"
          >
            {ORDER_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stop Price (for Stop and Stop Limit) */}
        {currentOrderType?.requiresStop && (
          <div>
            <label className="block text-gray-400 text-sm mb-1">Stop Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.stopPrice}
              onChange={(e) => setForm(prev => ({ ...prev, stopPrice: e.target.value }))}
              placeholder="Enter stop trigger price"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#28EBCF] focus:outline-none"
            />
            {currentMarketData && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setStopToPrice(currentMarketData.bid)}
                  className="flex-1 text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Bid ({formatPrice(currentMarketData.bid)})
                </button>
                <button
                  type="button"
                  onClick={() => setStopToPrice(currentMarketData.last)}
                  className="flex-1 text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Last ({formatPrice(currentMarketData.last)})
                </button>
                <button
                  type="button"
                  onClick={() => setStopToPrice(currentMarketData.ask)}
                  className="flex-1 text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Ask ({formatPrice(currentMarketData.ask)})
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Order triggers when price reaches this level</p>
          </div>
        )}

        {/* Limit Price (for Limit and Stop Limit) */}
        {currentOrderType?.requiresLimit && (
          <div>
            <label className="block text-gray-400 text-sm mb-1">Limit Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.limitPrice}
              onChange={(e) => setForm(prev => ({ ...prev, limitPrice: e.target.value }))}
              placeholder="Enter limit price"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#28EBCF] focus:outline-none"
            />
            {currentMarketData && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setLimitToPrice(currentMarketData.bid)}
                  className="flex-1 text-xs py-1 px-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50"
                >
                  Bid ({formatPrice(currentMarketData.bid)})
                </button>
                <button
                  type="button"
                  onClick={() => setLimitToPrice(currentMarketData.midPrice)}
                  className="flex-1 text-xs py-1 px-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50"
                >
                  Mid ({formatPrice(currentMarketData.midPrice)})
                </button>
                <button
                  type="button"
                  onClick={() => setLimitToPrice(currentMarketData.ask)}
                  className="flex-1 text-xs py-1 px-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                >
                  Ask ({formatPrice(currentMarketData.ask)})
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {form.side === 'BUY' ? 'Maximum price to pay' : 'Minimum price to receive'}
            </p>
          </div>
        )}

        {/* Estimated Order Value & Balance Check */}
        {form.side === 'BUY' && estimatedPrice > 0 && (
          <div className={`rounded-lg p-3 ${insufficientBalance ? 'bg-red-900/30 border border-red-600/50' : 'bg-gray-800/50'}`}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-400">Estimated Cost</span>
              <span className="text-white font-medium">€{estimatedOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-400">+ Buffer (1%)</span>
              <span className="text-gray-300">€{(estimatedOrderValue * 0.01).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-700">
              <span className="text-gray-400">Available Cash</span>
              <span className={`font-medium ${insufficientBalance ? 'text-red-400' : 'text-green-400'}`}>
                €{available.toFixed(2)}
              </span>
            </div>
            {insufficientBalance && (
              <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Insufficient liquidity. Available: €{available.toFixed(2)}, Required: €{requiredWithBuffer.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Add to Basket Button */}
        <button
          onClick={handleAddToBasket}
          disabled={!form.conid || exceedsMaxSize || insufficientBalance || tradableETFsList.length === 0 || !!sellError}
          className={`w-full py-3 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            insufficientBalance || sellError
              ? 'bg-red-900/50 text-red-400 cursor-not-allowed'
              : 'bg-[#28EBCF] text-gray-900 hover:bg-[#20D4BA] disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {sellError ? (
            <>
              <ShieldAlert className="w-5 h-5" />
              Cannot Sell More Than Owned
            </>
          ) : insufficientBalance ? (
            <>
              <ShieldAlert className="w-5 h-5" />
              Insufficient Liquidity
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Add {form.side} to Basket
            </>
          )}
        </button>
      </div>
    </div>
  );
}
