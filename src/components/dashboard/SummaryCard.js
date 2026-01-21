import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  LineChart,
  Percent,
} from 'lucide-react';
import { LoadingPulse } from '../common';

/**
 * SummaryCard Component
 *
 * Financial summary card with value, change indicator, and trend
 * Used for portfolio value, cash balance, returns, etc.
 */

const VARIANTS = {
  default: {
    bg: 'bg-[#1A1B1F]',
    border: 'border-gray-800/50',
    iconBg: 'bg-gray-800/50',
    iconColor: 'text-gray-400',
  },
  primary: {
    bg: 'bg-gradient-to-br from-[#1A1B1F] to-[#16171B]',
    border: 'border-[#28EBCF]/20',
    iconBg: 'bg-[#28EBCF]/10',
    iconColor: 'text-[#28EBCF]',
  },
  success: {
    bg: 'bg-[#1A1B1F]',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  warning: {
    bg: 'bg-[#1A1B1F]',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  danger: {
    bg: 'bg-[#1A1B1F]',
    border: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
  },
};

export function SummaryCard({
  title,
  value,
  change,
  changePercent,
  prefix = '',
  suffix = '',
  icon: Icon,
  variant = 'default',
  trend, // 'up' | 'down' | 'neutral'
  subtitle,
  loading = false,
  compact = false,
  onClick,
  className = '',
}) {
  const style = VARIANTS[variant] || VARIANTS.default;

  // Determine trend from change value if not provided
  const effectiveTrend = trend || (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');

  // Trend colors
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  // Trend icons
  const TrendIcon = effectiveTrend === 'up' ? TrendingUp : effectiveTrend === 'down' ? TrendingDown : Minus;
  const ArrowIcon = effectiveTrend === 'up' ? ArrowUpRight : effectiveTrend === 'down' ? ArrowDownRight : null;

  // Format value
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }
    return val;
  };

  // Format change
  const formatChange = (val) => {
    if (typeof val !== 'number') return val;
    const sign = val > 0 ? '+' : '';
    return `${sign}${new Intl.NumberFormat('nl-NL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)}`;
  };

  const formatPercent = (val) => {
    if (typeof val !== 'number') return val;
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  if (compact) {
    return (
      <div
        className={`
          ${style.bg} border ${style.border} rounded-xl p-4
          ${onClick ? 'cursor-pointer hover:border-gray-700 transition-colors' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
              {title}
            </p>
            {loading ? (
              <LoadingPulse width="w-24" height="h-6" />
            ) : (
              <p className="text-lg font-semibold text-white font-mono tabular-nums">
                {prefix}{formatValue(value)}{suffix}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-2 rounded-lg ${style.iconBg}`}>
              <Icon className={`w-4 h-4 ${style.iconColor}`} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${style.bg} border ${style.border} rounded-xl p-5
        ${onClick ? 'cursor-pointer hover:border-gray-700 transition-all hover:shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <LoadingPulse width="w-32" height="h-8" />
          <LoadingPulse width="w-20" height="h-4" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-white font-mono tabular-nums mb-2">
            {prefix}{formatValue(value)}{suffix}
          </p>

          {/* Change indicator */}
          {(change !== undefined || changePercent !== undefined) && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${trendColors[effectiveTrend]}`}>
                <TrendIcon className="w-4 h-4" />
                {change !== undefined && (
                  <span className="text-sm font-medium font-mono tabular-nums">
                    {formatChange(change)}
                  </span>
                )}
              </div>
              {changePercent !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  effectiveTrend === 'up'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : effectiveTrend === 'down'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {formatPercent(changePercent)}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Preset summary cards for common use cases
 */

export function TotalValueCard({ value, change, changePercent, loading, ...props }) {
  return (
    <SummaryCard
      title="Totale Waarde"
      value={value}
      change={change}
      changePercent={changePercent}
      prefix="€"
      icon={Wallet}
      variant="primary"
      loading={loading}
      {...props}
    />
  );
}

export function PortfolioValueCard({ value, change, changePercent, loading, ...props }) {
  return (
    <SummaryCard
      title="Portfolio"
      value={value}
      change={change}
      changePercent={changePercent}
      prefix="€"
      icon={LineChart}
      loading={loading}
      {...props}
    />
  );
}

export function CashBalanceCard({ value, loading, ...props }) {
  return (
    <SummaryCard
      title="Cash"
      value={value}
      prefix="€"
      icon={PiggyBank}
      trend="neutral"
      loading={loading}
      {...props}
    />
  );
}

export function ReturnCard({ value, percent, loading, ...props }) {
  const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  return (
    <SummaryCard
      title="Rendement"
      value={value}
      changePercent={percent}
      prefix="€"
      icon={Percent}
      variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'default'}
      trend={trend}
      loading={loading}
      {...props}
    />
  );
}

export default SummaryCard;
