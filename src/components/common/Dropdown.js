import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

/**
 * Dropdown Component
 *
 * Single-select dropdown with consistent styling
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
        <label className="block text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200
          ${disabled ? 'bg-gray-900/20 border-gray-800/30 text-gray-600 cursor-not-allowed' : ''}
          ${!disabled && hasValue
            ? 'bg-gradient-to-r from-[#28EBCF]/10 to-[#28EBCF]/5 border-[#28EBCF]/30 text-white'
            : !disabled
              ? 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600'
              : ''
          }
          ${error ? 'border-red-500/50' : ''}
        `}
      >
        <span className={hasValue ? 'text-white' : 'text-gray-400'}>
          {displayValue}
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && !disabled && (
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

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
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
                  w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all
                  ${value === option.value
                    ? 'bg-[#28EBCF]/10 text-[#28EBCF]'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }
                `}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-[#28EBCF]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

/**
 * MultiSelect Component
 *
 * Multi-select dropdown with search
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
        <label className="block text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200
          ${disabled ? 'bg-gray-900/20 border-gray-800/30 text-gray-600 cursor-not-allowed' : ''}
          ${!disabled && hasValue
            ? 'bg-gradient-to-r from-[#28EBCF]/10 to-[#28EBCF]/5 border-[#28EBCF]/30 text-white'
            : !disabled
              ? 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600'
              : ''
          }
        `}
      >
        <span className={hasValue ? 'text-white' : 'text-gray-400'}>
          {displayValue}
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {searchable && (
            <div className="p-2.5 border-b border-gray-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]/30"
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
                    w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all
                    ${isSelected ? 'bg-[#28EBCF]/10' : 'hover:bg-gray-800/50'}
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${isSelected ? 'bg-[#28EBCF] border-[#28EBCF]' : 'border-gray-600'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-gray-900" />}
                    </span>
                    <span className={isSelected ? 'text-[#28EBCF] font-medium' : 'text-gray-300'}>
                      {option.label}
                    </span>
                  </span>
                  {option.count !== undefined && option.count > 0 && (
                    <span className="text-gray-600 text-xs bg-gray-800/50 px-1.5 py-0.5 rounded">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
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
