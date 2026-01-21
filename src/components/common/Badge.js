import React from 'react';

/**
 * Badge Component
 *
 * Variants: default, primary, success, warning, error, info
 * Sizes: sm, md, lg
 */
const VARIANTS = {
  default: 'bg-gray-800/50 text-gray-300 border-gray-700/30',
  primary: 'bg-[#28EBCF]/10 text-[#28EBCF] border-[#28EBCF]/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const SIZES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.default;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${size === 'sm' ? 'w-1 h-1' : ''}`} />
      )}
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {children}
    </span>
  );
}

/**
 * StatusBadge - Badge with animated dot for status indicators
 */
export function StatusBadge({
  status = 'default',
  label,
  pulse = false,
  className = '',
}) {
  const statusConfig = {
    online: { variant: 'success', label: label || 'Online' },
    offline: { variant: 'error', label: label || 'Offline' },
    connecting: { variant: 'warning', label: label || 'Verbinden...', pulse: true },
    paper: { variant: 'info', label: label || 'Paper Trading' },
    live: { variant: 'error', label: label || 'Live Trading' },
    default: { variant: 'default', label: label || 'Unknown' },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <Badge variant={config.variant} className={className}>
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${
          pulse || config.pulse ? 'animate-pulse' : ''
        }`}
      />
      {config.label}
    </Badge>
  );
}

/**
 * CountBadge - Compact badge for counts/numbers
 */
export function CountBadge({
  count,
  variant = 'primary',
  max = 99,
  className = '',
}) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ${
        VARIANTS[variant] || VARIANTS.primary
      } ${className}`}
    >
      {displayCount}
    </span>
  );
}

/**
 * TrendBadge - Badge showing percentage change with trend arrow
 */
export function TrendBadge({
  value,
  showArrow = true,
  showSign = true,
  className = '',
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const variant = isPositive ? 'success' : isNegative ? 'error' : 'default';
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '→';
  const sign = isPositive ? '+' : '';

  return (
    <Badge variant={variant} size="sm" className={className}>
      {showArrow && <span>{arrow}</span>}
      {showSign && sign}
      {Math.abs(value).toFixed(2)}%
    </Badge>
  );
}

export default Badge;
