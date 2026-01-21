// ETF Filter Panel - Premium Fintech Style
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, Building2 } from 'lucide-react';
import { CATEGORY_FILTERS, getFilterOptions } from '../../data/filterDefinitions';

/**
 * Premium single-select dropdown filter
 */
function FilterDropdown({ label, options, value, onChange, placeholder = "Alle", icon: Icon }) {
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
  const displayValue = selectedOption && value !== 'all' ? selectedOption.label : placeholder;
  const hasValue = value && value !== 'all';

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm min-h-[44px] rounded-lg border transition-all duration-200 ${
          hasValue
            ? 'bg-gradient-to-r from-[#28EBCF]/10 to-[#28EBCF]/5 border-[#28EBCF]/30 text-white shadow-sm shadow-[#28EBCF]/5'
            : 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60'
        }`}
      >
        <span className={`flex items-center gap-2 ${hasValue ? 'text-white' : 'text-gray-400'}`}>
          {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
          <span className="truncate">{displayValue}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm min-h-[44px] text-left transition-all ${
                  value === option.value
                    ? 'bg-[#28EBCF]/10 text-[#28EBCF]'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-[#28EBCF]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Premium multi-select dropdown for providers
 */
function MultiSelectDropdown({ label, options, selected = [], onChange, placeholder = "Alle aanbieders" }) {
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

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm min-h-[44px] rounded-lg border transition-all duration-200 ${
          hasValue
            ? 'bg-gradient-to-r from-[#28EBCF]/10 to-[#28EBCF]/5 border-[#28EBCF]/30 text-white shadow-sm shadow-[#28EBCF]/5'
            : 'bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60'
        }`}
      >
        <span className={`flex items-center gap-2 ${hasValue ? 'text-white' : 'text-gray-400'}`}>
          <Building2 className="w-3.5 h-3.5 opacity-60" />
          <span className="truncate">{displayValue}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
          {/* Search */}
          <div className="p-2.5 border-b border-gray-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Zoek aanbieder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm min-h-[44px] bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]/30 focus:ring-1 focus:ring-[#28EBCF]/10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option.value);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm min-h-[44px] text-left transition-all ${
                    isSelected ? 'bg-[#28EBCF]/10' : 'hover:bg-gray-800/50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#28EBCF] border-[#28EBCF]'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-gray-900" />}
                    </span>
                    <span className={`${isSelected ? 'text-[#28EBCF] font-medium' : 'text-gray-300'}`}>
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
                Geen aanbieders gevonden
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ETFFilterPanel - Premium Fintech Style
 */
export default function ETFFilterPanel({
  category,
  filters,
  onSetFilter,
  providers,
  selectedProviders,
  onToggleProvider,
  layout = 'grid', // 'grid' | 'vertical'
}) {
  const categoryConfig = CATEGORY_FILTERS[category];

  if (!categoryConfig) {
    return null;
  }

  // Collect all filters from all sections
  const allFilters = categoryConfig.sections.flatMap(section => section.filters);

  // Handle provider change
  const handleProviderChange = (newSelection) => {
    const current = selectedProviders || [];

    if (newSelection.length === 0) {
      current.forEach(p => onToggleProvider(p));
      return;
    }

    const added = newSelection.filter(p => !current.includes(p));
    const removed = current.filter(p => !newSelection.includes(p));

    added.forEach(p => onToggleProvider(p));
    removed.forEach(p => onToggleProvider(p));
  };

  // Layout classes based on prop
  const gridClasses = layout === 'vertical'
    ? 'flex flex-col space-y-3'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';

  return (
    <div className="space-y-4">
      {/* Filter grid */}
      <div className={gridClasses}>
        {allFilters.map((filterDef) => {
          const options = getFilterOptions(filterDef.options);
          return (
            <FilterDropdown
              key={filterDef.id}
              label={filterDef.label}
              options={options}
              value={filters[filterDef.id] || 'all'}
              onChange={(value) => onSetFilter(filterDef.id, value)}
            />
          );
        })}

        {/* Provider multi-select */}
        <MultiSelectDropdown
          label="Aanbieder"
          options={providers || []}
          selected={selectedProviders || []}
          onChange={handleProviderChange}
        />
      </div>

      {/* Quick filter tips */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-800/30">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Tip:</span>
        <span className="text-xs text-gray-500">
          Combineer filters voor precisere resultaten
        </span>
      </div>
    </div>
  );
}
