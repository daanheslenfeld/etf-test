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
      <div className="mt-8 bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="animate-pulse">
          <div className="h-6 bg-[#ECEEED] rounded-lg w-48 mb-3"></div>
          <div className="h-4 bg-[#ECEEED] rounded-lg w-32"></div>
        </div>
      </div>
    );
  }

  // Don't show if no positions
  if (positions.length === 0 && portfolioValue === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-[#F5F6F4] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-[#7C9885]/10 rounded-xl">
            <Briefcase className="w-5 h-5 text-[#7C9885]" />
          </div>
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-semibold text-[#2D3436]">Je Huidige Portfolio</h2>
            <p className="text-sm text-[#636E72] mt-0.5">
              {positions.length} positie{positions.length !== 1 ? 's' : ''} • {formatCurrency(portfolioValue)}
              {unrealizedPnL !== 0 && (
                <span className={`ml-2 font-medium ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                  ({formatPercent(unrealizedPnLPercent)})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!connected && (
            <span className="text-xs text-[#C9A962] px-2.5 py-1 bg-[#C9A962]/10 rounded-full font-medium">Offline</span>
          )}
          <div className="p-2 rounded-lg hover:bg-[#ECEEED] transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#636E72]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#636E72]" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content - positions table */}
      {isExpanded && (
        <div className="border-t border-[#E8E8E6]">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-[#F5F6F4]">
            <div>
              <div className="text-xs text-[#B2BEC3] font-medium mb-1.5">Totale Waarde</div>
              <div className="text-sm font-semibold text-[#2D3436] tabular-nums">{formatCurrency(totalValue)}</div>
            </div>
            <div>
              <div className="text-xs text-[#B2BEC3] font-medium mb-1.5">Belegd</div>
              <div className="text-sm font-semibold text-[#2D3436] tabular-nums">{formatCurrency(portfolioValue)}</div>
            </div>
            <div>
              <div className="text-xs text-[#B2BEC3] font-medium mb-1.5">Cash</div>
              <div className={`text-sm font-semibold tabular-nums ${cashBalance > 0 ? 'text-[#7C9885]' : 'text-[#2D3436]'}`}>
                {formatCurrency(cashBalance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#B2BEC3] font-medium mb-1.5">Rendement</div>
              <div className={`text-sm font-semibold tabular-nums ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                {formatCurrency(unrealizedPnL)} ({formatPercent(unrealizedPnLPercent)})
              </div>
            </div>
          </div>

          {/* Positions table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F6F4]">
                <tr>
                  <th className="text-left text-[#636E72] text-xs font-medium px-5 py-3">Symbool</th>
                  <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Aantal</th>
                  <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3 hidden sm:table-cell">Gem. Koers</th>
                  <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Huidige Koers</th>
                  <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Waarde</th>
                  <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3 hidden md:table-cell">W/V</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E6]">
                {positions.map((position, idx) => {
                  const qty = parseFloat(position.quantity) || 0;
                  const avgCost = parseFloat(position.avg_cost) || 0;
                  const lastPrice = parseFloat(position.last_price) || avgCost;
                  const marketValue = parseFloat(position.market_value) || 0;
                  const pnl = parseFloat(position.unrealized_pnl) || 0;
                  const pnlPercent = parseFloat(position.unrealized_pnl_pct) || 0;
                  const isPositive = pnl >= 0;

                  return (
                    <tr key={idx} className="hover:bg-[#F5F6F4] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#2D3436] text-sm">{position.symbol}</div>
                        <div className="text-xs text-[#B2BEC3]">{position.currency}</div>
                      </td>
                      <td className="px-5 py-4 text-right text-[#2D3436] text-sm tabular-nums">
                        {qty.toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-right text-[#636E72] text-sm hidden sm:table-cell tabular-nums">
                        {formatCurrency(avgCost)}
                      </td>
                      <td className="px-5 py-4 text-right text-[#2D3436] text-sm tabular-nums">
                        {formatCurrency(lastPrice)}
                      </td>
                      <td className="px-5 py-4 text-right text-[#2D3436] font-medium text-sm tabular-nums">
                        {formatCurrency(marketValue)}
                      </td>
                      <td className={`px-5 py-4 text-right font-medium text-sm hidden md:table-cell ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                        <div className="flex items-center justify-end gap-1.5 tabular-nums">
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
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
            <div className="p-10 text-center text-[#B2BEC3]">
              Geen posities gevonden
            </div>
          )}
        </div>
      )}
    </div>
  );
}
