import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Input Component - Pastel Design System
 *
 * Calm, subtle inputs with soft pastel colors
 */
export const Input = forwardRef(function Input(
  { className = '', error, ...props },
  ref
) {
  const baseClasses = `
    w-full px-4 py-3
    bg-[#FEFEFE] border rounded-2xl
    text-[#2D3436] placeholder-[#B2BEC3]
    focus:outline-none focus:ring-2 focus:ring-[#7C9885]/20 focus:border-[#7C9885]
    transition-all duration-200
    shadow-[0_1px_3px_rgba(45,52,54,0.04)]
  `;

  const borderClasses = error
    ? 'border-[#C0736D]/50 focus:border-[#C0736D]'
    : 'border-[#E8E8E6]';

  return (
    <input
      ref={ref}
      className={`${baseClasses} ${borderClasses} ${className}`}
      {...props}
    />
  );
});

/**
 * SearchInput - Input with search icon and clear button
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Zoeken...',
  className = '',
  ...props
}) {
  const hasValue = value && value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Search className="w-4 h-4 text-[#B2BEC3]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885] focus:ring-2 focus:ring-[#7C9885]/20 transition-all shadow-[0_1px_3px_rgba(45,52,54,0.04)]"
        {...props}
      />
      {hasValue && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#B2BEC3] hover:text-[#636E72] hover:bg-[#F5F6F4] rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * InputGroup - Input with label and optional error message
 */
export function InputGroup({
  label,
  error,
  hint,
  required,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-[#636E72] mb-2 font-medium">
          {label}
          {required && <span className="text-[#C0736D] ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-2 text-xs text-[#B2BEC3]">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-[#C0736D]">{error}</p>
      )}
    </div>
  );
}

/**
 * NumberInput - Input for financial/numeric values
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  className = '',
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636E72] text-sm">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className={`
          w-full py-3 bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl
          text-[#2D3436] font-mono tabular-nums text-right
          focus:outline-none focus:border-[#7C9885] focus:ring-2 focus:ring-[#7C9885]/20
          transition-all shadow-[0_1px_3px_rgba(45,52,54,0.04)]
          ${prefix ? 'pl-10' : 'pl-4'}
          ${suffix ? 'pr-10' : 'pr-4'}
        `}
        {...props}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636E72] text-sm">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default Input;
