import React from 'react';

/**
 * Card Component
 *
 * Variants: default, elevated, interactive, bordered
 */
const VARIANTS = {
  default: 'bg-[#1A1B1F] border border-gray-800/50',
  elevated: 'bg-gradient-to-br from-[#1A1B1F] to-[#16171B] border border-gray-800/50 shadow-2xl',
  interactive: 'bg-[#1A1B1F] border border-gray-800/50 hover:border-gray-700 cursor-pointer transition-colors',
  bordered: 'bg-transparent border border-gray-800/50',
  glass: 'bg-gray-800/20 border border-gray-700/30 backdrop-blur-sm',
};

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
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
