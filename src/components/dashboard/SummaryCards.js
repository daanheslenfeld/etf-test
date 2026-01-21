import React from 'react';
import {
  Wallet,
  LineChart,
  PiggyBank,
  Percent,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import { StatusBadge } from '../common';

/**
 * SummaryCards Component
 *
 * Container for financial overview cards
 * Displays total value, portfolio, cash, and return
 */
export function SummaryCards({
  totalValue,
  portfolioValue,
  cashBalance,
  unrealizedPnL,
  unrealizedPnLPercent,
  dayChange,
  dayChangePercent,
  isConnected = false,
  loading = false,
  layout = 'grid', // 'grid' | 'row' | 'compact'
  className = '',
}) {
  // Calculate values
  const hasData = totalValue !== undefined || portfolioValue !== undefined;

  // Determine return trend
  const returnTrend = unrealizedPnL > 0 ? 'up' : unrealizedPnL < 0 ? 'down' : 'neutral';

  const layoutClasses = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    row: 'flex flex-wrap gap-4',
    compact: 'grid grid-cols-2 lg:grid-cols-4 gap-3',
  };

  if (!isConnected && !loading) {
    return (
      <div className={`${layoutClasses[layout]} ${className}`}>
        <DisconnectedCard />
      </div>
    );
  }

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {/* Total Value */}
      <SummaryCard
        title="Totale Waarde"
        subtitle="Portfolio + Cash"
        value={totalValue}
        change={dayChange}
        changePercent={dayChangePercent}
        prefix="€"
        icon={Wallet}
        variant="primary"
        loading={loading}
        compact={layout === 'compact'}
      />

      {/* Portfolio Value */}
      <SummaryCard
        title="Portfolio"
        subtitle="Beleggingen"
        value={portfolioValue}
        prefix="€"
        icon={LineChart}
        loading={loading}
        compact={layout === 'compact'}
      />

      {/* Cash Balance */}
      <SummaryCard
        title="Cash"
        subtitle="Beschikbaar"
        value={cashBalance}
        prefix="€"
        icon={PiggyBank}
        trend="neutral"
        loading={loading}
        compact={layout === 'compact'}
      />

      {/* Unrealized P&L */}
      <SummaryCard
        title="Rendement"
        subtitle="Ongerealiseerd"
        value={unrealizedPnL}
        changePercent={unrealizedPnLPercent}
        prefix="€"
        icon={Percent}
        variant={returnTrend === 'up' ? 'success' : returnTrend === 'down' ? 'danger' : 'default'}
        trend={returnTrend}
        loading={loading}
        compact={layout === 'compact'}
      />
    </div>
  );
}

/**
 * DisconnectedCard - Shown when broker is not connected
 */
function DisconnectedCard() {
  return (
    <div className="col-span-full bg-[#1A1B1F] border border-amber-500/20 rounded-xl p-5">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-500/10 rounded-xl">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">
            Broker niet verbonden
          </h3>
          <p className="text-sm text-gray-400">
            Verbind je LYNX account om je portfolio te bekijken
          </p>
        </div>
        <StatusBadge status="offline" />
      </div>
    </div>
  );
}

/**
 * SummaryCardsCompact - Minimal version for sidebars/headers
 */
export function SummaryCardsCompact({
  totalValue,
  unrealizedPnL,
  unrealizedPnLPercent,
  loading = false,
  className = '',
}) {
  const trend = unrealizedPnL > 0 ? 'up' : unrealizedPnL < 0 ? 'down' : 'neutral';
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  const formatValue = (val) => {
    if (typeof val !== 'number') return '—';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(val);
  };

  const formatPercent = (val) => {
    if (typeof val !== 'number') return '';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="animate-pulse bg-gray-800/50 h-6 w-24 rounded" />
        <div className="animate-pulse bg-gray-800/50 h-4 w-16 rounded" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">Portfolio</p>
        <p className="text-lg font-semibold text-white font-mono tabular-nums">
          {formatValue(totalValue)}
        </p>
      </div>
      <div className={`flex items-center gap-1 ${trendColor}`}>
        <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
        <span className="text-sm font-medium font-mono tabular-nums">
          {formatPercent(unrealizedPnLPercent)}
        </span>
      </div>
    </div>
  );
}

/**
 * SummaryCardsSkeleton - Loading skeleton for summary cards
 */
export function SummaryCardsSkeleton({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1A1B1F] border border-gray-800/50 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="animate-pulse bg-gray-800/50 h-4 w-20 rounded" />
            <div className="animate-pulse bg-gray-800/50 h-10 w-10 rounded-xl" />
          </div>
          <div className="animate-pulse bg-gray-800/50 h-8 w-32 rounded mb-2" />
          <div className="animate-pulse bg-gray-800/50 h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;
