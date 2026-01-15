import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { TrendingUp, TrendingDown, RefreshCw, Clock, AlertTriangle, Wallet, PiggyBank, BarChart3, Eye } from 'lucide-react';
import HoldingsModal from './HoldingsModal';

// Helper to format time ago
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function PortfolioOverview() {
  const {
    positions,
    portfolioValue,
    cashBalance,
    availableFunds,
    unrealizedPnL,
    unrealizedPnLPercent,
    totalValue,
    fetchPositions,
    loading,
    isDataStale,
    lastPositionsUpdate,
    safetyLimits,
    isLive,
    tradingMode
  } = useTrading();

  // Holdings modal state
  const [holdingsSymbol, setHoldingsSymbol] = useState(null);

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercent = (value) => {
    const num = parseFloat(value) || 0;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  // Use backend-calculated values, with fallback to local calculation
  const displayPortfolioValue = portfolioValue > 0
    ? portfolioValue
    : positions.reduce((sum, p) => sum + (parseFloat(p.market_value) || 0), 0);

  const displayUnrealizedPnL = unrealizedPnL !== 0
    ? unrealizedPnL
    : positions.reduce((sum, p) => sum + (parseFloat(p.unrealized_pnl) || 0), 0);

  const displayPnLPercent = unrealizedPnLPercent !== 0
    ? unrealizedPnLPercent
    : (() => {
        const totalCost = positions.reduce((sum, p) => {
          const qty = parseFloat(p.quantity) || 0;
          const avg = parseFloat(p.avg_cost) || 0;
          return sum + (qty * avg);
        }, 0);
        return totalCost > 0 ? (displayUnrealizedPnL / totalCost * 100) : 0;
      })();

  const displayAvailableFunds = availableFunds > 0 ? availableFunds : cashBalance;

  // Check if any positions have stale prices
  const hasStaleData = isDataStale || positions.some(p => p.price_stale);

  return (
    <div className={`bg-[#1A1B1F] border rounded-xl overflow-hidden ${isLive ? 'border-red-600/50' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Portfolio Overview</h2>
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isLive
              ? 'bg-red-600/30 text-red-400 border border-red-600'
              : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
          }`}>
            {tradingMode || 'PAPER'}
          </div>
          {hasStaleData && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 border border-orange-600/40 rounded text-xs text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Stale {formatTimeAgo(lastPositionsUpdate)}</span>
            </div>
          )}
        </div>
        <button
          onClick={fetchPositions}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Portfolio Summary - Always visible at top */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-700 bg-gray-800/30">
        {/* Stock Market Value (positions only) */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <BarChart3 className="w-3 h-3" />
            Positions Value
          </div>
          <div className="text-lg font-bold text-white">{formatCurrency(displayPortfolioValue)}</div>
        </div>

        {/* Available Cash / Liquidity */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Wallet className="w-3 h-3" />
            Available Cash
          </div>
          <div className={`text-lg font-bold ${displayAvailableFunds > 0 ? 'text-green-400' : 'text-white'}`}>
            {formatCurrency(displayAvailableFunds)}
          </div>
        </div>

        {/* Net Liquidation = positions + cash */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <PiggyBank className="w-3 h-3" />
            Net Liquidation
          </div>
          <div className="text-lg font-bold text-white">
            {formatCurrency(totalValue > 0 ? totalValue : displayPortfolioValue + displayAvailableFunds)}
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            {displayUnrealizedPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Unrealized P&L
          </div>
          <div className={`text-lg font-bold flex items-center gap-2 ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(displayUnrealizedPnL)}
            <span className="text-sm">({formatPercent(displayPnLPercent)})</span>
          </div>
        </div>
      </div>

      {/* Daily Limits */}
      {safetyLimits && (
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-2">Daily Trading Limits</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Orders Remaining</div>
                <div className="text-white font-medium">
                  {safetyLimits.ordersRemaining ?? '-'} / {safetyLimits.maxDailyOrders ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Exposure Remaining</div>
                <div className="text-white font-medium">
                  {formatCurrency(safetyLimits.exposureRemaining ?? 0)} / {formatCurrency(safetyLimits.maxDailyExposure ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Symbol</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Qty</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Avg Cost</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Last Price</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Market Value</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">P&L (EUR)</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">P&L %</th>
              <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Holdings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-8">
                  No positions found
                </td>
              </tr>
            ) : (
              positions.map((position, idx) => {
                const qty = parseFloat(position.quantity) || 0;
                const avgCost = parseFloat(position.avg_cost) || 0;
                const lastPrice = parseFloat(position.last_price) || avgCost;
                const marketValue = parseFloat(position.market_value) || (qty * lastPrice);
                const pnl = parseFloat(position.unrealized_pnl) || (marketValue - (qty * avgCost));
                const pnlPercent = position.unrealized_pnl_pct ?? (avgCost > 0 ? ((lastPrice - avgCost) / avgCost * 100) : 0);
                const isPositive = pnl >= 0;
                const isStale = position.price_stale;

                return (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-white">{position.symbol}</div>
                        {isStale && (
                          <AlertTriangle className="w-3 h-3 text-orange-400" title="Price may be stale" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{position.currency}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {qty.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatCurrency(avgCost)}
                    </td>
                    <td className={`px-4 py-3 text-right ${isStale ? 'text-orange-400' : 'text-white'}`}>
                      {formatCurrency(lastPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {formatCurrency(marketValue)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(pnl)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(pnlPercent)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setHoldingsSymbol(position.symbol)}
                        className="p-1.5 text-gray-400 hover:text-[#28EBCF] hover:bg-[#28EBCF]/10 rounded transition-colors"
                        title="View holdings"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {/* Totals Footer */}
          {positions.length > 0 && (
            <tfoot className="bg-gray-800/50 border-t border-gray-700">
              <tr>
                <td className="px-4 py-3 font-bold text-white">Total</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-bold text-white">
                  {formatCurrency(displayPortfolioValue)}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(displayUnrealizedPnL)}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(displayPnLPercent)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Holdings Modal */}
      <HoldingsModal
        symbol={holdingsSymbol}
        isOpen={!!holdingsSymbol}
        onClose={() => setHoldingsSymbol(null)}
      />
    </div>
  );
}
