import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component - Pastel Design System
 *
 * Calm, trustworthy buttons with soft pastel colors and subtle interactions
 */
const VARIANTS = {
  primary: 'bg-[#7C9885] text-white font-medium hover:bg-[#6B8A74] active:bg-[#5A7A63] focus:outline-none focus:ring-2 focus:ring-[#7C9885]/30 focus:ring-offset-2 focus:ring-offset-[#F5F6F4]',
  secondary: 'bg-[#FEFEFE] text-[#2D3436] font-medium border border-[#E8E8E6] hover:bg-[#F5F6F4] hover:border-[#D1D5D3] focus:outline-none focus:ring-2 focus:ring-[#7C9885]/20',
  ghost: 'text-[#636E72] font-medium hover:text-[#2D3436] hover:bg-[#F5F6F4] focus:outline-none focus:ring-2 focus:ring-[#7C9885]/20',
  danger: 'bg-[#C0736D]/10 text-[#C0736D] font-medium border border-[#C0736D]/30 hover:bg-[#C0736D]/20 focus:outline-none focus:ring-2 focus:ring-[#C0736D]/20',
  success: 'bg-[#7C9885]/10 text-[#7C9885] font-medium border border-[#7C9885]/30 hover:bg-[#7C9885]/20 focus:outline-none focus:ring-2 focus:ring-[#7C9885]/20',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-xs min-h-[32px] rounded-xl',
  md: 'px-5 py-2.5 text-sm min-h-[44px] rounded-2xl',
  lg: 'px-6 py-3 text-base min-h-[48px] rounded-2xl',
};

const DISABLED = 'bg-[#ECEEED] text-[#B2BEC3] cursor-not-allowed border-transparent hover:bg-[#ECEEED]';

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
