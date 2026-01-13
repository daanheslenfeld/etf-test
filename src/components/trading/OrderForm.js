import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const ORDER_TYPES = [
  { value: 'MKT', label: 'Market', requiresLimit: false, requiresStop: false },
  { value: 'LMT', label: 'Limit', requiresLimit: true, requiresStop: false },
  { value: 'STP', label: 'Stop', requiresLimit: false, requiresStop: true },
  { value: 'STP_LMT', label: 'Stop Limit', requiresLimit: true, requiresStop: true },
];

export default function OrderForm({ onAddToBasket }) {
  const { etfs, marketData, addToBasket, marketDataLoading } = useTrading();

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

  return (
    <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-[#28EBCF]" />
        Add Order to Basket
      </h3>

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
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Market Data</span>
              {currentMarketData?.delayed && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Delayed
                </span>
              )}
              {marketDataLoading && (
                <div className="animate-spin h-3 w-3 border border-[#28EBCF] border-t-transparent rounded-full" />
              )}
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
          <label className="block text-gray-400 text-sm mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#28EBCF] focus:outline-none"
          />
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

        {/* Add to Basket Button */}
        <button
          onClick={handleAddToBasket}
          disabled={!form.conid}
          className="w-full py-3 bg-[#28EBCF] text-gray-900 font-bold rounded-lg hover:bg-[#20D4BA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Basket
        </button>
      </div>
    </div>
  );
}
