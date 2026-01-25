import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatsCard - Premium Banking Style Statistics Card
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
  iconColor = 'text-[#7C9885]',
  iconBg = 'bg-[#7C9885]/10',
  trend, // 'up' | 'down' | null
  prefix = '',
  suffix = '',
  className = '',
}) {
  const isPositive = trend === 'up' || (change && change > 0);
  const isNegative = trend === 'down' || (change && change < 0);

  const variants = {
    hero: {
      container: 'bg-[#FEFEFE] border-l-4 border-l-[#7C9885] border border-[#E8E8E6] rounded-xl p-6 shadow-[0_4px_12px_rgba(45,52,54,0.06)]',
      label: 'text-xs uppercase tracking-wider text-[#636E72] font-medium mb-2',
      value: 'text-3xl sm:text-4xl font-bold text-[#2D3436] tabular-nums tracking-tight',
      change: 'text-base font-semibold',
      iconSize: 'w-6 h-6',
      iconContainer: 'w-12 h-12',
    },
    default: {
      container: 'bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-5 shadow-[0_1px_3px_rgba(45,52,54,0.04)]',
      label: 'text-xs uppercase tracking-wider text-[#636E72] font-medium mb-3',
      value: 'text-xl sm:text-2xl font-bold text-[#2D3436] tabular-nums mt-2',
      change: 'text-sm font-medium',
      iconSize: 'w-5 h-5',
      iconContainer: 'w-10 h-10',
    },
    compact: {
      container: 'bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg p-4 shadow-[0_1px_2px_rgba(45,52,54,0.04)]',
      label: 'text-[10px] uppercase tracking-wider text-[#636E72] font-medium mb-1',
      value: 'text-xl font-bold text-[#2D3436] tabular-nums',
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
                  isPositive ? 'text-[#7C9885]' :
                  isNegative ? 'text-[#C0736D]' :
                  'text-[#636E72]'
                }`}>
                  {formatChange(change)}
                </span>
              )}
              {changePercent !== undefined && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isPositive ? 'bg-[#7C9885]/10 text-[#7C9885]' :
                  isNegative ? 'bg-[#C0736D]/10 text-[#C0736D]' :
                  'bg-[#ECEEED] text-[#636E72]'
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
