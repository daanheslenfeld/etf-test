import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component - Premium Fintech Style
 *
 * Variants: primary, secondary, ghost, danger, success
 * Sizes: sm, md, lg (md/lg are touch-friendly with min-h-[44px])
 */
const VARIANTS = {
  primary: 'bg-gradient-to-r from-[#28EBCF] to-[#20D4B8] text-gray-900 font-semibold hover:shadow-lg hover:shadow-[#28EBCF]/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#28EBCF]/30 focus:ring-offset-2 focus:ring-offset-gray-900',
  secondary: 'bg-transparent text-gray-300 font-medium border border-gray-600 hover:bg-gray-800/60 hover:border-gray-500 hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500/30',
  ghost: 'text-gray-400 font-medium hover:text-white hover:bg-gray-800/50 active:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30',
  danger: 'bg-red-500/10 text-red-400 font-medium border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/30',
  success: 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs min-h-[32px] rounded-lg',
  md: 'px-4 py-2.5 text-sm min-h-[44px] rounded-xl',
  lg: 'px-6 py-3 text-base min-h-[48px] rounded-xl',
};

const DISABLED = 'bg-gray-800/30 text-gray-600 cursor-not-allowed border-gray-800/30 hover:shadow-none hover:bg-gray-800/30';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 transition-all duration-200';
  const variantClasses = disabled ? DISABLED : VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
}

/**
 * IconButton - Square button with just an icon (touch-friendly)
 */
export function IconButton({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  disabled = false,
  ...props
}) {
  const sizes = {
    sm: 'p-1.5 min-w-[32px] min-h-[32px]',
    md: 'p-2.5 min-w-[44px] min-h-[44px]',
    lg: 'p-3 min-w-[48px] min-h-[48px]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      className={`inline-flex items-center justify-center ${disabled ? DISABLED : VARIANTS[variant]} ${sizes[size]} rounded-xl transition-all duration-200 ${className}`}
      disabled={disabled}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}

export default Button;
