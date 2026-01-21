import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * FilterDropdown Component
 *
 * Single-select dropdown filter with premium styling
 * Reusable across ETF browser, portfolio filters, etc.
 */
export function FilterDropdown({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Alle',
  icon: Icon,
  disabled = false,
  showClear = true,
  size = 'md',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption && value !== 'all' ? selectedOption.label : placeholder;
  const hasValue = value && value !== 'all' && value !== '';

  const sizes = {
    sm: {
      button: 'px-2.5 py-1.5 text-xs',
      label: 'text-[10px] mb-1',
      option: 'px-3 py-2 text-xs',
    },
    md: {
      button: 'px-3.5 py-2.5 text-sm',
      label: 'text-[11px] mb-1.5',
      option: 'px-4 py-2.5 text-sm',
    },
    lg: {
      button: 'px-4 py-3 text-base',
      label: 'text-xs mb-2',
      option: 'px-4 py-3 text-base',
    },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block ${sizeConfig.label} text-gray-500 font-medium uppercase tracking-wider`}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between ${sizeConfig.button} rounded-lg border transition-all duration-200
          ${disabled
            ? 'bg-gray-900/20 border-gray-800/30 text-gray-600 cursor-not-allowed'
            : hasValue
              ? 'bg-gradient-to-r from-[#28EBCF]/10 to-[#28EBCF]/5 border-[#28EBCF]/30 text-white shadow-sm shadow-[#28EBCF]/5'
              : 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60'
          }
        `}
      >
        <span className={`flex items-center gap-2 truncate ${hasValue ? 'text-white' : 'text-gray-400'}`}>
          {Icon && <Icon className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
          <span className="truncate">{displayValue}</span>
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasValue && showClear && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
              }}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-700">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between ${sizeConfig.option} text-left transition-all
                  ${value === option.value
                    ? 'bg-[#28EBCF]/10 text-[#28EBCF]'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {option.icon && <option.icon className="w-4 h-4 opacity-60" />}
                  <span>{option.label}</span>
                </span>
                <div className="flex items-center gap-2">
                  {option.count !== undefined && (
                    <span className="text-gray-600 text-xs">{option.count}</span>
                  )}
                  {value === option.value && <Check className="w-4 h-4 text-[#28EBCF]" />}
                </div>
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Geen opties beschikbaar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
