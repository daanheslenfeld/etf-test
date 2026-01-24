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
 * SummaryCard Component - Pastel Design System
 *
 * Financial summary card with value, change indicator, and trend
 * Uses soft shadows, rounded corners, and pastel accents
 */

const VARIANTS = {
  default: {
    bg: 'bg-white',
    border: 'border-[#E4E8E5]',
    shadow: 'shadow-[0_2px_8px_rgba(45,62,54,0.05)]',
    hoverShadow: 'hover:shadow-[0_4px_16px_rgba(45,62,54,0.08)]',
    iconBg: 'bg-[#F0F2EE]',
    iconColor: 'text-[#5F7066]',
  },
  primary: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-[#8AB4A0] border-[#E4E8E5]',
    shadow: 'shadow-[0_2px_8px_rgba(45,62,54,0.05)]',
    hoverShadow: 'hover:shadow-[0_4px_16px_rgba(138,180,160,0.15)]',
    iconBg: 'bg-[#E6F0EB]',
    iconColor: 'text-[#8AB4A0]',
  },
  success: {
    bg: 'bg-white',
    border: 'border-[#8AB4A0]/30',
    shadow: 'shadow-[0_2px_8px_rgba(45,62,54,0.05)]',
    hoverShadow: 'hover:shadow-[0_4px_16px_rgba(138,180,160,0.15)]',
    iconBg: 'bg-[#E6F0EB]',
    iconColor: 'text-[#8AB4A0]',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-[#D4C39A]/30',
    shadow: 'shadow-[0_2px_8px_rgba(45,62,54,0.05)]',
    hoverShadow: 'hover:shadow-[0_4px_16px_rgba(212,195,154,0.15)]',
    iconBg: 'bg-[#F8F5ED]',
    iconColor: 'text-[#D4C39A]',
  },
  danger: {
    bg: 'bg-white',
    border: 'border-[#D4A59A]/30',
    shadow: 'shadow-[0_2px_8px_rgba(45,62,54,0.05)]',
    hoverShadow: 'hover:shadow-[0_4px_16px_rgba(212,165,154,0.15)]',
    iconBg: 'bg-[#F8EFED]',
    iconColor: 'text-[#D4A59A]',
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

  // Trend colors - soft pastels
  const trendColors = {
    up: 'text-[#5F8A74]',
    down: 'text-[#B8847A]',
    neutral: 'text-[#5F7066]',
  };

  // Trend background colors
  const trendBgColors = {
    up: 'bg-[#E6F0EB] text-[#5F8A74]',
    down: 'bg-[#F8EFED] text-[#B8847A]',
    neutral: 'bg-[#F0F2EE] text-[#5F7066]',
  };

  // Trend icons
  const TrendIcon = effectiveTrend === 'up' ? TrendingUp : effectiveTrend === 'down' ? TrendingDown : Minus;

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
          ${style.bg} border ${style.border} ${style.shadow} ${style.hoverShadow} rounded-2xl p-5
          ${onClick ? 'cursor-pointer' : ''} transition-all duration-200
          ${className}
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#5F7066] font-medium uppercase tracking-wider mb-2">
              {title}
            </p>
            {loading ? (
              <LoadingPulse width="w-24" height="h-6" />
            ) : (
              <p className="text-lg font-semibold text-[#2D3E36] tabular-nums">
                {prefix}{formatValue(value)}{suffix}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
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
        ${style.bg} border ${style.border} ${style.shadow} ${style.hoverShadow} rounded-2xl p-6
        ${onClick ? 'cursor-pointer' : ''} transition-all duration-200
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-[#5F7066] font-medium uppercase tracking-wider">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-[#95A39A] mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${style.iconBg}`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-3">
          <LoadingPulse width="w-32" height="h-8" />
          <LoadingPulse width="w-20" height="h-4" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-[#2D3E36] tabular-nums mb-3">
            {prefix}{formatValue(value)}{suffix}
          </p>

          {/* Change indicator */}
          {(change !== undefined || changePercent !== undefined) && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${trendColors[effectiveTrend]}`}>
                <TrendIcon className="w-4 h-4" />
                {change !== undefined && (
                  <span className="text-sm font-medium tabular-nums">
                    {formatChange(change)}
                  </span>
                )}
              </div>
              {changePercent !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium tabular-nums ${trendBgColors[effectiveTrend]}`}>
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
