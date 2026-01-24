import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

/**
 * Dropdown Component - Premium Banking Style
 */
export function Dropdown({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Selecteer...',
  disabled = false,
  error,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;
  const hasValue = value && value !== 'all' && value !== '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm text-[#636E72] mb-2 font-medium">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl border transition-all duration-200 shadow-[0_1px_2px_rgba(45,52,54,0.04)]
          ${disabled ? 'bg-[#ECEEED] border-[#E8E8E6] text-[#B2BEC3] cursor-not-allowed' : ''}
          ${!disabled && hasValue
            ? 'bg-[#7C9885]/5 border-[#7C9885]/30 text-[#2D3436]'
            : !disabled
              ? 'bg-[#FEFEFE] border-[#E8E8E6] text-[#2D3436] hover:border-[#D5D5D3]'
              : ''
          }
          ${error ? 'border-[#C0736D]/50' : ''}
        `}
      >
        <span className={hasValue ? 'text-[#2D3436]' : 'text-[#B2BEC3]'}>
          {displayValue}
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
              }}
              className="p-0.5 hover:bg-[#ECEEED] rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#B2BEC3] hover:text-[#636E72]" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#B2BEC3] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-[0_4px_12px_rgba(45,52,54,0.08)] overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
                  ${value === option.value
                    ? 'bg-[#7C9885]/10 text-[#7C9885]'
                    : 'text-[#2D3436] hover:bg-[#F5F6F4]'
                  }
                `}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-[#7C9885]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-[#C0736D]">{error}</p>
      )}
    </div>
  );
}

/**
 * MultiSelect Component - Premium Banking Style
 */
export function MultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Selecteer...',
  searchable = true,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const displayValue = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label || selected[0]
      : `${selected.length} geselecteerd`;

  const hasValue = selected.length > 0;

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm text-[#636E72] mb-2 font-medium">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl border transition-all duration-200 shadow-[0_1px_2px_rgba(45,52,54,0.04)]
          ${disabled ? 'bg-[#ECEEED] border-[#E8E8E6] text-[#B2BEC3] cursor-not-allowed' : ''}
          ${!disabled && hasValue
            ? 'bg-[#7C9885]/5 border-[#7C9885]/30 text-[#2D3436]'
            : !disabled
              ? 'bg-[#FEFEFE] border-[#E8E8E6] text-[#2D3436] hover:border-[#D5D5D3]'
              : ''
          }
        `}
      >
        <span className={hasValue ? 'text-[#2D3436]' : 'text-[#B2BEC3]'}>
          {displayValue}
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-0.5 hover:bg-[#ECEEED] rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#B2BEC3] hover:text-[#636E72]" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#B2BEC3] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-[0_4px_12px_rgba(45,52,54,0.08)] overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-[#E8E8E6]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F6F4] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option.value);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
                    ${isSelected ? 'bg-[#7C9885]/5' : 'hover:bg-[#F5F6F4]'}
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${isSelected ? 'bg-[#7C9885] border-[#7C9885]' : 'border-[#D5D5D3]'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className={isSelected ? 'text-[#7C9885] font-medium' : 'text-[#2D3436]'}>
                      {option.label}
                    </span>
                  </span>
                  {option.count !== undefined && option.count > 0 && (
                    <span className="text-[#B2BEC3] text-xs bg-[#ECEEED] px-1.5 py-0.5 rounded">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-6 text-center text-[#B2BEC3] text-sm">
                Geen resultaten
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dropdown;
