import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 *
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 */
const VARIANTS = {
  primary: 'bg-gradient-to-r from-[#28EBCF] to-[#20D4B8] text-gray-900 font-medium hover:shadow-lg hover:shadow-[#28EBCF]/20',
  secondary: 'bg-gray-800/60 text-gray-300 font-medium border border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600',
  ghost: 'text-gray-400 font-medium hover:text-white hover:bg-gray-800/50',
  danger: 'bg-red-500/10 text-red-400 font-medium border border-red-500/30 hover:bg-red-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/30 hover:bg-emerald-500/20',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const DISABLED = 'bg-gray-800/30 text-gray-600 cursor-not-allowed hover:shadow-none';

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
 * IconButton - Square button with just an icon
 */
export function IconButton({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      className={`${VARIANTS[variant]} ${sizes[size]} rounded-lg transition-all duration-200 ${className}`}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}

export default Button;
