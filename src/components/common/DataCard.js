import React from 'react';

/**
 * DataCard Component
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
    default: 'bg-gray-800/30 border-gray-700/50',
    interactive: 'bg-gray-800/30 border-gray-700/50 cursor-pointer active:bg-gray-800/60',
    highlighted: 'bg-[#28EBCF]/5 border-[#28EBCF]/20',
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
    <div className={`pb-3 mb-3 border-b border-gray-700/50 ${className}`}>
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
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-emerald-500/20 text-emerald-400',
    danger: 'bg-red-500/20 text-red-400',
    warning: 'bg-amber-500/20 text-amber-400',
    info: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className={`flex items-start justify-between gap-2 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
        {subtitle && (
          <p className="text-gray-500 text-sm truncate">{subtitle}</p>
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
    default: 'text-white',
    success: 'text-emerald-400',
    danger: 'text-red-400',
    warning: 'text-amber-400',
    muted: 'text-gray-400',
  };

  return (
    <div className={`flex justify-between items-center py-1.5 ${className}`}>
      <span className="text-gray-500 text-sm">{label}</span>
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
    default: 'text-white',
    success: 'text-emerald-400',
    danger: 'text-red-400',
    warning: 'text-amber-400',
    muted: 'text-gray-400',
  };

  return (
    <div className={className}>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
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
    <div className={`flex gap-2 mt-3 pt-3 border-t border-gray-700/50 ${className}`}>
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
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-800/50 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-500" />
        </div>
      )}
      <h4 className="text-gray-400 font-medium mb-1">{title}</h4>
      {description && (
        <p className="text-gray-500 text-sm">{description}</p>
      )}
    </div>
  );
}

export default DataCard;
