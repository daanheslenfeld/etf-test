import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  ShoppingCart,
  X,
  Building,
  Gem,
  Home,
  Wallet,
  Bitcoin,
  Layers,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { getTradableCount } from '../../data/tradableETFs';
import { useETFFilters } from '../../hooks/useETFFilters';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { MobileDrawer, DrawerSection } from '../common/MobileDrawer';
import { Button } from '../common';
import ETFFilterPanel from './ETFFilterPanel';

// Category configuration with premium banking colors
const CATEGORY_CONFIG = {
  equity: {
    icon: TrendingUp,
    label: 'Aandelen',
    color: '#7C9885',
    gradient: 'from-[#7C9885]/20 to-[#7C9885]/5',
    description: 'Aandelen ETFs',
  },
  bonds: {
    icon: Building,
    label: 'Obligaties',
    color: '#6B7B8A',
    gradient: 'from-[#6B7B8A]/20 to-[#6B7B8A]/5',
    description: 'Obligatie ETFs',
  },
  commodities: {
    icon: Gem,
    label: 'Commodities',
    color: '#C9A962',
    gradient: 'from-[#C9A962]/20 to-[#C9A962]/5',
    description: 'Grondstof ETFs',
  },
  realEstate: {
    icon: Home,
    label: 'Vastgoed',
    color: '#8B7B9A',
    gradient: 'from-[#8B7B9A]/20 to-[#8B7B9A]/5',
    description: 'Vastgoed ETFs',
  },
  moneyMarket: {
    icon: Wallet,
    label: 'Money Market',
    color: '#6B7B8A',
    gradient: 'from-[#6B7B8A]/20 to-[#6B7B8A]/5',
    description: 'Geldmarkt ETFs',
  },
  crypto: {
    icon: Bitcoin,
    label: 'Crypto',
    color: '#C9A962',
    gradient: 'from-[#C9A962]/20 to-[#C9A962]/5',
    description: 'Crypto ETPs',
  },
  mixed: {
    icon: Layers,
    label: 'Mixed',
    color: '#636E72',
    gradient: 'from-[#636E72]/20 to-[#636E72]/5',
    description: 'Multi-Asset ETFs',
  },
};

export default function ETFBrowser({ onAddToOrder }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const {
    filteredETFs,
    categoryCounts,
    category,
    categories,
    changeCategory,
    filters,
    searchTerm,
    sortBy,
    sortDir,
    providers,
    toggleProvider,
    chips,
    hasFilters,
    filteredCount,
    setFilter,
    removeFilter,
    resetFilters,
    setSearchTerm,
    handleSort,
  } = useETFFilters();

  // Count active filters (excluding category)
  const activeFilterCount = chips.length;
  const currentConfig = CATEGORY_CONFIG[category];

  const handleAddToOrder = (etf) => {
    if (onAddToOrder) {
      onAddToOrder({
        isin: etf.isin,
        symbol: etf.symbol,
        name: etf.name,
        exchange: etf.exchange,
        currency: etf.currency,
        conid: etf.conid,
      });
    }
  };

  return (
    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Premium Header */}
      <div className="relative">
        <div className="relative p-6 border-b border-[#E8E8E6]">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#7C9885]/10 rounded-xl border border-[#7C9885]/20">
                <TrendingUp className="w-5 h-5 text-[#7C9885]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#2D3436] tracking-tight">ETF Browser</h2>
                <p className="text-sm text-[#B2BEC3]">Ontdek & Trade</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C9885]/60" />
              <span className="px-3 py-1.5 bg-[#7C9885]/10 text-[#7C9885] text-sm rounded-full font-medium border border-[#7C9885]/20">
                {getTradableCount()} ETFs
              </span>
            </div>
          </div>

          {/* Category Cards - Premium Design with Left Border Accent */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 mb-6">
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat.value];
              const Icon = config?.icon || TrendingUp;
              const isActive = category === cat.value;
              const count = categoryCounts[cat.value] || 0;

              return (
                <button
                  key={cat.value}
                  onClick={() => changeCategory(cat.value)}
                  className={`group relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-br ${config?.gradient || 'from-[#ECEEED] to-[#F5F6F4]'} border-2 border-[${config?.color}]/30`
                      : 'bg-[#F5F6F4] border border-[#E8E8E6] hover:bg-[#ECEEED] hover:border-[#D5D5D3]'
                  }`}
                  style={{
                    boxShadow: isActive ? `0 4px 20px ${config?.color}10` : undefined,
                  }}
                >
                  {/* Left border accent for active state */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                      style={{ backgroundColor: config?.color }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className={`p-2.5 rounded-xl mb-2 transition-all duration-200 ${
                      isActive ? '' : 'bg-[#FEFEFE] group-hover:bg-[#F5F6F4]'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${config?.color}15` : undefined,
                    }}
                  >
                    <Icon
                      className="w-4 h-4 transition-colors"
                      style={{ color: isActive ? config?.color : '#636E72' }}
                    />
                  </div>

                  {/* Label */}
                  <span className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-[#2D3436]' : 'text-[#636E72] group-hover:text-[#2D3436]'
                  }`}>
                    {config?.label || cat.label}
                  </span>

                  {/* Count badge */}
                  <span
                    className={`text-[10px] mt-1 px-1.5 py-0.5 rounded transition-colors ${
                      isActive
                        ? 'bg-white/60 text-[#636E72] font-medium'
                        : 'text-[#B2BEC3] group-hover:text-[#636E72]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Filter button row */}
          <div className="flex gap-3">
            {/* Search - Premium Style */}
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-[#ECEEED] rounded">
                <Search className="w-4 h-4 text-[#636E72]" />
              </div>
              <input
                type="text"
                placeholder="Zoek op naam, symbol of ISIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885]/40 focus:ring-2 focus:ring-[#7C9885]/10 transition-all"
              />
            </div>

            {/* Filter button - Premium Style */}
            <button
              onClick={() => isMobile ? setFilterDrawerOpen(true) : setShowFilters(!showFilters)}
              className={`flex items-center gap-2.5 px-5 py-3 min-h-[48px] rounded-xl text-sm font-medium transition-all duration-300 ${
                showFilters || filterDrawerOpen || activeFilterCount > 0
                  ? 'bg-[#7C9885] text-white shadow-[0_2px_8px_rgba(124,152,133,0.25)]'
                  : 'bg-[#FEFEFE] text-[#636E72] hover:bg-[#F5F6F4] border border-[#E8E8E6] hover:border-[#D5D5D3]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                  showFilters || filterDrawerOpen ? 'bg-white/20 text-white' : 'bg-[#7C9885] text-white'
                }`}>
                  {activeFilterCount}
                </span>
              )}
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 hidden sm:block ${showFilters ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Filter Panel - Animated Slide (Desktop only) */}
          {!isMobile && (
            <div className={`overflow-hidden transition-all duration-400 ease-out ${
              showFilters ? 'max-h-[500px] opacity-100 mt-5' : 'max-h-0 opacity-0'
            }`}>
              <div className="p-5 bg-[#F5F6F4] rounded-xl border border-[#E8E8E6]">
                <ETFFilterPanel
                  category={category}
                  filters={filters}
                  onSetFilter={setFilter}
                  providers={providers}
                  selectedProviders={filters.providers}
                  onToggleProvider={toggleProvider}
                />
              </div>
            </div>
          )}

          {/* Results count - Premium Style */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: currentConfig?.color || '#7C9885' }}
              />
              <span className="text-[#636E72] text-sm">
                <span className="text-[#2D3436] font-semibold">{filteredCount}</span> ETFs gevonden
              </span>
            </div>
            {hasFilters && (
              <span className="text-[#B2BEC3] text-xs bg-[#F5F6F4] px-2 py-1 rounded">
                van {categoryCounts[category]} in {currentConfig?.label || 'deze categorie'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Active Filters Bar */}
      {activeFilterCount > 0 && (
        <div className="sticky top-0 z-20 px-5 py-3 bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-medium text-[#B2BEC3] uppercase tracking-wider mr-1 hidden sm:inline">
                Actief:
              </span>
              {chips.map((chip) => (
                <span
                  key={`${chip.filterId}-${chip.value}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#7C9885]/10 text-[#7C9885] border border-[#7C9885]/20 hover:bg-[#7C9885]/20 transition-all"
                >
                  <span className="text-[#7C9885]/70">{chip.filterLabel}:</span>
                  <span>{chip.label || chip.valueLabel}</span>
                  <button
                    onClick={() => removeFilter(chip.filterId, chip.value)}
                    className="ml-0.5 p-0.5 hover:bg-[#7C9885]/20 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-[#636E72] hover:text-[#2D3436] px-2.5 py-1.5 hover:bg-[#F5F6F4] rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Wis alles</span>
            </button>
          </div>
        </div>
      )}

      {/* Table - Premium Style */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-[#F5F6F4] sticky top-0 z-10">
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-[#636E72] uppercase tracking-wider cursor-pointer hover:text-[#2D3436] transition-colors group"
                onClick={() => handleSort('symbol')}
              >
                <span className="flex items-center gap-2">
                  Symbol
                  {sortBy === 'symbol' && (
                    <span className="text-[#7C9885] bg-[#7C9885]/10 px-1.5 py-0.5 rounded text-[10px]">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-[#636E72] uppercase tracking-wider cursor-pointer hover:text-[#2D3436] transition-colors"
                onClick={() => handleSort('name')}
              >
                <span className="flex items-center gap-2">
                  Naam
                  {sortBy === 'name' && (
                    <span className="text-[#7C9885] bg-[#7C9885]/10 px-1.5 py-0.5 rounded text-[10px]">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-[#636E72] uppercase tracking-wider cursor-pointer hover:text-[#2D3436] transition-colors hidden md:table-cell"
                onClick={() => handleSort('exchange')}
              >
                <span className="flex items-center gap-2">
                  Exchange
                  {sortBy === 'exchange' && (
                    <span className="text-[#7C9885] bg-[#7C9885]/10 px-1.5 py-0.5 rounded text-[10px]">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#636E72] uppercase tracking-wider hidden sm:table-cell">
                Valuta
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#636E72] uppercase tracking-wider">
                Actie
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E6]">
            {filteredETFs.slice(0, 100).map((etf, index) => (
              <tr
                key={etf.isin}
                className="hover:bg-[#F5F6F4] transition-all duration-200 group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-8 rounded-full opacity-60"
                      style={{ backgroundColor: currentConfig?.color || '#7C9885' }}
                    />
                    <span className="font-mono text-[#7C9885] font-semibold text-sm">
                      {etf.symbol}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[#2D3436] text-sm group-hover:text-[#2D3436]">
                    {etf.name.length > 50 ? `${etf.name.slice(0, 50)}...` : etf.name}
                  </div>
                  <div className="text-[#B2BEC3] text-xs font-mono mt-0.5">{etf.isin}</div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-[#636E72] text-sm px-2 py-1 bg-[#F5F6F4] rounded">
                    {etf.exchange}
                  </span>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className="px-2.5 py-1 bg-[#ECEEED] rounded-lg text-xs font-medium text-[#636E72] border border-[#E8E8E6]">
                    {etf.currency}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleAddToOrder(etf)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C9885]/10 text-[#7C9885] rounded-lg hover:bg-[#7C9885]/20 transition-all text-sm font-medium border border-[#7C9885]/20 hover:border-[#7C9885]/30 opacity-70 group-hover:opacity-100"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Trade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* More results message */}
        {filteredETFs.length > 100 && (
          <div className="p-5 text-center bg-gradient-to-t from-[#F5F6F4]/50 to-transparent border-t border-[#E8E8E6]">
            <span className="text-[#636E72] text-sm">
              Toont eerste <span className="text-[#2D3436] font-medium">100</span> van{' '}
              <span className="text-[#2D3436] font-medium">{filteredETFs.length}</span> resultaten
            </span>
            <p className="text-[#B2BEC3] text-xs mt-1">Gebruik filters om te verfijnen</p>
          </div>
        )}

        {/* No results */}
        {filteredETFs.length === 0 && (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F5F6F4] rounded-2xl mb-4">
              <Search className="w-8 h-8 text-[#B2BEC3]" />
            </div>
            <div className="text-[#636E72] text-lg font-medium mb-2">Geen ETFs gevonden</div>
            <div className="text-[#B2BEC3] text-sm mb-4">
              Probeer andere filters of zoektermen
            </div>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 text-sm font-medium text-[#7C9885] bg-[#7C9885]/10 hover:bg-[#7C9885]/20 rounded-xl transition-colors border border-[#7C9885]/20"
              >
                Wis alle filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <MobileDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        position="right"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 min-h-[48px]"
              onClick={() => {
                resetFilters();
              }}
              icon={RotateCcw}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              className="flex-1 min-h-[48px]"
              onClick={() => setFilterDrawerOpen(false)}
            >
              Toon {filteredCount} ETFs
            </Button>
          </div>
        }
      >
        {/* Category selector in drawer */}
        <DrawerSection title="Categorie">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat.value];
              const Icon = config?.icon || TrendingUp;
              const isActive = category === cat.value;
              const count = categoryCounts[cat.value] || 0;

              return (
                <button
                  key={cat.value}
                  onClick={() => changeCategory(cat.value)}
                  className={`flex items-center gap-2 p-3 min-h-[48px] rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${config?.gradient || 'from-[#ECEEED] to-[#F5F6F4]'} border-2`
                      : 'bg-[#F5F6F4] border border-[#E8E8E6] active:bg-[#ECEEED]'
                  }`}
                  style={{
                    borderColor: isActive ? `${config?.color}40` : undefined,
                  }}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? config?.color : '#636E72' }}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <span className={`text-sm font-medium block truncate ${isActive ? 'text-[#2D3436]' : 'text-[#636E72]'}`}>
                      {config?.label || cat.label}
                    </span>
                    <span className={`text-xs ${isActive ? 'text-[#636E72]' : 'text-[#B2BEC3]'}`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DrawerSection>

        {/* Filters in vertical layout */}
        <DrawerSection title="Filters">
          <ETFFilterPanel
            category={category}
            filters={filters}
            onSetFilter={setFilter}
            providers={providers}
            selectedProviders={filters.providers}
            onToggleProvider={toggleProvider}
            layout="vertical"
          />
        </DrawerSection>

        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <DrawerSection title={`Actieve filters (${activeFilterCount})`}>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={`${chip.filterId}-${chip.value}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#FEFEFE] text-[#636E72] border border-[#E8E8E6]"
                >
                  <span className="text-[#B2BEC3]">{chip.filterLabel}:</span>
                  <span>{chip.label || chip.valueLabel}</span>
                  <button
                    onClick={() => removeFilter(chip.filterId, chip.value)}
                    className="p-1 hover:bg-[#F5F6F4] rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </DrawerSection>
        )}
      </MobileDrawer>
    </div>
  );
}
