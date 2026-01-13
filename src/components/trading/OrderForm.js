import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Plus, ShoppingCart } from 'lucide-react';

const ORDER_TYPES = [
  { value: 'MKT', label: 'Market', requiresLimit: false, requiresStop: false },
  { value: 'LMT', label: 'Limit', requiresLimit: true, requiresStop: false },
  { value: 'STP', label: 'Stop', requiresLimit: false, requiresStop: true },
  { value: 'STP_LMT', label: 'Stop Limit', requiresLimit: true, requiresStop: true },
];

export default function OrderForm({ onAddToBasket }) {
  const { etfs, quotes, addToBasket } = useTrading();

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

  // Set default ETF on load
  useEffect(() => {
    if (etfs.length > 0 && !form.conid) {
      const first = etfs[0];
      setForm(prev => ({ ...prev, symbol: first.symbol, conid: first.conid }));
      setSelectedETF(first);
    }
  }, [etfs, form.conid]);

  // Update selected ETF when symbol changes
  const handleSymbolChange = (e) => {
    const symbol = e.target.value;
    const etf = etfs.find(e => e.symbol === symbol);
    if (etf) {
      setForm(prev => ({ ...prev, symbol: etf.symbol, conid: etf.conid }));
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

  const currentOrderType = ORDER_TYPES.find(t => t.value === form.orderType);

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
            onChange={(e) => setForm(prev => ({ ...prev, orderType: e.target.value }))}
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
            <p className="text-xs text-gray-500 mt-1">Maximum price for buy / Minimum price for sell</p>
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
