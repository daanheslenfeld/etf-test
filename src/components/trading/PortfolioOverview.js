import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';

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
  const { positions, portfolioValue, cashBalance, todayPnL, fetchPositions, loading, isDataStale, lastPositionsUpdate, safetyLimits, isLive, tradingMode } = useTrading();

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercent = (value) => {
    const num = parseFloat(value) || 0;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const calculatePnLPercent = (position) => {
    const avgCost = parseFloat(position.avg_cost) || 0;
    const qty = parseFloat(position.quantity) || 0;
    const totalCost = avgCost * qty;
    if (totalCost === 0) return 0;
    const unrealizedPnL = parseFloat(position.unrealized_pnl) || 0;
    return (unrealizedPnL / totalCost) * 100;
  };

  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + (parseFloat(p.unrealized_pnl) || 0), 0);
  const totalMarketValue = positions.reduce((sum, p) => sum + (parseFloat(p.market_value) || 0), 0);

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
          {isDataStale && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 border border-orange-600/40 rounded text-xs text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Cached {formatTimeAgo(lastPositionsUpdate)}</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-700">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Portfolio Value</div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalMarketValue)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Cash Balance</div>
          <div className="text-xl font-bold text-white">{formatCurrency(cashBalance)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Unrealized P&L</div>
          <div className={`text-xl font-bold flex items-center gap-1 ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalUnrealizedPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {formatCurrency(totalUnrealizedPnL)}
          </div>
        </div>
      </div>

      {/* Daily Limits */}
      {safetyLimits && (
        <div className="px-4 pb-4">
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
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Market Value</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">P&L</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">P&L %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  No positions found
                </td>
              </tr>
            ) : (
              positions.map((position, idx) => {
                const pnl = parseFloat(position.unrealized_pnl) || 0;
                const pnlPercent = calculatePnLPercent(position);
                const isPositive = pnl >= 0;

                return (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{position.symbol}</div>
                      <div className="text-xs text-gray-500">{position.currency}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {parseFloat(position.quantity).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatCurrency(position.avg_cost)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {formatCurrency(position.market_value)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(pnl)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(pnlPercent)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
