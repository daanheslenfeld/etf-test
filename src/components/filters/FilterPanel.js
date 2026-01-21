import React from 'react';
import { FilterDropdown } from './FilterDropdown';
import { FilterMultiSelect } from './FilterMultiSelect';
import { FilterSection, FilterGrid } from './FilterSection';
import { CATEGORY_FILTERS, getFilterOptions } from '../../data/filterDefinitions';

/**
 * FilterPanel Component
 *
 * Dynamic filter panel that renders filters based on category configuration
 * Supports single-select dropdowns and multi-select for providers
 */
export function FilterPanel({
  category,
  filters = {},
  onFilterChange,
  providers = [],
  selectedProviders = [],
  onProviderChange,
  showSections = false,
  showTips = true,
  cols = 5,
  className = '',
}) {
  const categoryConfig = CATEGORY_FILTERS[category];

  if (!categoryConfig) {
    return null;
  }

  // Handle provider change (convert to toggle operations if needed)
  const handleProviderChange = (newSelection) => {
    if (onProviderChange) {
      onProviderChange(newSelection);
    }
  };

  // Render filters grouped by section
  if (showSections) {
    return (
      <div className={`space-y-4 ${className}`}>
        {categoryConfig.sections.map((section, index) => (
          <FilterSection
            key={section.id}
            title={section.label}
            collapsible={section.priority > 1}
            defaultExpanded={section.priority === 1}
          >
            <FilterGrid cols={cols}>
              {section.filters.map((filterDef) => {
                const options = getFilterOptions(filterDef.options);
                return (
                  <FilterDropdown
                    key={filterDef.id}
                    label={filterDef.label}
                    options={options}
                    value={filters[filterDef.id] || 'all'}
                    onChange={(value) => onFilterChange(filterDef.id, value)}
                  />
                );
              })}
            </FilterGrid>
          </FilterSection>
        ))}

        {/* Provider section */}
        <FilterSection title="Aanbieder" collapsible defaultExpanded={false}>
          <FilterGrid cols={1}>
            <FilterMultiSelect
              options={providers}
              selected={selectedProviders}
              onChange={handleProviderChange}
              placeholder="Alle aanbieders"
              searchable
              searchPlaceholder="Zoek aanbieder..."
            />
          </FilterGrid>
        </FilterSection>

        {showTips && <FilterTip />}
      </div>
    );
  }

  // Render all filters in a flat grid (default)
  const allFilters = categoryConfig.sections.flatMap(section => section.filters);

  return (
    <div className={`space-y-4 ${className}`}>
      <FilterGrid cols={cols}>
        {/* Regular filters */}
        {allFilters.map((filterDef) => {
          const options = getFilterOptions(filterDef.options);
          return (
            <FilterDropdown
              key={filterDef.id}
              label={filterDef.label}
              options={options}
              value={filters[filterDef.id] || 'all'}
              onChange={(value) => onFilterChange(filterDef.id, value)}
            />
          );
        })}

        {/* Provider multi-select */}
        <FilterMultiSelect
          label="Aanbieder"
          options={providers}
          selected={selectedProviders}
          onChange={handleProviderChange}
          placeholder="Alle aanbieders"
          searchable
          searchPlaceholder="Zoek aanbieder..."
        />
      </FilterGrid>

      {showTips && <FilterTip />}
    </div>
  );
}

/**
 * FilterTip - Helpful hint about filter usage
 */
function FilterTip() {
  return (
    <div className="flex items-center gap-4 pt-2 border-t border-gray-800/30">
      <span className="text-[10px] text-gray-600 uppercase tracking-wider">Tip</span>
      <span className="text-xs text-gray-500">
        Combineer filters voor precisere resultaten
      </span>
    </div>
  );
}

/**
 * FilterPanelCompact - Minimal filter panel for limited space
 */
export function FilterPanelCompact({
  category,
  filters = {},
  onFilterChange,
  primaryFilters = ['region', 'sector'],
  className = '',
}) {
  const categoryConfig = CATEGORY_FILTERS[category];

  if (!categoryConfig) return null;

  // Get only primary filters
  const allFilters = categoryConfig.sections.flatMap(section => section.filters);
  const filtersToShow = allFilters.filter(f => primaryFilters.includes(f.id));

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filtersToShow.map((filterDef) => {
        const options = getFilterOptions(filterDef.options);
        return (
          <FilterDropdown
            key={filterDef.id}
            options={options}
            value={filters[filterDef.id] || 'all'}
            onChange={(value) => onFilterChange(filterDef.id, value)}
            placeholder={filterDef.label}
            size="sm"
            className="min-w-[140px]"
          />
        );
      })}
    </div>
  );
}

export default FilterPanel;
