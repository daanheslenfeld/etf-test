import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

/**
 * FilterMultiSelect Component
 *
 * Multi-select dropdown filter with search functionality
 * Used for providers, tags, and other multi-value filters
 */
export function FilterMultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Selecteer...',
  icon: Icon,
  searchable = true,
  searchPlaceholder = 'Zoeken...',
  disabled = false,
  showCounts = true,
  maxDisplay = 2,
  size = 'md',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  // Display value
  const getDisplayValue = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const option = options.find(o => o.value === selected[0]);
      return option?.label || selected[0];
    }
    if (selected.length <= maxDisplay) {
      return selected
        .map(v => options.find(o => o.value === v)?.label || v)
        .join(', ');
    }
    return `${selected.length} geselecteerd`;
  };

  const hasValue = selected.length > 0;

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectAll = () => {
    onChange(options.map(o => o.value));
  };

  const sizes = {
    sm: {
      button: 'px-2.5 py-2 text-xs min-h-[40px]',
      label: 'text-[10px] mb-1',
      option: 'px-3 py-2.5 text-xs min-h-[40px]',
      search: 'px-2 py-2 text-xs min-h-[40px]',
      checkbox: 'w-4 h-4',
      checkIcon: 'w-2.5 h-2.5',
    },
    md: {
      button: 'px-3.5 py-2.5 text-sm min-h-[44px]',
      label: 'text-[11px] mb-1.5',
      option: 'px-4 py-3 text-sm min-h-[44px]',
      search: 'px-3 py-2.5 text-sm min-h-[44px]',
      checkbox: 'w-5 h-5',
      checkIcon: 'w-3 h-3',
    },
    lg: {
      button: 'px-4 py-3.5 text-base min-h-[48px]',
      label: 'text-xs mb-2',
      option: 'px-4 py-3.5 text-base min-h-[48px]',
      search: 'px-3 py-3 text-base min-h-[48px]',
      checkbox: 'w-6 h-6',
      checkIcon: 'w-3.5 h-3.5',
    },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block ${sizeConfig.label} text-[#B2BEC3] font-medium uppercase tracking-wider`}>
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
            ? 'bg-[#F5F6F4]/50 border-[#E8E8E6]/30 text-[#B2BEC3] cursor-not-allowed'
            : hasValue
              ? 'bg-[#7C9885]/10 border-[#7C9885]/30 text-[#2D3436] shadow-sm'
              : 'bg-[#FEFEFE] border-[#E8E8E6] text-[#636E72] hover:border-[#7C9885]/50 hover:bg-[#F5F6F4]'
          }
        `}
      >
        <span className={`flex items-center gap-2 truncate ${hasValue ? 'text-[#2D3436]' : 'text-[#636E72]'}`}>
          {Icon && <Icon className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
          <span className="truncate">{getDisplayValue()}</span>
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasValue && !disabled && (
            <span
              onClick={clearAll}
              className="p-0.5 hover:bg-[#2D3436]/10 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#636E72] hover:text-[#2D3436]" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#B2BEC3] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-[0_4px_20px_rgba(45,52,54,0.15)] overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="p-2.5 border-b border-[#E8E8E6]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B2BEC3]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 ${sizeConfig.search} bg-[#F5F6F4] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885]/50 focus:ring-1 focus:ring-[#7C9885]/20`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Quick actions */}
          {options.length > 3 && (
            <div className="px-3 py-2 border-b border-[#E8E8E6] flex items-center justify-between">
              <span className="text-xs text-[#B2BEC3]">
                {selected.length} van {options.length} geselecteerd
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-[#7C9885] hover:text-[#6B8A74] transition-colors"
                >
                  Alles
                </button>
                <span className="text-[#E8E8E6]">|</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-[#636E72] hover:text-[#2D3436] transition-colors"
                >
                  Geen
                </button>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[#E8E8E6]">
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
                    w-full flex items-center justify-between ${sizeConfig.option} text-left transition-all
                    ${isSelected ? 'bg-[#7C9885]/10' : 'hover:bg-[#F5F6F4]'}
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className={`
                      ${sizeConfig.checkbox} rounded border-2 flex items-center justify-center transition-all flex-shrink-0
                      ${isSelected ? 'bg-[#7C9885] border-[#7C9885]' : 'border-[#E8E8E6] hover:border-[#7C9885]/50'}
                    `}>
                      {isSelected && <Check className={`${sizeConfig.checkIcon} text-white`} />}
                    </span>
                    <span className="flex items-center gap-2">
                      {option.icon && <option.icon className="w-4 h-4 opacity-60" />}
                      <span className={isSelected ? 'text-[#7C9885] font-medium' : 'text-[#636E72]'}>
                        {option.label}
                      </span>
                    </span>
                  </span>
                  {showCounts && option.count !== undefined && option.count > 0 && (
                    <span className="text-[#B2BEC3] text-xs bg-[#F5F6F4] px-1.5 py-0.5 rounded">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-6 text-center text-[#B2BEC3] text-sm">
                Geen resultaten gevonden
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterMultiSelect;
