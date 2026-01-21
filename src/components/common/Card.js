import React from 'react';

/**
 * Card Component - Premium Fintech Style
 *
 * Variants: default, elevated, interactive, bordered, glass, hero, stat
 */
const VARIANTS = {
  default: 'bg-[#1A1B1F] border border-gray-700/30',
  elevated: 'bg-gradient-to-br from-[#1A1B1F] to-[#16171B] border border-gray-700/30 shadow-2xl shadow-black/20',
  interactive: 'bg-[#1A1B1F] border border-gray-700/30 hover:border-gray-600/50 hover:bg-[#1E1F24] cursor-pointer transition-all duration-200',
  bordered: 'bg-transparent border border-gray-700/30',
  glass: 'bg-gray-800/20 border border-gray-700/30 backdrop-blur-sm',
  hero: 'bg-gradient-to-br from-[#1A1B1F] to-[#16171B] border-l-4 border-[#28EBCF] border-y border-r border-y-gray-700/30 border-r-gray-700/30 shadow-lg shadow-[#28EBCF]/5',
  stat: 'bg-[#1A1B1F] border border-gray-700/30 hover:border-gray-600/40 transition-colors',
};

const PADDING = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
  xl: 'p-6 sm:p-7',
};

const RADIUS = {
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
};

export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  radius = 'xl',
  className = '',
  ...props
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.default;
  const paddingClasses = PADDING[padding] || PADDING.lg;
  const radiusClasses = RADIUS[radius] || RADIUS.xl;

  return (
    <div
      className={`${variantClasses} ${paddingClasses} ${radiusClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader - Header section for cards with title and optional actions
 */
export function CardHeader({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 bg-gradient-to-br from-[#28EBCF]/20 to-[#28EBCF]/5 rounded-xl border border-[#28EBCF]/20">
            <Icon className="w-5 h-5 text-[#28EBCF]" />
          </div>
        )}
        <div>
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {children}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * CardBody - Body section for cards
 */
export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

/**
 * CardFooter - Footer section for cards
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-800/50 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardDivider - Horizontal divider for cards
 */
export function CardDivider({ className = '' }) {
  return <div className={`border-t border-gray-800/50 my-4 ${className}`} />;
}

export default Card;
