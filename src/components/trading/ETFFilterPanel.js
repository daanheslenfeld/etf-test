// ETF Filter Panel - Pastel Design System with Collapsible Sections
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, Building2, Filter, Sliders } from 'lucide-react';
import { CATEGORY_FILTERS, getFilterOptions } from '../../data/filterDefinitions';
import { CollapsibleFilterSection } from '../common/CollapsibleSection';

/**
 * Pastel single-select dropdown filter with fixed positioning
 */
function FilterDropdown({ label, options, value, onChange, placeholder = "Alle", icon: Icon, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // approximate max height

      // Check if dropdown would go off-screen at bottom
      const spaceBelow = viewportHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        ...(openUpward
          ? { bottom: viewportHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }
        ),
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on page scroll (not dropdown scroll)
  useEffect(() => {
    if (isOpen) {
      const handleScroll = (e) => {
        // Don't close if scrolling inside the dropdown
        if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
          return;
        }
        setIsOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption && value !== 'all' ? selectedOption.label : placeholder;
  const hasValue = value && value !== 'all';

  return (
    <div className="relative">
      {!compact && (
        <label className="block text-[11px] text-[#5F7066] mb-1.5 font-medium uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm min-h-[44px] rounded-2xl border transition-all duration-200 ${
          hasValue
            ? 'bg-[#E6F0EB] border-[#8AB4A0]/30 text-[#2D3E36] shadow-[0_1px_3px_rgba(45,62,54,0.05)]'
            : 'bg-white border-[#E4E8E5] text-[#5F7066] hover:border-[#C8D0CA] hover:bg-[#FAFBF9]'
        }`}
      >
        <span className={`flex items-center gap-2 ${hasValue ? 'text-[#2D3E36]' : 'text-[#5F7066]'}`}>
          {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
          <span className="truncate">{compact ? label : displayValue}</span>
          {compact && hasValue && (
            <span className="text-[#5F8A74]">: {displayValue}</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
              }}
              className="p-1 hover:bg-[#F0F2EE] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[#95A39A] hover:text-[#5F7066]" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#95A39A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="z-[9999] bg-white border border-[#E4E8E5] rounded-2xl shadow-[0_8px_32px_rgba(45,62,54,0.12)] overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto py-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all ${
                  value === option.value
                    ? 'bg-[#E6F0EB] text-[#5F8A74]'
                    : 'text-[#5F7066] hover:bg-[#FAFBF9] hover:text-[#2D3E36]'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-[#8AB4A0]" />
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
 * Multi-select dropdown for providers with fixed positioning
 */
function ProviderDropdown({ label = "Aanbieder", providers = [], selectedProviders = [], onToggleProvider }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredProviders = providers.filter(p =>
    p.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 300;

      const spaceBelow = viewportHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        ...(openUpward
          ? { bottom: viewportHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }
        ),
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on page scroll (not dropdown scroll)
  useEffect(() => {
    if (isOpen) {
      const handleScroll = (e) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
          return;
        }
        setIsOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen]);

  const handleClearAll = () => {
    selectedProviders.forEach(p => onToggleProvider(p));
  };

  const hasValue = selectedProviders.length > 0;
  const displayValue = hasValue
    ? `${selectedProviders.length} geselecteerd`
    : 'Alle';

  return (
    <div className="relative">
      <label className="block text-[11px] text-[#5F7066] mb-1.5 font-medium uppercase tracking-wider">
        {label}
      </label>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm min-h-[44px] rounded-2xl border transition-all duration-200 ${
          hasValue
            ? 'bg-[#E6F0EB] border-[#8AB4A0]/30 text-[#2D3E36] shadow-[0_1px_3px_rgba(45,62,54,0.05)]'
            : 'bg-white border-[#E4E8E5] text-[#5F7066] hover:border-[#C8D0CA] hover:bg-[#FAFBF9]'
        }`}
      >
        <span className={`flex items-center gap-2 ${hasValue ? 'text-[#2D3E36]' : 'text-[#5F7066]'}`}>
          <Building2 className="w-3.5 h-3.5 opacity-60" />
          <span className="truncate">{displayValue}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {hasValue && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-1 hover:bg-[#F0F2EE] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[#95A39A] hover:text-[#5F7066]" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#95A39A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="z-[9999] bg-white border border-[#E4E8E5] rounded-2xl shadow-[0_8px_32px_rgba(45,62,54,0.12)] overflow-hidden"
        >
          {/* Search */}
          <div className="p-2.5 border-b border-[#E4E8E5]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A39A]" />
              <input
                type="text"
                placeholder="Zoek aanbieder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAFBF9] border border-[#E4E8E5] rounded-xl text-[#2D3E36] placeholder-[#95A39A] focus:outline-none focus:border-[#8AB4A0]/40 focus:ring-2 focus:ring-[#8AB4A0]/10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto py-1.5">
            {filteredProviders.map((provider) => {
              const isSelected = selectedProviders.includes(provider.value);
              return (
                <button
                  key={provider.value}
                  onClick={() => onToggleProvider(provider.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all ${
                    isSelected
                      ? 'bg-[#E6F0EB] text-[#5F8A74]'
                      : 'text-[#5F7066] hover:bg-[#FAFBF9] hover:text-[#2D3E36]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#8AB4A0] border-[#8AB4A0]'
                        : 'border-[#C8D0CA]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span>{provider.label}</span>
                  </span>
                  {provider.count !== undefined && provider.count > 0 && (
                    <span className="text-xs text-[#95A39A]">{provider.count}</span>
                  )}
                </button>
              );
            })}
            {filteredProviders.length === 0 && (
              <div className="px-4 py-3 text-[#95A39A] text-sm">Geen aanbieders gevonden</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ETFFilterPanel - Pastel Design System with Sections
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
    return <div className="text-[#B8847A] p-4 bg-[#F8EFED] rounded-xl">No config for category: {category}</div>;
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

        {/* Provider dropdown in its own row */}
        <div className={getGridClasses()}>
          <ProviderDropdown
            providers={providers}
            selectedProviders={selectedProviders}
            onToggleProvider={handleProviderChange}
          />
        </div>
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

      {/* Provider dropdown */}
      <ProviderDropdown
        providers={providers}
        selectedProviders={selectedProviders}
        onToggleProvider={handleProviderChange}
      />
    </div>
  );
}
