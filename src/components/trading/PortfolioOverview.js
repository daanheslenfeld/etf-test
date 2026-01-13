import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function PortfolioOverview() {
  const { positions, portfolioValue, cashBalance, todayPnL, fetchPositions, loading } = useTrading();

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
    <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Portfolio Overview</h2>
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
