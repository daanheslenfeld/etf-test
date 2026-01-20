import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
};

const formatPercent = (value) => {
  const num = parseFloat(value) || 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export default function PortfolioPositionsCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    positions,
    portfolioValue,
    cashBalance,
    totalValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    connected,
    loading,
    brokerLinked
  } = useTrading();

  // Don't show if broker not linked
  if (!brokerLinked) {
    return null;
  }

  // Show loading skeleton
  if (loading && positions.length === 0) {
    return (
      <div className="mt-6 sm:mt-8 bg-[#1A1B1F] border border-gray-800 rounded-xl p-4 sm:p-5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-48 mb-3"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // Don't show if no positions
  if (positions.length === 0 && portfolioValue === 0) {
    return null;
  }

  return (
    <div className="mt-6 sm:mt-8 bg-[#1A1B1F] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-[#28EBCF]" />
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-bold text-white">Je Huidige Portfolio</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {positions.length} positie{positions.length !== 1 ? 's' : ''} • {formatCurrency(portfolioValue)}
              {unrealizedPnL !== 0 && (
                <span className={`ml-2 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ({formatPercent(unrealizedPnLPercent)})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <span className="text-xs text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded">Offline</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content - positions table */}
      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-800/30">
            <div>
              <div className="text-xs text-gray-400 mb-1">Totale Waarde</div>
              <div className="text-sm font-bold text-white">{formatCurrency(totalValue)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Belegd</div>
              <div className="text-sm font-bold text-white">{formatCurrency(portfolioValue)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Cash</div>
              <div className={`text-sm font-bold ${cashBalance > 0 ? 'text-green-400' : 'text-white'}`}>
                {formatCurrency(cashBalance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Rendement</div>
              <div className={`text-sm font-bold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(unrealizedPnL)} ({formatPercent(unrealizedPnLPercent)})
              </div>
            </div>
          </div>

          {/* Positions table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-2">Symbool</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Aantal</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-4 py-2 hidden sm:table-cell">Gem. Koers</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Huidige Koers</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Waarde</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-4 py-2 hidden md:table-cell">W/V</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {positions.map((position, idx) => {
                  const qty = parseFloat(position.quantity) || 0;
                  const avgCost = parseFloat(position.avg_cost) || 0;
                  const lastPrice = parseFloat(position.last_price) || avgCost;
                  const marketValue = parseFloat(position.market_value) || 0;
                  const pnl = parseFloat(position.unrealized_pnl) || 0;
                  const pnlPercent = parseFloat(position.unrealized_pnl_pct) || 0;
                  const isPositive = pnl >= 0;

                  return (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">{position.symbol}</div>
                        <div className="text-xs text-gray-500">{position.currency}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-white text-sm">
                        {qty.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300 text-sm hidden sm:table-cell">
                        {formatCurrency(avgCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-white text-sm">
                        {formatCurrency(lastPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium text-sm">
                        {formatCurrency(marketValue)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium text-sm hidden md:table-cell ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatPercent(pnlPercent)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {positions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Geen posities gevonden
            </div>
          )}
        </div>
      )}
    </div>
  );
}
