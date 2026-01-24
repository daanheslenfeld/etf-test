import React from 'react';

/**
 * DataCard Component - Premium Banking Style
 *
 * Card-based alternative to table rows for mobile views
 */
export function DataCard({
  children,
  onClick,
  variant = 'default', // 'default' | 'interactive' | 'highlighted'
  className = '',
}) {
  const variants = {
    default: 'bg-[#FEFEFE] border-[#E8E8E6] shadow-[0_1px_3px_rgba(45,52,54,0.04)]',
    interactive: 'bg-[#FEFEFE] border-[#E8E8E6] shadow-[0_1px_3px_rgba(45,52,54,0.04)] cursor-pointer active:bg-[#F5F6F4]',
    highlighted: 'bg-[#7C9885]/5 border-[#7C9885]/20',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        w-full text-left rounded-xl p-4 border
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

/**
 * DataCardHeader - Top section with primary info
 */
export function DataCardHeader({ children, className = '' }) {
  return (
    <div className={`pb-3 mb-3 border-b border-[#E8E8E6] ${className}`}>
      {children}
    </div>
  );
}

/**
 * DataCardTitle - Main title with optional badge
 */
export function DataCardTitle({
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  className = '',
}) {
  const badgeVariants = {
    default: 'bg-[#ECEEED] text-[#636E72]',
    success: 'bg-[#7C9885]/10 text-[#7C9885]',
    danger: 'bg-[#C0736D]/10 text-[#C0736D]',
    warning: 'bg-[#C9A962]/10 text-[#C9A962]',
    info: 'bg-[#6B7B8A]/10 text-[#6B7B8A]',
  };

  return (
    <div className={`flex items-start justify-between gap-2 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-[#2D3436] font-semibold text-lg truncate">{title}</h3>
        {subtitle && (
          <p className="text-[#636E72] text-sm truncate">{subtitle}</p>
        )}
      </div>
      {badge && (
        <span
          className={`
            text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0
            ${badgeVariants[badgeVariant]}
          `}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/**
 * DataCardRow - Single label/value pair
 */
export function DataCardRow({
  label,
  value,
  valueColor,
  mono = false,
  className = '',
}) {
  const colorClasses = {
    default: 'text-[#2D3436]',
    success: 'text-[#7C9885]',
    danger: 'text-[#C0736D]',
    warning: 'text-[#C9A962]',
    muted: 'text-[#B2BEC3]',
  };

  return (
    <div className={`flex justify-between items-center py-1.5 ${className}`}>
      <span className="text-[#636E72] text-sm">{label}</span>
      <span
        className={`
          font-medium text-sm
          ${colorClasses[valueColor] || colorClasses.default}
          ${mono ? 'font-mono tabular-nums' : ''}
        `}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * DataCardGrid - Grid layout for multiple values
 */
export function DataCardGrid({ children, cols = 2, className = '' }) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * DataCardValue - Single value for grid display
 */
export function DataCardValue({
  label,
  value,
  valueColor,
  mono = false,
  className = '',
}) {
  const colorClasses = {
    default: 'text-[#2D3436]',
    success: 'text-[#7C9885]',
    danger: 'text-[#C0736D]',
    warning: 'text-[#C9A962]',
    muted: 'text-[#B2BEC3]',
  };

  return (
    <div className={className}>
      <p className="text-[#636E72] text-xs mb-0.5">{label}</p>
      <p
        className={`
          font-medium
          ${colorClasses[valueColor] || colorClasses.default}
          ${mono ? 'font-mono tabular-nums' : ''}
        `}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * DataCardActions - Bottom action buttons
 */
export function DataCardActions({ children, className = '' }) {
  return (
    <div className={`flex gap-2 mt-3 pt-3 border-t border-[#E8E8E6] ${className}`}>
      {children}
    </div>
  );
}

/**
 * DataCardList - Container for multiple DataCards
 */
export function DataCardList({ children, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * DataCardEmpty - Empty state for card lists
 */
export function DataCardEmpty({
  icon: Icon,
  title = 'Geen gegevens',
  description,
  className = '',
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 mx-auto mb-3 bg-[#ECEEED] rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#636E72]" />
        </div>
      )}
      <h4 className="text-[#636E72] font-medium mb-1">{title}</h4>
      {description && (
        <p className="text-[#B2BEC3] text-sm">{description}</p>
      )}
    </div>
  );
}

export default DataCard;
