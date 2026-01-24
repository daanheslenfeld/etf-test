import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TRADABLE_ETFS, getTradableCount } from '../../data/tradableETFs';

const ORDER_TYPES = [
  { value: 'MKT', label: 'Market', requiresLimit: false, requiresStop: false },
  { value: 'LMT', label: 'Limit', requiresLimit: true, requiresStop: false },
  { value: 'STP', label: 'Stop', requiresLimit: false, requiresStop: true },
  { value: 'STP_LMT', label: 'Stop Limit', requiresLimit: true, requiresStop: true },
];

export default function OrderForm({ onAddToBasket, prefillOrder, onClearPrefill }) {
  const { marketData, addToBasket, marketDataLoading, isDataStale, safetyLimits, isLive, tradingMode, availableFunds, cashBalance, positions } = useTrading();

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

  // Handle prefill from ETFBrowser or PortfolioOverview
  useEffect(() => {
    if (prefillOrder) {
      setForm(prev => ({
        ...prev,
        symbol: prefillOrder.symbol,
        conid: prefillOrder.conid,
        side: prefillOrder.side || 'BUY',
        quantity: prefillOrder.quantity || 1,
        orderType: 'MKT',
        limitPrice: '',
        stopPrice: '',
      }));
      setMaxSellQuantity(prefillOrder.maxQuantity || null);
      setSellError(null);
      // Directly use the prefill data as selectedETF (no need to search)
      setSelectedETF({
        isin: prefillOrder.isin,
        symbol: prefillOrder.symbol,
        name: prefillOrder.name,
        conid: prefillOrder.conid,
        exchange: prefillOrder.exchange,
        currency: prefillOrder.currency,
      });
    }
  }, [prefillOrder]);

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

  // Use static TRADABLE_ETFS data for offline support
  // This contains all 2,478 tradable ETFs from the pre-generated file
  const tradableETFsList = useMemo(() => {
    return Object.entries(TRADABLE_ETFS).map(([isin, data]) => ({
      isin,
      symbol: data.symbol,
      name: data.name,
      conid: data.conid,
      exchange: data.exchange,
      currency: data.currency,
    }));
  }, []);

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

  // Update selected ETF when symbol changes (from static tradable list)
  const handleSymbolChange = (e) => {
    const symbol = e.target.value;
    const etf = tradableETFsList.find(e => e.symbol === symbol);
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
    <div className={`bg-[#FEFEFE] border rounded-xl p-4 shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${isLive ? 'border-[#6B7B8A]/30' : 'border-[#E8E8E6]'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#7C9885]" />
          Add Order to Basket
        </h3>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
          isLive
            ? 'bg-[#6B7B8A]/10 text-[#6B7B8A] border border-[#6B7B8A]/30'
            : 'bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30'
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
                ? 'bg-[#7C9885] text-white'
                : 'bg-[#ECEEED] text-[#636E72] hover:bg-[#E8E8E6]'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setForm(prev => ({ ...prev, side: 'SELL' }))}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              form.side === 'SELL'
                ? 'bg-[#C0736D] text-white'
                : 'bg-[#ECEEED] text-[#636E72] hover:bg-[#E8E8E6]'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Symbol Select - Shows all tradable ETFs from static file */}
        <div>
          <label className="block text-[#636E72] text-sm mb-1">
            Symbol
            <span className="text-[#B2BEC3] ml-2 text-xs">
              ({getTradableCount()} tradable)
            </span>
          </label>
          <select
            value={form.symbol}
            onChange={handleSymbolChange}
            className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
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
          {tradableETFsList.length === 0 && (
            <p className="text-[#C9A962] text-xs mt-1">
              Tradability data loading... or no ETFs verified as tradable yet.
            </p>
          )}
        </div>

        {/* Market Data Display */}
        {form.symbol && (
          <div className={`bg-[#F5F6F4] rounded-lg p-3 ${isDataStale ? 'border border-[#C9A962]/30' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#636E72]">Market Data</span>
              <div className="flex items-center gap-2">
                {isDataStale && (
                  <span className="text-xs text-[#C9A962] flex items-center gap-1 px-1.5 py-0.5 bg-[#C9A962]/10 rounded">
                    <Clock className="w-3 h-3" />
                    Cached
                  </span>
                )}
                {currentMarketData?.delayed && !isDataStale && (
                  <span className="text-xs text-[#C9A962] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Delayed
                  </span>
                )}
                {marketDataLoading && (
                  <div className="animate-spin h-3 w-3 border border-[#7C9885] border-t-transparent rounded-full" />
                )}
              </div>
            </div>

            {currentMarketData ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#FEFEFE] rounded p-2 border border-[#E8E8E6]">
                  <div className="text-xs text-[#636E72] mb-1">Bid</div>
                  <div className="text-[#7C9885] font-mono font-medium">
                    {formatPrice(currentMarketData.bid)}
                  </div>
                  {currentMarketData.bidSize && (
                    <div className="text-xs text-[#B2BEC3]">{currentMarketData.bidSize}</div>
                  )}
                </div>
                <div className="bg-[#FEFEFE] rounded p-2 border border-[#E8E8E6]">
                  <div className="text-xs text-[#636E72] mb-1">Last</div>
                  <div className="text-[#2D3436] font-mono font-medium">
                    {formatPrice(currentMarketData.last)}
                  </div>
                  {currentMarketData.spread && (
                    <div className="text-xs text-[#B2BEC3]">
                      Spread: {formatPrice(currentMarketData.spread)}
                    </div>
                  )}
                </div>
                <div className="bg-[#FEFEFE] rounded p-2 border border-[#E8E8E6]">
                  <div className="text-xs text-[#636E72] mb-1">Ask</div>
                  <div className="text-[#C0736D] font-mono font-medium">
                    {formatPrice(currentMarketData.ask)}
                  </div>
                  {currentMarketData.askSize && (
                    <div className="text-xs text-[#B2BEC3]">{currentMarketData.askSize}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-[#B2BEC3] py-2">
                {marketDataLoading ? 'Loading...' : 'No market data available'}
              </div>
            )}
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-[#636E72] text-sm mb-1">
            Quantity
            {form.side === 'SELL' && maxSellQuantity !== null ? (
              <span className="text-[#B2BEC3] ml-2">(max owned: {maxSellQuantity})</span>
            ) : (
              <span className="text-[#B2BEC3] ml-2">(max: {safetyLimits?.maxOrderSize || 100})</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            max={form.side === 'SELL' && maxSellQuantity !== null ? maxSellQuantity : (safetyLimits?.maxOrderSize || 100)}
            value={form.quantity}
            onChange={(e) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
            className={`w-full bg-[#FEFEFE] border rounded-lg px-4 py-3 text-[#2D3436] focus:outline-none ${
              sellError || exceedsMaxSize
                ? 'border-[#C0736D] focus:border-[#C0736D]'
                : isLargeOrder
                  ? 'border-[#C9A962] focus:border-[#C9A962]'
                  : 'border-[#E8E8E6] focus:border-[#7C9885]'
            }`}
          />
          {sellError && (
            <p className="text-[#C0736D] text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {sellError}
            </p>
          )}
          {!sellError && exceedsMaxSize && (
            <p className="text-[#C0736D] text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Exceeds max order size ({safetyLimits?.maxOrderSize || 100})
            </p>
          )}
          {!sellError && isLargeOrder && !exceedsMaxSize && (
            <p className="text-[#C9A962] text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Large order - will require confirmation
            </p>
          )}
          {form.side === 'SELL' && maxSellQuantity !== null && maxSellQuantity > 0 && !sellError && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(maxSellQuantity / 4) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(maxSellQuantity / 2) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(maxSellQuantity * 0.75) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: maxSellQuantity }))}
                className="flex-1 text-xs py-1 px-2 bg-[#C0736D]/10 text-[#C0736D] rounded hover:bg-[#C0736D]/20"
              >
                100%
              </button>
            </div>
          )}
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-[#636E72] text-sm mb-1">Order Type</label>
          <select
            value={form.orderType}
            onChange={(e) => setForm(prev => ({ ...prev, orderType: e.target.value, limitPrice: '', stopPrice: '' }))}
            className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
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
            <label className="block text-[#636E72] text-sm mb-1">Stop Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.stopPrice}
              onChange={(e) => setForm(prev => ({ ...prev, stopPrice: e.target.value }))}
              placeholder="Enter stop trigger price"
              className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
            />
            {currentMarketData && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setStopToPrice(currentMarketData.bid)}
                  className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
                >
                  Bid ({formatPrice(currentMarketData.bid)})
                </button>
                <button
                  type="button"
                  onClick={() => setStopToPrice(currentMarketData.last)}
                  className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
                >
                  Last ({formatPrice(currentMarketData.last)})
                </button>
                <button
                  type="button"
                  onClick={() => setStopToPrice(currentMarketData.ask)}
                  className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
                >
                  Ask ({formatPrice(currentMarketData.ask)})
                </button>
              </div>
            )}
            <p className="text-xs text-[#B2BEC3] mt-1">Order triggers when price reaches this level</p>
          </div>
        )}

        {/* Limit Price (for Limit and Stop Limit) */}
        {currentOrderType?.requiresLimit && (
          <div>
            <label className="block text-[#636E72] text-sm mb-1">Limit Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.limitPrice}
              onChange={(e) => setForm(prev => ({ ...prev, limitPrice: e.target.value }))}
              placeholder="Enter limit price"
              className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
            />
            {currentMarketData && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setLimitToPrice(currentMarketData.bid)}
                  className="flex-1 text-xs py-1 px-2 bg-[#7C9885]/10 text-[#7C9885] rounded hover:bg-[#7C9885]/20"
                >
                  Bid ({formatPrice(currentMarketData.bid)})
                </button>
                <button
                  type="button"
                  onClick={() => setLimitToPrice(currentMarketData.midPrice)}
                  className="flex-1 text-xs py-1 px-2 bg-[#6B7B8A]/10 text-[#6B7B8A] rounded hover:bg-[#6B7B8A]/20"
                >
                  Mid ({formatPrice(currentMarketData.midPrice)})
                </button>
                <button
                  type="button"
                  onClick={() => setLimitToPrice(currentMarketData.ask)}
                  className="flex-1 text-xs py-1 px-2 bg-[#C0736D]/10 text-[#C0736D] rounded hover:bg-[#C0736D]/20"
                >
                  Ask ({formatPrice(currentMarketData.ask)})
                </button>
              </div>
            )}
            <p className="text-xs text-[#B2BEC3] mt-1">
              {form.side === 'BUY' ? 'Maximum price to pay' : 'Minimum price to receive'}
            </p>
          </div>
        )}

        {/* Estimated Order Value & Balance Check */}
        {form.side === 'BUY' && estimatedPrice > 0 && (
          <div className={`rounded-lg p-3 ${insufficientBalance ? 'bg-[#C0736D]/10 border border-[#C0736D]/30' : 'bg-[#F5F6F4]'}`}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-[#636E72]">Estimated Cost</span>
              <span className="text-[#2D3436] font-medium">€{estimatedOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-[#636E72]">+ Buffer (1%)</span>
              <span className="text-[#636E72]">€{(estimatedOrderValue * 0.01).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E8E8E6]">
              <span className="text-[#636E72]">Available Cash</span>
              <span className={`font-medium ${insufficientBalance ? 'text-[#C0736D]' : 'text-[#7C9885]'}`}>
                €{available.toFixed(2)}
              </span>
            </div>
            {insufficientBalance && (
              <div className="mt-2 flex items-center gap-2 text-[#C0736D] text-xs">
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
              ? 'bg-[#C0736D]/20 text-[#C0736D] cursor-not-allowed'
              : 'bg-[#7C9885] text-white hover:bg-[#6B8A74] disabled:opacity-50 disabled:cursor-not-allowed'
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
