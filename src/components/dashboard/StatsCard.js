import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatsCard - Premium fintech-style statistics card
 *
 * Variants:
 * - hero: Large featured card with accent border (for total portfolio value)
 * - default: Standard stat card
 * - compact: Smaller card for secondary stats
 */
export function StatsCard({
  label,
  value,
  change,
  changePercent,
  icon: Icon,
  variant = 'default',
  iconColor = 'text-[#28EBCF]',
  iconBg = 'bg-[#28EBCF]/10',
  trend, // 'up' | 'down' | null
  prefix = '',
  suffix = '',
  className = '',
}) {
  const isPositive = trend === 'up' || (change && change > 0);
  const isNegative = trend === 'down' || (change && change < 0);

  const variants = {
    hero: {
      container: 'bg-gradient-to-br from-[#1A1B1F] to-[#16171B] border-l-4 border-[#28EBCF] rounded-xl p-6',
      label: 'text-xs uppercase tracking-wider text-gray-400 font-medium mb-2',
      value: 'text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight',
      change: 'text-base font-semibold',
      iconSize: 'w-6 h-6',
      iconContainer: 'w-12 h-12',
    },
    default: {
      container: 'bg-[#1A1B1F] border border-gray-700/30 rounded-xl p-5',
      label: 'text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5',
      value: 'text-2xl sm:text-3xl font-bold text-white tabular-nums',
      change: 'text-sm font-medium',
      iconSize: 'w-5 h-5',
      iconContainer: 'w-10 h-10',
    },
    compact: {
      container: 'bg-[#1A1B1F] border border-gray-700/30 rounded-lg p-4',
      label: 'text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1',
      value: 'text-xl font-bold text-white tabular-nums',
      change: 'text-xs font-medium',
      iconSize: 'w-4 h-4',
      iconContainer: 'w-8 h-8',
    },
  };

  const styles = variants[variant] || variants.default;

  const formatChange = (val) => {
    if (val === undefined || val === null) return null;
    const formatted = typeof val === 'number'
      ? new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency: 'EUR',
          signDisplay: 'always',
        }).format(val)
      : val;
    return formatted;
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return null;
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className={styles.label}>{label}</p>

          {/* Value */}
          <p className={styles.value}>
            {prefix}{value}{suffix}
          </p>

          {/* Change indicator */}
          {(change !== undefined || changePercent !== undefined) && (
            <div className="flex items-center gap-2 mt-2">
              {change !== undefined && (
                <span className={`${styles.change} ${
                  isPositive ? 'text-emerald-400' :
                  isNegative ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {formatChange(change)}
                </span>
              )}
              {changePercent !== undefined && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isPositive ? 'bg-emerald-500/20 text-emerald-400' :
                  isNegative ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {isPositive && <TrendingUp className="w-3 h-3" />}
                  {isNegative && <TrendingDown className="w-3 h-3" />}
                  {formatPercent(changePercent)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={`${styles.iconContainer} ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`${styles.iconSize} ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatsCardGrid - Grid container for stats cards
 */
export function StatsCardGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 ${className}`}>
      {children}
    </div>
  );
}

/**
 * StatsCardHero - Convenience wrapper for hero variant
 */
export function StatsCardHero(props) {
  return <StatsCard variant="hero" {...props} />;
}

export default StatsCard;
