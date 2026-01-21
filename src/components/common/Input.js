import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Input Component
 *
 * Base input with consistent styling
 */
export const Input = forwardRef(function Input(
  { className = '', error, ...props },
  ref
) {
  const baseClasses = `
    w-full px-4 py-3
    bg-gray-800/40 border rounded-xl
    text-white placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-[#28EBCF]/10
    transition-all
  `;

  const borderClasses = error
    ? 'border-red-500/50 focus:border-red-500/50'
    : 'border-gray-700/50 focus:border-[#28EBCF]/40';

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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-gray-700/30 rounded">
        <Search className="w-4 h-4 text-gray-500" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]/40 focus:ring-2 focus:ring-[#28EBCF]/10 transition-all"
        {...props}
      />
      {hasValue && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
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
        <label className="block text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
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
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
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
          w-full py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl
          text-white font-mono tabular-nums text-right
          focus:outline-none focus:border-[#28EBCF]/40 focus:ring-2 focus:ring-[#28EBCF]/10
          transition-all
          ${prefix ? 'pl-10' : 'pl-4'}
          ${suffix ? 'pr-10' : 'pr-4'}
        `}
        {...props}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default Input;
