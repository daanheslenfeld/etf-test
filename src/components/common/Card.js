import React from 'react';

/**
 * Card Component - Pastel Design System
 *
 * Floating cards with soft shadows, pastel colors, breathing room
 */
const VARIANTS = {
  default: 'bg-[#FEFEFE] border border-[#E8E8E6] shadow-[0_2px_8px_rgba(45,52,54,0.06)]',
  elevated: 'bg-[#FEFEFE] border border-[#E8E8E6] shadow-[0_4px_16px_rgba(45,52,54,0.08)]',
  interactive: 'bg-[#FEFEFE] border border-[#E8E8E6] shadow-[0_2px_8px_rgba(45,52,54,0.06)] hover:shadow-[0_4px_16px_rgba(45,52,54,0.1)] hover:border-[#7C9885] cursor-pointer transition-all duration-300',
  bordered: 'bg-transparent border border-[#E8E8E6]',
  subtle: 'bg-[#F5F6F4]/50',
  hero: 'bg-[#FEFEFE] border border-[#E8E8E6] shadow-[0_4px_16px_rgba(45,52,54,0.08)] border-l-4 border-l-[#7C9885]',
  stat: 'bg-[#FEFEFE] border border-[#E8E8E6] shadow-[0_2px_8px_rgba(45,52,54,0.06)] hover:shadow-[0_4px_16px_rgba(45,52,54,0.08)] transition-all duration-300',
};

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
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
    <div className={`flex items-center justify-between mb-5 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 bg-[#7C9885]/10 rounded-xl">
            <Icon className="w-5 h-5 text-[#7C9885]" />
          </div>
        )}
        <div>
          {title && <h3 className="text-lg font-medium text-[#2D3436]">{title}</h3>}
          {subtitle && <p className="text-sm text-[#636E72]">{subtitle}</p>}
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
    <div className={`mt-5 pt-5 border-t border-[#E8E8E6] ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardDivider - Horizontal divider for cards
 */
export function CardDivider({ className = '' }) {
  return <div className={`border-t border-[#E8E8E6] my-5 ${className}`} />;
}

export default Card;
