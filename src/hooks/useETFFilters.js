// Custom hook voor ETF filter beheer met categorie-awareness en providers
import { useState, useMemo, useCallback } from 'react';
import { TRADABLE_ETFS } from '../data/tradableETFs';
import { enrichETF } from '../utils/etfClassifiers';
import {
  CATEGORIES,
  CATEGORY_FILTERS,
  PROVIDERS,
  getDefaultFilters,
  getFilterChips,
  hasActiveFilters,
} from '../data/filterDefinitions';

// Module-level cache for enriched ETFs - computed ONCE on first import
let enrichedETFsCache = null;

function getEnrichedETFs(etfData) {
  // Return cached if available and using default data
  if (!etfData && enrichedETFsCache) {
    return enrichedETFsCache;
  }

  const sourceData = etfData || TRADABLE_ETFS;
  let result;

  if (Array.isArray(sourceData)) {
    result = sourceData.map(etf => enrichETF(etf));
  } else {
    result = Object.entries(sourceData).map(([isin, data]) =>
      enrichETF({ isin, ...data })
    );
  }

  // Cache if using default data
  if (!etfData) {
    enrichedETFsCache = result;
  }

  return result;
}

/**
 * Custom hook voor ETF filters met categorie-specifieke logica en providers
 */
export function useETFFilters(options = {}) {
  const { etfData, initialCategory = 'equity' } = options;

  // Categorie state
  const [category, setCategory] = useState(initialCategory);

  // Filter state (per categorie)
  const [filters, setFilters] = useState(() => getDefaultFilters(initialCategory));

  // Zoek state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Verrijkte ETFs - uses cache
  const enrichedETFs = useMemo(() => getEnrichedETFs(etfData), [etfData]);

  // Provider counts (per categorie)
  const providerCounts = useMemo(() => {
    const counts = {};
    const categoryETFs = enrichedETFs.filter(etf => etf.assetClass === category);

    PROVIDERS.forEach(provider => {
      counts[provider.value] = categoryETFs.filter(etf => etf.issuer === provider.value).length;
    });

    return counts;
  }, [enrichedETFs, category]);

  // Gefilterde ETFs
  const filteredETFs = useMemo(() => {
    let result = enrichedETFs;

    // Filter op categorie (asset class)
    result = result.filter(etf => etf.assetClass === category);

    // Filter op zoekterm
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(etf =>
        etf.name?.toLowerCase().includes(search) ||
        etf.symbol?.toLowerCase().includes(search) ||
        etf.isin?.toLowerCase().includes(search)
      );
    }

    // Filter op providers (multi-select)
    if (filters.providers && filters.providers.length > 0) {
      result = result.filter(etf => filters.providers.includes(etf.issuer));
    }

    // Pas categorie-specifieke filters toe
    const categoryConfig = CATEGORY_FILTERS[category];
    if (categoryConfig) {
      categoryConfig.sections.forEach(section => {
        section.filters.forEach(filterDef => {
          const filterValue = filters[filterDef.id];
          if (filterValue && filterValue !== 'all') {
            result = result.filter(etf => etf[filterDef.id] === filterValue);
          }
        });
      });
    }

    // Sorteer
    result = [...result].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'symbol':
          aVal = (a.symbol || '').toLowerCase();
          bVal = (b.symbol || '').toLowerCase();
          break;
        case 'exchange':
          aVal = a.exchange || '';
          bVal = b.exchange || '';
          break;
        default:
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
      }
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    return result;
  }, [enrichedETFs, category, filters, searchTerm, sortBy, sortDir]);

  // Categorie counts voor badges
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(cat => {
      counts[cat.value] = enrichedETFs.filter(etf => etf.assetClass === cat.value).length;
    });
    return counts;
  }, [enrichedETFs]);

  // Wissel van categorie (reset filters)
  const changeCategory = useCallback((newCategory) => {
    setCategory(newCategory);
    setFilters(getDefaultFilters(newCategory));
  }, []);

  // Zet een filter waarde
  const setFilter = useCallback((filterId, value) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  // Toggle provider in multi-select
  const toggleProvider = useCallback((providerValue) => {
    setFilters(prev => {
      const currentProviders = prev.providers || [];
      const newProviders = currentProviders.includes(providerValue)
        ? currentProviders.filter(p => p !== providerValue)
        : [...currentProviders, providerValue];
      return {
        ...prev,
        providers: newProviders,
      };
    });
  }, []);

  // Verwijder een filter (reset naar 'all' of verwijder uit providers)
  const removeFilter = useCallback((filterId, value) => {
    if (filterId === 'providers') {
      setFilters(prev => ({
        ...prev,
        providers: (prev.providers || []).filter(p => p !== value),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterId]: 'all',
      }));
    }
  }, []);

  // Reset alle filters voor huidige categorie
  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters(category));
    setSearchTerm('');
  }, [category]);

  // Sort handler
  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }, [sortBy]);

  // Filter chips voor weergave
  const chips = useMemo(() => getFilterChips(filters, category), [filters, category]);

  // Actieve filters check
  const hasFilters = useMemo(() =>
    hasActiveFilters(filters) || searchTerm.trim() !== '',
    [filters, searchTerm]
  );

  // Providers met counts
  const providersWithCounts = useMemo(() =>
    PROVIDERS.map(p => ({
      ...p,
      count: providerCounts[p.value] || 0,
    })).filter(p => p.count > 0).sort((a, b) => b.count - a.count),
    [providerCounts]
  );

  return {
    // Data
    enrichedETFs,
    filteredETFs,
    categoryCounts,

    // Categorie
    category,
    categories: CATEGORIES,
    changeCategory,

    // Filter state
    filters,
    searchTerm,
    sortBy,
    sortDir,

    // Providers
    providers: providersWithCounts,
    toggleProvider,

    // Derived state
    chips,
    hasFilters,
    totalCount: enrichedETFs.length,
    categoryCount: categoryCounts[category] || 0,
    filteredCount: filteredETFs.length,

    // Actions
    setFilter,
    removeFilter,
    resetFilters,
    setSearchTerm,
    handleSort,
  };
}

export default useETFFilters;
