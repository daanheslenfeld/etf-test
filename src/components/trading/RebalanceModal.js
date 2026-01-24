import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { X, Scale, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown, Check } from 'lucide-react';

export default function RebalanceModal({ isOpen, onClose, positions, portfolioValue, availableCash }) {
  const { addToBasket, marketData, tradableETFs, validateBuyOrder } = useTrading();

  // Target weights for each position (keyed by symbol)
  const [targetWeights, setTargetWeights] = useState({});
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Initialize target weights from current positions
  useEffect(() => {
    if (isOpen && positions.length > 0 && portfolioValue > 0) {
      const weights = {};
      positions.forEach(pos => {
        const marketValue = parseFloat(pos.market_value) || 0;
        const currentWeight = (marketValue / portfolioValue) * 100;
        weights[pos.symbol] = parseFloat(currentWeight.toFixed(1));
      });
      setTargetWeights(weights);
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, positions, portfolioValue]);

  // Calculate total weight
  const totalWeight = useMemo(() => {
    return Object.values(targetWeights).reduce((sum, w) => sum + (parseFloat(w) || 0), 0);
  }, [targetWeights]);

  // Check if weights are valid
  const isValidWeights = Math.abs(totalWeight - 100) < 0.1;

  // Calculate required trades
  const trades = useMemo(() => {
    if (!isValidWeights || portfolioValue <= 0) return [];

    const totalValue = portfolioValue + availableCash;
    const result = [];

    positions.forEach(pos => {
      const symbol = pos.symbol;
      const currentValue = parseFloat(pos.market_value) || 0;
      const currentQty = parseFloat(pos.quantity) || 0;
      const targetWeight = targetWeights[symbol] || 0;
      const targetValue = (targetWeight / 100) * totalValue;
      const diff = targetValue - currentValue;

      // Get current price from market data or position
      const md = marketData[symbol];
      const price = md?.last || md?.midPrice || md?.ask || md?.bid || parseFloat(pos.last_price) || 0;

      if (price <= 0) return;

      const sharesDiff = Math.round(diff / price);

      if (sharesDiff !== 0) {
        // Get conid from tradability data
        const tradInfo = Object.values(tradableETFs).find(t => t.contract?.symbol === symbol);
        const conid = tradInfo?.contract?.conId || pos.conid;

        result.push({
          symbol,
          conid,
          side: sharesDiff > 0 ? 'BUY' : 'SELL',
          quantity: Math.abs(sharesDiff),
          currentQty,
          price,
          estimatedValue: Math.abs(sharesDiff * price),
          currentValue,
          targetValue,
          diff,
        });
      }
    });

    // Sort: SELL orders first, then BUY
    return result.sort((a, b) => {
      if (a.side === 'SELL' && b.side === 'BUY') return -1;
      if (a.side === 'BUY' && b.side === 'SELL') return 1;
      return 0;
    });
  }, [positions, targetWeights, portfolioValue, availableCash, marketData, tradableETFs, isValidWeights]);

  // Calculate totals
  const totalBuyValue = trades.filter(t => t.side === 'BUY').reduce((sum, t) => sum + t.estimatedValue, 0);
  const totalSellValue = trades.filter(t => t.side === 'SELL').reduce((sum, t) => sum + t.estimatedValue, 0);
  const netCashFlow = totalSellValue - totalBuyValue;

  // Check if we have enough cash for buys (after sells)
  const cashAfterSells = availableCash + totalSellValue;
  const insufficientCash = totalBuyValue > cashAfterSells * 1.01; // 1% buffer

  // Check for overselling
  const oversellError = trades.find(t => t.side === 'SELL' && t.quantity > t.currentQty);

  // Handle weight change
  const handleWeightChange = (symbol, value) => {
    const numValue = parseFloat(value) || 0;
    setTargetWeights(prev => ({
      ...prev,
      [symbol]: Math.max(0, Math.min(100, numValue))
    }));
    setError(null);
  };

  // Handle add to basket
  const handleAddToBasket = () => {
    if (!isValidWeights) {
      setError('Target weights must total 100%');
      return;
    }

    if (insufficientCash) {
      setError(`Insufficient funds. Need €${totalBuyValue.toFixed(2)}, will have €${cashAfterSells.toFixed(2)} after sells`);
      return;
    }

    if (oversellError) {
      setError(`Cannot sell ${oversellError.quantity} shares of ${oversellError.symbol}. You only own ${oversellError.currentQty}`);
      return;
    }

    if (trades.length === 0) {
      setError('No trades needed - portfolio is already balanced');
      return;
    }

    // Add all trades to basket (SELL first, then BUY)
    trades.forEach(trade => {
      if (trade.conid) {
        addToBasket({
          symbol: trade.symbol,
          conid: trade.conid,
          side: trade.side,
          quantity: trade.quantity,
          orderType: 'MKT', // Market orders for rebalancing
        });
      }
    });

    onClose();
  };

  // Quick rebalance options
  const setEqualWeights = () => {
    const equalWeight = parseFloat((100 / positions.length).toFixed(1));
    const weights = {};
    positions.forEach((pos, idx) => {
      // Give remainder to last position to make exactly 100%
      if (idx === positions.length - 1) {
        const usedWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        weights[pos.symbol] = parseFloat((100 - usedWeight).toFixed(1));
      } else {
        weights[pos.symbol] = equalWeight;
      }
    });
    setTargetWeights(weights);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2D3436]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl max-w-2xl w-full shadow-[0_8px_32px_rgba(45,52,54,0.12)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E8E6] flex items-center justify-between bg-[#6B7B8A]/10">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-[#6B7B8A]" />
            <div>
              <h2 className="text-lg font-bold text-[#2D3436]">Rebalance Portfolio</h2>
              <p className="text-sm text-[#636E72]">Set target weights for each position</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#F5F6F4] rounded-lg p-3">
              <div className="text-xs text-[#636E72]">Portfolio Value</div>
              <div className="text-[#2D3436] font-bold">{formatCurrency(portfolioValue)}</div>
            </div>
            <div className="bg-[#7C9885]/10 rounded-lg p-3">
              <div className="text-xs text-[#636E72]">Available Cash</div>
              <div className="text-[#7C9885] font-bold">{formatCurrency(availableCash)}</div>
            </div>
            <div className="bg-[#F5F6F4] rounded-lg p-3">
              <div className="text-xs text-[#636E72]">Total Value</div>
              <div className="text-[#2D3436] font-bold">{formatCurrency(portfolioValue + availableCash)}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={setEqualWeights}
              className="px-3 py-1.5 bg-[#6B7B8A]/10 text-[#6B7B8A] border border-[#6B7B8A]/30 rounded-lg text-sm hover:bg-[#6B7B8A]/20"
            >
              Equal Weights
            </button>
          </div>

          {/* Weight Inputs */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-12 gap-2 text-xs text-[#636E72] px-2">
              <div className="col-span-3">Symbol</div>
              <div className="col-span-2 text-right">Current %</div>
              <div className="col-span-3 text-center">Target %</div>
              <div className="col-span-2 text-right">Current Value</div>
              <div className="col-span-2 text-right">Target Value</div>
            </div>

            {positions.map(pos => {
              const currentValue = parseFloat(pos.market_value) || 0;
              const currentWeight = portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0;
              const targetWeight = targetWeights[pos.symbol] || 0;
              const totalValue = portfolioValue + availableCash;
              const targetValue = (targetWeight / 100) * totalValue;
              const diff = targetValue - currentValue;

              return (
                <div key={pos.symbol} className="grid grid-cols-12 gap-2 items-center bg-[#F5F6F4] rounded-lg p-2">
                  <div className="col-span-3">
                    <div className="text-[#2D3436] font-medium">{pos.symbol}</div>
                    <div className="text-xs text-[#B2BEC3]">{pos.quantity} shares</div>
                  </div>
                  <div className="col-span-2 text-right text-[#636E72]">
                    {currentWeight.toFixed(1)}%
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={targetWeight}
                        onChange={(e) => handleWeightChange(pos.symbol, e.target.value)}
                        className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded px-2 py-1 text-[#2D3436] text-center text-sm focus:border-[#7C9885] focus:outline-none"
                      />
                      <span className="text-[#636E72] text-sm">%</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-[#636E72] text-sm">
                    {formatCurrency(currentValue)}
                  </div>
                  <div className="col-span-2 text-right">
                    <div className={`text-sm ${diff >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                      {formatCurrency(targetValue)}
                    </div>
                    <div className={`text-xs ${diff >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Weight Indicator */}
          <div className={`rounded-lg p-3 mb-4 ${isValidWeights ? 'bg-[#7C9885]/10 border border-[#7C9885]/30' : 'bg-[#C0736D]/10 border border-[#C0736D]/30'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[#636E72]">Total Target Weight</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${isValidWeights ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                  {totalWeight.toFixed(1)}%
                </span>
                {isValidWeights ? (
                  <Check className="w-4 h-4 text-[#7C9885]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#C0736D]" />
                )}
              </div>
            </div>
            {!isValidWeights && (
              <p className="text-[#C0736D] text-xs mt-1">
                Weights must total 100% (currently {totalWeight > 100 ? 'over' : 'under'} by {Math.abs(100 - totalWeight).toFixed(1)}%)
              </p>
            )}
          </div>

          {/* Required Trades Preview */}
          {isValidWeights && trades.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[#2D3436] font-medium mb-2 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#6B7B8A]" />
                Required Trades ({trades.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {trades.map((trade, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#F5F6F4] rounded p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        trade.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                      }`}>
                        {trade.side}
                      </span>
                      <span className="text-[#2D3436]">{trade.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[#636E72]">{trade.quantity} shares</div>
                      <div className="text-[#B2BEC3] text-xs">{formatCurrency(trade.estimatedValue)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cash Flow Summary */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="bg-[#C0736D]/10 rounded p-2 text-center">
                  <div className="text-[#C0736D] font-medium">{formatCurrency(totalSellValue)}</div>
                  <div className="text-xs text-[#B2BEC3]">Sells</div>
                </div>
                <div className="bg-[#7C9885]/10 rounded p-2 text-center">
                  <div className="text-[#7C9885] font-medium">{formatCurrency(totalBuyValue)}</div>
                  <div className="text-xs text-[#B2BEC3]">Buys</div>
                </div>
                <div className={`rounded p-2 text-center ${netCashFlow >= 0 ? 'bg-[#7C9885]/10' : 'bg-[#C0736D]/10'}`}>
                  <div className={netCashFlow >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'} >
                    {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                  </div>
                  <div className="text-xs text-[#B2BEC3]">Net Cash</div>
                </div>
              </div>
            </div>
          )}

          {isValidWeights && trades.length === 0 && (
            <div className="bg-[#F5F6F4] rounded-lg p-4 text-center text-[#636E72]">
              Portfolio is already balanced according to target weights
            </div>
          )}

          {/* Warnings */}
          {insufficientCash && (
            <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C0736D] mt-0.5" />
                <div className="text-sm text-[#C0736D]">
                  <strong>Insufficient funds:</strong> Buys require {formatCurrency(totalBuyValue)},
                  but only {formatCurrency(cashAfterSells)} will be available after sells.
                </div>
              </div>
            </div>
          )}

          {oversellError && (
            <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C0736D] mt-0.5" />
                <div className="text-sm text-[#C0736D]">
                  <strong>Cannot oversell:</strong> Trying to sell {oversellError.quantity} shares of {oversellError.symbol},
                  but only {oversellError.currentQty} owned.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-3 mb-4">
              <p className="text-[#C0736D] text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E8E8E6] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#ECEEED] text-[#636E72] font-medium rounded-lg hover:bg-[#E8E8E6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToBasket}
            disabled={!isValidWeights || trades.length === 0 || insufficientCash || !!oversellError}
            className="flex-1 py-3 bg-[#7C9885] text-white font-bold rounded-lg hover:bg-[#6B8A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Add {trades.length} Orders to Basket
          </button>
        </div>
      </div>
    </div>
  );
}
