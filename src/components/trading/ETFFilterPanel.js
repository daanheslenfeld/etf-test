// ETF Filter Panel - Premium Fintech Style with Collapsible Sections
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, Building2, Filter, Sliders } from 'lucide-react';
import { CATEGORY_FILTERS, getFilterOptions } from '../../data/filterDefinitions';
import { CollapsibleFilterSection } from '../common/CollapsibleSection';

/**
 * Premium single-select dropdown filter
 */
function FilterDropdown({ label, options, value, onChange, placeholder = "Alle", icon: Icon, compact = false }) {
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
      {!compact && (
        <label className="block text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm min-h-[44px] rounded-lg border transition-all duration-200 ${
          hasValue
            ? 'bg-gradient-to-r from-[#28EBCF]/10 to-[#28EBCF]/5 border-[#28EBCF]/30 text-white shadow-sm shadow-[#28EBCF]/5'
            : 'bg-gray-900/40 border-gray-700/30 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60'
        }`}
      >
        <span className={`flex items-center gap-2 ${hasValue ? 'text-white' : 'text-gray-400'}`}>
          {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
          <span className="truncate">{compact ? label : displayValue}</span>
          {compact && hasValue && (
            <span className="text-[#28EBCF]">: {displayValue}</span>
          )}
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
 * Provider Filter Grid - Visual card-based selection
 */
function ProviderFilterGrid({ providers = [], selectedProviders = [], onToggleProvider }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProviders = providers.filter(p =>
    p.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (provider) => {
    onToggleProvider(provider);
  };

  const handleSelectAll = () => {
    const unselected = providers.filter(p => !selectedProviders.includes(p.value));
    unselected.forEach(p => onToggleProvider(p.value));
  };

  const handleClearAll = () => {
    selectedProviders.forEach(p => onToggleProvider(p));
  };

  return (
    <div className="space-y-3">
      {/* Search and quick actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Zoek aanbieder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-800/40 border border-gray-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]/30 focus:ring-1 focus:ring-[#28EBCF]/10"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 text-[#28EBCF] hover:bg-[#28EBCF]/10 rounded transition-colors"
          >
            Alles
          </button>
          <span className="text-gray-700">|</span>
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            Geen
          </button>
        </div>
      </div>

      {/* Provider grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filteredProviders.map((provider) => {
          const isSelected = selectedProviders.includes(provider.value);
          return (
            <button
              key={provider.value}
              onClick={() => handleToggle(provider.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-[#28EBCF] bg-[#28EBCF]/10'
                  : 'border-gray-700/30 hover:border-gray-600 bg-gray-800/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {provider.label}
                </span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
                  isSelected
                    ? 'bg-[#28EBCF] border-[#28EBCF]'
                    : 'border-gray-600'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-gray-900" />}
                </span>
              </div>
              {provider.count !== undefined && provider.count > 0 && (
                <span className={`text-xs mt-1 block ${isSelected ? 'text-[#28EBCF]/70' : 'text-gray-500'}`}>
                  {provider.count} ETFs
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Geen aanbieders gevonden
        </div>
      )}

      {/* Selection summary */}
      {selectedProviders.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/30">
          <span className="text-xs text-gray-500">
            {selectedProviders.length} van {providers.length} geselecteerd
          </span>
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Selectie wissen
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ETFFilterPanel - Premium Fintech Style with Sections
 */
export default function ETFFilterPanel({
  category,
  filters,
  onSetFilter,
  providers,
  selectedProviders,
  onToggleProvider,
  layout = 'grid', // 'grid' | 'vertical' | 'sectioned'
}) {
  const categoryConfig = CATEGORY_FILTERS[category];

  if (!categoryConfig) {
    return null;
  }

  // Count active filters per section
  const getActiveCount = (sectionFilters) => {
    return sectionFilters.filter(f => filters[f.id] && filters[f.id] !== 'all').length;
  };

  // Handle provider change for compatibility
  const handleProviderChange = (providerValue) => {
    onToggleProvider(providerValue);
  };

  // Layout classes based on prop
  const getGridClasses = () => {
    if (layout === 'vertical') return 'flex flex-col space-y-3';
    return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
  };

  // Sectioned layout (default for better organization)
  if (layout === 'sectioned' || layout === 'grid') {
    return (
      <div className="space-y-5">
        {/* Render each section */}
        {categoryConfig.sections.map((section, sectionIdx) => {
          const activeCount = getActiveCount(section.filters);
          const isPrimary = section.id === 'primary';

          return (
            <CollapsibleFilterSection
              key={section.id}
              title={section.label}
              defaultOpen={isPrimary}
              activeCount={activeCount}
            >
              <div className={getGridClasses()}>
                {section.filters.map((filterDef) => {
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
              </div>
            </CollapsibleFilterSection>
          );
        })}

        {/* Provider section */}
        <CollapsibleFilterSection
          title="Aanbieder"
          defaultOpen={false}
          activeCount={selectedProviders?.length || 0}
        >
          <ProviderFilterGrid
            providers={providers}
            selectedProviders={selectedProviders}
            onToggleProvider={handleProviderChange}
          />
        </CollapsibleFilterSection>
      </div>
    );
  }

  // Vertical layout (for mobile drawer)
  return (
    <div className="space-y-4">
      {/* All filters in vertical stack */}
      <div className="flex flex-col space-y-3">
        {categoryConfig.sections.flatMap(section => section.filters).map((filterDef) => {
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
      </div>

      {/* Provider grid */}
      <div className="pt-4 border-t border-gray-800/30">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Aanbieder
        </div>
        <ProviderFilterGrid
          providers={providers}
          selectedProviders={selectedProviders}
          onToggleProvider={handleProviderChange}
        />
      </div>
    </div>
  );
}
