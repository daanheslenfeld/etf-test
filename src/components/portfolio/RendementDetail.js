import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import DetailPageHeader, { getETFName } from './DetailPageHeader';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
};

const formatPercent = (value) => {
  const num = parseFloat(value) || 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export default function RendementDetail({ onBack }) {
  const { positions, unrealizedPnL, unrealizedPnLPercent } = useTrading();
  const [sortField, setSortField] = useState('pnl'); // 'pnl' | 'pnlPercent'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const aVal = sortField === 'pnl'
        ? parseFloat(a.unrealized_pnl) || 0
        : parseFloat(a.unrealized_pnl_pct) || 0;
      const bVal = sortField === 'pnl'
        ? parseFloat(b.unrealized_pnl) || 0
        : parseFloat(b.unrealized_pnl_pct) || 0;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [positions, sortField, sortDirection]);

  // Find the max absolute PnL for bar scaling
  const maxAbsPnl = useMemo(() => {
    if (positions.length === 0) return 1;
    const values = positions.map(p =>
      Math.abs(sortField === 'pnl'
        ? parseFloat(p.unrealized_pnl) || 0
        : parseFloat(p.unrealized_pnl_pct) || 0
      )
    );
    return Math.max(...values, 1);
  }, [positions, sortField]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const isPositiveTotal = unrealizedPnL >= 0;

  return (
    <DetailPageHeader title="Rendement" onBack={onBack}>
      {/* Summary Card */}
      <div className={`bg-[#FEFEFE] border rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${isPositiveTotal ? 'border-[#7C9885]/30' : 'border-[#C0736D]/30'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${isPositiveTotal ? 'bg-[#7C9885]/10' : 'bg-[#C0736D]/10'}`}>
            {isPositiveTotal
              ? <TrendingUp className="w-5 h-5 text-[#7C9885]" />
              : <TrendingDown className="w-5 h-5 text-[#C0736D]" />
            }
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] font-medium">Totaal Rendement</div>
            <div className={`text-2xl font-bold tabular-nums ${isPositiveTotal ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
              {formatCurrency(unrealizedPnL)}
            </div>
          </div>
        </div>
        <div className={`text-sm font-medium tabular-nums ${isPositiveTotal ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
          {formatPercent(unrealizedPnLPercent)}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-[#B2BEC3] font-medium mr-1">Sorteer:</span>
        <button
          onClick={() => toggleSort('pnl')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            sortField === 'pnl'
              ? 'bg-[#7C9885] text-white'
              : 'bg-[#FEFEFE] border border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]/40'
          }`}
        >
          EUR
          {sortField === 'pnl' && <ArrowUpDown className="w-3 h-3" />}
        </button>
        <button
          onClick={() => toggleSort('pnlPercent')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            sortField === 'pnlPercent'
              ? 'bg-[#7C9885] text-white'
              : 'bg-[#FEFEFE] border border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]/40'
          }`}
        >
          %
          {sortField === 'pnlPercent' && <ArrowUpDown className="w-3 h-3" />}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FEFEFE] border border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]/40 transition-colors"
        >
          {sortDirection === 'desc' ? 'Hoog-Laag' : 'Laag-Hoog'}
        </button>
      </div>

      {/* Position List */}
      <div className="space-y-2">
        {sortedPositions.map((pos, idx) => {
          const pnl = parseFloat(pos.unrealized_pnl) || 0;
          const pnlPct = parseFloat(pos.unrealized_pnl_pct) || 0;
          const marketValue = parseFloat(pos.market_value) || 0;
          const isPositive = pnl >= 0;
          const displayVal = sortField === 'pnl' ? pnl : pnlPct;
          const barWidth = Math.min(Math.abs(displayVal) / maxAbsPnl * 100, 100);

          return (
            <div key={idx} className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 shadow-[0_1px_4px_rgba(45,52,54,0.04)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="font-medium text-[#2D3436] text-sm truncate">{getETFName(pos)}</div>
                  <div className="text-xs text-[#B2BEC3]">
                    {pos.symbol} &middot; {formatCurrency(marketValue)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {formatCurrency(pnl)}
                  </div>
                  <div className={`text-xs font-medium tabular-nums ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {formatPercent(pnlPct)}
                  </div>
                </div>
              </div>
              {/* P&L Bar */}
              <div className="h-1.5 bg-[#F5F6F4] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isPositive ? 'bg-[#7C9885]' : 'bg-[#C0736D]'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {positions.length === 0 && (
        <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-10 text-center shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
          <TrendingUp className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
          <p className="text-[#636E72]">Geen posities gevonden</p>
        </div>
      )}
    </DetailPageHeader>
  );
}
