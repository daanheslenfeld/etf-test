import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

const ORDER_TYPES = [
  { value: 'MKT', label: 'Market', requiresLimit: false, requiresStop: false },
  { value: 'LMT', label: 'Limit', requiresLimit: true, requiresStop: false },
  { value: 'STP', label: 'Stop', requiresLimit: false, requiresStop: true },
  { value: 'STP_LMT', label: 'Stop Limit', requiresLimit: true, requiresStop: true },
];

export default function OrderForm({ onAddToBasket }) {
  const { etfs, marketData, addToBasket, marketDataLoading, isDataStale, lastMarketDataUpdate, safetyLimits, isLive, tradingMode, availableFunds, cashBalance, checkOrderSafety } = useTrading();

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

  // Get current market data for selected symbol
  const currentMarketData = form.symbol ? marketData[form.symbol] : null;

  // Set default ETF on load
  useEffect(() => {
    if (etfs.length > 0 && !form.conid) {
      const first = etfs[0];
      setForm(prev => ({ ...prev, symbol: first.symbol, conid: first.conid }));
      setSelectedETF(first);
    }
  }, [etfs, form.conid]);

  // Auto-fill limit price with mid-price when switching to limit order type
  useEffect(() => {
    const orderType = ORDER_TYPES.find(t => t.value === form.orderType);
    if (orderType?.requiresLimit && !form.limitPrice && currentMarketData?.midPrice) {
      setForm(prev => ({ ...prev, limitPrice: currentMarketData.midPrice.toFixed(2) }));
    }
  }, [form.orderType, currentMarketData?.midPrice, form.limitPrice]);

  // Update selected ETF when symbol changes
  const handleSymbolChange = (e) => {
    const symbol = e.target.value;
    const etf = etfs.find(e => e.symbol === symbol);
    if (etf) {
      setForm(prev => ({ ...prev, symbol: etf.symbol, conid: etf.conid, limitPrice: '', stopPrice: '' }));
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
    <div className={`bg-[#1A1B1F] border rounded-xl p-4 ${isLive ? 'border-red-600/50' : 'border-gray-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#28EBCF]" />
          Add Order to Basket
        </h3>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
          isLive
            ? 'bg-red-600/30 text-red-400 border border-red-600'
            : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
        }`}>
          {tradingMode || 'PAPER'}
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

        {/* Symbol Select */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">Symbol</label>
          <select
            value={form.symbol}
            onChange={handleSymbolChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#28EBCF] focus:outline-none"
          >
            {etfs.map(etf => (
              <option key={etf.conid} value={etf.symbol}>
                {etf.symbol} - {etf.name}
              </option>
            ))}
          </select>
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
            <span className="text-gray-500 ml-2">(max: {safetyLimits?.maxOrderSize || 100})</span>
          </label>
          <input
            type="number"
            min="1"
            max={safetyLimits?.maxOrderSize || 100}
            value={form.quantity}
            onChange={(e) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
              exceedsMaxSize
                ? 'border-red-500 focus:border-red-500'
                : isLargeOrder
                  ? 'border-orange-500 focus:border-orange-500'
                  : 'border-gray-600 focus:border-[#28EBCF]'
            }`}
          />
          {exceedsMaxSize && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Exceeds max order size ({safetyLimits?.maxOrderSize || 100})
            </p>
          )}
          {isLargeOrder && !exceedsMaxSize && (
            <p className="text-orange-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Large order - will require confirmation
            </p>
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
          disabled={!form.conid || exceedsMaxSize || insufficientBalance}
          className={`w-full py-3 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            insufficientBalance
              ? 'bg-red-900/50 text-red-400 cursor-not-allowed'
              : 'bg-[#28EBCF] text-gray-900 hover:bg-[#20D4BA] disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {insufficientBalance ? (
            <>
              <ShieldAlert className="w-5 h-5" />
              Insufficient Liquidity
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Add to Basket
            </>
          )}
        </button>
      </div>
    </div>
  );
}
