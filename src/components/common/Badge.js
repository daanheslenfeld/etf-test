import React from 'react';

/**
 * Badge Component - Pastel Design System
 *
 * Soft, calm badges with pastel colors
 */
const VARIANTS = {
  default: 'bg-[#ECEEED] text-[#636E72] border-transparent',
  primary: 'bg-[#7C9885]/10 text-[#7C9885] border-[#7C9885]/20',
  success: 'bg-[#7C9885]/10 text-[#7C9885] border-[#7C9885]/20',
  warning: 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]/20',
  error: 'bg-[#C0736D]/10 text-[#C0736D] border-[#C0736D]/20',
  info: 'bg-[#6B7B8A]/10 text-[#6B7B8A] border-[#6B7B8A]/20',
  purple: 'bg-[#8B7BA8]/10 text-[#8B7BA8] border-[#8B7BA8]/20',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
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
 * TrendBadge - Badge showing percentage change with trend arrow (muted colors)
 */
export function TrendBadge({
  value,
  showArrow = true,
  showSign = true,
  className = '',
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;

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
