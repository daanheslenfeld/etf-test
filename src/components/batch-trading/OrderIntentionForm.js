import React, { useState, useMemo, useEffect } from 'react';
import { useBatchTrading } from '../../context/BatchTradingContext';
import { useTrading } from '../../context/TradingContext';
import { Plus, Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { TRADABLE_ETFS, getTradableCount } from '../../data/tradableETFs';

export default function OrderIntentionForm({ onSuccess }) {
  const { createIntention, availableBalance, holdings, submitting, error, clearError } = useBatchTrading();
  const { marketData } = useTrading();

  const [form, setForm] = useState({
    symbol: '',
    conid: 0,
    side: 'BUY',
    quantity: 1,
    orderType: 'MKT',
    limitPrice: '',
    isin: '',
    name: '',
  });

  const [selectedETF, setSelectedETF] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Use static TRADABLE_ETFS data
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

  // Set default ETF on load
  useEffect(() => {
    if (tradableETFsList.length > 0 && !form.conid) {
      const first = tradableETFsList[0];
      setForm(prev => ({
        ...prev,
        symbol: first.symbol,
        conid: first.conid,
        isin: first.isin,
        name: first.name
      }));
      setSelectedETF(first);
    }
  }, [tradableETFsList, form.conid]);

  // Calculate estimated cost
  const estimatedPrice = form.limitPrice
    ? parseFloat(form.limitPrice)
    : currentMarketData?.last || currentMarketData?.ask || 0;
  const estimatedCost = estimatedPrice * form.quantity;
  const requiredWithBuffer = estimatedCost * 1.02; // 2% buffer

  // Validation
  const insufficientBalance = form.side === 'BUY' && requiredWithBuffer > availableBalance && availableBalance > 0;

  // Check if user owns shares for SELL
  const holding = holdings.find(h => h.symbol === form.symbol);
  const ownedQuantity = holding ? holding.quantity : 0;
  const insufficientShares = form.side === 'SELL' && form.quantity > ownedQuantity;

  const handleSymbolChange = (e) => {
    const symbol = e.target.value;
    const etf = tradableETFsList.find(e => e.symbol === symbol);
    if (etf) {
      setForm(prev => ({
        ...prev,
        symbol: etf.symbol,
        conid: etf.conid,
        isin: etf.isin,
        name: etf.name,
        limitPrice: ''
      }));
      setSelectedETF(etf);
    }
    setLocalError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setLocalError(null);
    setSuccess(null);
    clearError();

    if (!form.conid || form.quantity < 1) {
      setLocalError('Please select an ETF and enter a valid quantity');
      return;
    }

    if (form.orderType === 'LMT' && !form.limitPrice) {
      setLocalError('Limit price is required for limit orders');
      return;
    }

    if (insufficientBalance) {
      setLocalError('Insufficient balance for this order');
      return;
    }

    if (insufficientShares) {
      setLocalError(`Cannot sell ${form.quantity} shares. You only own ${ownedQuantity}.`);
      return;
    }

    const result = await createIntention({
      symbol: form.symbol,
      conid: form.conid,
      side: form.side,
      quantity: parseInt(form.quantity),
      orderType: form.orderType,
      limitPrice: form.limitPrice ? parseFloat(form.limitPrice) : null,
      estimatedPrice: estimatedPrice || null,
      isin: form.isin,
      name: form.name,
    });

    if (result.success) {
      setSuccess('Order intention submitted! Will be executed in next batch.');
      setForm(prev => ({ ...prev, quantity: 1, limitPrice: '' }));
      if (onSuccess) onSuccess(result.intention);
    } else {
      setLocalError(result.message);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return `€${price.toFixed(2)}`;
  };

  return (
    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#7C9885]" />
          Submit Order Intention
        </h3>
        <div className="px-2 py-0.5 rounded text-xs font-bold bg-[#7C9885]/10 text-[#7C9885] border border-[#7C9885]/30">
          BATCH
        </div>
      </div>

      <div className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#7C9885]" />
            <span className="text-sm text-[#7C9885]">{success}</span>
          </div>
        )}
        {(localError || error) && (
          <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C0736D]" />
            <span className="text-sm text-[#C0736D]">{localError || error}</span>
          </div>
        )}

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

        {/* Symbol Select */}
        <div>
          <label className="block text-[#636E72] text-sm mb-1">
            Symbol
            <span className="text-[#B2BEC3] ml-2 text-xs">({getTradableCount()} tradable)</span>
          </label>
          <select
            value={form.symbol}
            onChange={handleSymbolChange}
            className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
          >
            {tradableETFsList.map(etf => (
              <option key={etf.isin || etf.conid} value={etf.symbol}>
                {etf.symbol} - {etf.name}
              </option>
            ))}
          </select>
        </div>

        {/* Market Data Display */}
        {form.symbol && currentMarketData && (
          <div className="bg-[#F5F6F4] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#636E72]">Current Price</span>
              {currentMarketData.delayed && (
                <span className="text-xs text-[#C9A962] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Delayed
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#FEFEFE] rounded p-2 border border-[#E8E8E6]">
                <div className="text-xs text-[#636E72]">Bid</div>
                <div className="text-[#7C9885] font-mono font-medium">{formatPrice(currentMarketData.bid)}</div>
              </div>
              <div className="bg-[#FEFEFE] rounded p-2 border border-[#E8E8E6]">
                <div className="text-xs text-[#636E72]">Last</div>
                <div className="text-[#2D3436] font-mono font-medium">{formatPrice(currentMarketData.last)}</div>
              </div>
              <div className="bg-[#FEFEFE] rounded p-2 border border-[#E8E8E6]">
                <div className="text-xs text-[#636E72]">Ask</div>
                <div className="text-[#C0736D] font-mono font-medium">{formatPrice(currentMarketData.ask)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-[#636E72] text-sm mb-1">
            Quantity
            {form.side === 'SELL' && ownedQuantity > 0 && (
              <span className="text-[#B2BEC3] ml-2">(owned: {ownedQuantity})</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
            className={`w-full bg-[#FEFEFE] border rounded-lg px-4 py-3 text-[#2D3436] focus:outline-none ${
              insufficientShares
                ? 'border-[#C0736D] focus:border-[#C0736D]'
                : 'border-[#E8E8E6] focus:border-[#7C9885]'
            }`}
          />
          {form.side === 'SELL' && ownedQuantity > 0 && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(ownedQuantity / 4) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: Math.floor(ownedQuantity / 2) || 1 }))}
                className="flex-1 text-xs py-1 px-2 bg-[#ECEEED] text-[#636E72] rounded hover:bg-[#E8E8E6]"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, quantity: ownedQuantity }))}
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
            onChange={(e) => setForm(prev => ({ ...prev, orderType: e.target.value, limitPrice: '' }))}
            className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg px-4 py-3 text-[#2D3436] focus:border-[#7C9885] focus:outline-none"
          >
            <option value="MKT">Market</option>
            <option value="LMT">Limit</option>
          </select>
        </div>

        {/* Limit Price */}
        {form.orderType === 'LMT' && (
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
                  onClick={() => setForm(prev => ({ ...prev, limitPrice: currentMarketData.bid?.toFixed(2) || '' }))}
                  className="flex-1 text-xs py-1 px-2 bg-[#7C9885]/10 text-[#7C9885] rounded hover:bg-[#7C9885]/20"
                >
                  Bid
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, limitPrice: currentMarketData.midPrice?.toFixed(2) || '' }))}
                  className="flex-1 text-xs py-1 px-2 bg-[#6B7B8A]/10 text-[#6B7B8A] rounded hover:bg-[#6B7B8A]/20"
                >
                  Mid
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, limitPrice: currentMarketData.ask?.toFixed(2) || '' }))}
                  className="flex-1 text-xs py-1 px-2 bg-[#C0736D]/10 text-[#C0736D] rounded hover:bg-[#C0736D]/20"
                >
                  Ask
                </button>
              </div>
            )}
          </div>
        )}

        {/* Estimated Cost (BUY only) */}
        {form.side === 'BUY' && estimatedPrice > 0 && (
          <div className={`rounded-lg p-3 ${insufficientBalance ? 'bg-[#C0736D]/10 border border-[#C0736D]/30' : 'bg-[#F5F6F4]'}`}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-[#636E72]">Estimated Cost</span>
              <span className="text-[#2D3436] font-medium">€{estimatedCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-[#636E72]">+ Buffer (2%)</span>
              <span className="text-[#636E72]">€{(estimatedCost * 0.02).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E8E8E6]">
              <span className="text-[#636E72]">Available Balance</span>
              <span className={`font-medium ${insufficientBalance ? 'text-[#C0736D]' : 'text-[#7C9885]'}`}>
                €{availableBalance.toFixed(2)}
              </span>
            </div>
            {insufficientBalance && (
              <div className="mt-2 flex items-center gap-2 text-[#C0736D] text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Insufficient funds</span>
              </div>
            )}
          </div>
        )}

        {/* Batch Info */}
        <div className="bg-[#7C9885]/5 rounded-lg p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#7C9885]" />
          <span className="text-sm text-[#636E72]">
            Orders are executed daily at <span className="font-medium text-[#2D3436]">14:00 CET</span>
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || insufficientBalance || insufficientShares || !form.conid}
          className={`w-full py-3 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            insufficientBalance || insufficientShares
              ? 'bg-[#C0736D]/20 text-[#C0736D] cursor-not-allowed'
              : 'bg-[#7C9885] text-white hover:bg-[#6B8A74] disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Submitting...
            </>
          ) : insufficientBalance ? (
            <>
              <ShieldAlert className="w-5 h-5" />
              Insufficient Balance
            </>
          ) : insufficientShares ? (
            <>
              <ShieldAlert className="w-5 h-5" />
              Insufficient Shares
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Submit {form.side} Order
            </>
          )}
        </button>
      </div>
    </div>
  );
}
