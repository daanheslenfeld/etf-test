import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * FilterDropdown Component - Pastel Design System
 *
 * Single-select dropdown filter with soft pastel styling
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
      button: 'px-3 py-2 text-xs min-h-[40px]',
      label: 'text-[10px] mb-1',
      option: 'px-3.5 py-2.5 text-xs min-h-[40px]',
    },
    md: {
      button: 'px-4 py-2.5 text-sm min-h-[44px]',
      label: 'text-[11px] mb-1.5',
      option: 'px-4 py-3 text-sm min-h-[44px]',
    },
    lg: {
      button: 'px-5 py-3.5 text-base min-h-[48px]',
      label: 'text-xs mb-2',
      option: 'px-5 py-3.5 text-base min-h-[48px]',
    },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block ${sizeConfig.label} text-[#5F7066] font-medium uppercase tracking-wider`}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between ${sizeConfig.button} rounded-2xl border transition-all duration-200
          ${disabled
            ? 'bg-[#F0F2EE] border-[#E4E8E5] text-[#95A39A] cursor-not-allowed'
            : hasValue
              ? 'bg-[#E6F0EB] border-[#8AB4A0]/30 text-[#2D3E36] shadow-[0_1px_3px_rgba(45,62,54,0.05)]'
              : 'bg-white border-[#E4E8E5] text-[#5F7066] hover:border-[#C8D0CA] hover:bg-[#FAFBF9]'
          }
        `}
      >
        <span className={`flex items-center gap-2 truncate ${hasValue ? 'text-[#2D3E36]' : 'text-[#95A39A]'}`}>
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
              className="p-0.5 hover:bg-[#F0F2EE] rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#95A39A] hover:text-[#5F7066]" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#95A39A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-[#E4E8E5] rounded-2xl shadow-[0_4px_16px_rgba(45,62,54,0.10)] overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1.5">
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
                    ? 'bg-[#E6F0EB] text-[#5F8A74]'
                    : 'text-[#2D3E36] hover:bg-[#FAFBF9]'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {option.icon && <option.icon className="w-4 h-4 opacity-60" />}
                  <span>{option.label}</span>
                </span>
                <div className="flex items-center gap-2">
                  {option.count !== undefined && (
                    <span className="text-[#95A39A] text-xs">{option.count}</span>
                  )}
                  {value === option.value && <Check className="w-4 h-4 text-[#8AB4A0]" />}
                </div>
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-6 text-center text-[#95A39A] text-sm">
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
