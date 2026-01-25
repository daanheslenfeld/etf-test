/**
 * ModelPortfolios Component
 *
 * Main page for browsing and selecting model portfolios.
 * Features filters by category, risk level, theme, and region.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Shield,
  Sparkles,
  BarChart3,
  Users,
  TrendingUp,
  ChevronDown,
  LayoutGrid,
  List,
  RefreshCw,
  WifiOff,
  Wifi,
  ArrowLeft,
} from 'lucide-react';
import {
  MODEL_PORTFOLIOS,
  PORTFOLIO_CATEGORIES,
  getAllModelPortfolios,
  filterPortfolios,
  getAllTags,
  getAllRegions,
} from '../../data/modelPortfolioDefinitions';
import ModelPortfolioCard from './ModelPortfolioCard';
import ModelPortfolioDetail from './ModelPortfolioDetail';
import BulkBuyModal from './BulkBuyModal';
import { useBulkBuy } from '../../hooks/useBulkBuy';

// Category configurations - Premium banking palette
const categoryConfig = {
  [PORTFOLIO_CATEGORIES.RISK]: {
    icon: Shield,
    color: 'bg-[#6B7B8A]/10 text-[#6B7B8A] border-[#6B7B8A]/30',
    label: 'Risico',
    description: 'Portefeuilles gebaseerd op risicoprofiel',
  },
  [PORTFOLIO_CATEGORIES.THEME]: {
    icon: Sparkles,
    color: 'bg-[#8B7B9A]/10 text-[#8B7B9A] border-[#8B7B9A]/30',
    label: 'Thema',
    description: 'Thematische portefeuilles',
  },
  [PORTFOLIO_CATEGORIES.STRATEGY]: {
    icon: BarChart3,
    color: 'bg-[#7C9885]/10 text-[#7C9885] border-[#7C9885]/30',
    label: 'Strategie',
    description: 'Strategie-gebaseerde portefeuilles',
  },
  [PORTFOLIO_CATEGORIES.COMMUNITY]: {
    icon: Users,
    color: 'bg-[#C0736D]/10 text-[#C0736D] border-[#C0736D]/30',
    label: 'Community',
    description: 'Door gebruikers gemaakt',
  },
};

// Risk level labels
const riskLevelLabels = {
  1: 'Zeer laag',
  2: 'Laag',
  3: 'Gemiddeld',
  4: 'Hoog',
  5: 'Zeer hoog',
};

export default function ModelPortfolios({
  onBack,
  onAddToBasket,
  isConnected = false,
  marketData = {},
  availableCash = 0,
}) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [buyPortfolioId, setBuyPortfolioId] = useState(null);

  // Bulk buy hook
  const {
    calculation,
    calculationSummary,
    isCalculating,
    error: bulkBuyError,
    hasMarketData,
    prepareBulkBuy,
    addToBasket,
    clearCalculation,
  } = useBulkBuy();

  // Get all available tags and regions
  const allTags = useMemo(() => getAllTags(), []);
  const allRegions = useMemo(() => getAllRegions(), []);

  // Filter portfolios based on current filters
  const filteredPortfolios = useMemo(() => {
    return filterPortfolios({
      category: selectedCategory,
      riskLevel: selectedRiskLevel,
      tags: selectedTags,
      region: selectedRegion,
      searchQuery,
    });
  }, [selectedCategory, selectedRiskLevel, selectedTags, selectedRegion, searchQuery]);

  // Group portfolios by category for display
  const groupedPortfolios = useMemo(() => {
    if (selectedCategory) {
      return { [selectedCategory]: filteredPortfolios };
    }

    const groups = {};
    filteredPortfolios.forEach(portfolio => {
      const cat = portfolio.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(portfolio);
    });
    return groups;
  }, [filteredPortfolios, selectedCategory]);

  // Selected portfolio for detail view
  const selectedPortfolio = useMemo(() => {
    if (!selectedPortfolioId) return null;
    return MODEL_PORTFOLIOS[selectedPortfolioId] || null;
  }, [selectedPortfolioId]);

  // Handle portfolio selection
  const handleSelectPortfolio = useCallback((portfolioId) => {
    setSelectedPortfolioId(portfolioId);
  }, []);

  // Handle buy now click
  const handleBuyNow = useCallback((portfolioId) => {
    setBuyPortfolioId(portfolioId);
  }, []);

  // Handle buy modal close
  const handleBuyModalClose = useCallback(() => {
    setBuyPortfolioId(null);
    clearCalculation();
  }, [clearCalculation]);

  // Handle add to basket from buy modal
  const handleAddToBasket = useCallback(() => {
    const success = addToBasket();
    if (success) {
      setBuyPortfolioId(null);
      if (onAddToBasket) {
        onAddToBasket();
      }
    }
    return success;
  }, [addToBasket, onAddToBasket]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedRiskLevel(null);
    setSelectedRegion(null);
    setSelectedTags([]);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedCategory || selectedRiskLevel || selectedRegion || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-[#F5F6F4] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-[#636E72]" />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-[#2D3436]">Model Portfolios</h1>
                  <p className="text-sm text-[#636E72]">
                    {filteredPortfolios.length} portefeuilles beschikbaar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Connection status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  isConnected ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C9A962]/10 text-[#C9A962]'
                }`}>
                  {isConnected ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {isConnected ? 'Live prijzen' : 'Gecachete prijzen'}
                  </span>
                </div>
                {/* View toggle */}
                <div className="flex items-center bg-[#F5F6F4] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-[#7C9885] text-white' : 'text-[#636E72] hover:text-[#2D3436]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-[#7C9885] text-white' : 'text-[#636E72] hover:text-[#2D3436]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search and filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B2BEC3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek portefeuilles..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-[#B2BEC3] hover:text-[#2D3436]" />
                  </button>
                )}
              </div>

              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-[#7C9885] text-white border-[#7C9885]'
                    : 'bg-[#FEFEFE] text-[#636E72] border-[#E8E8E6] hover:border-[#B2BEC3]'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && !showFilters && (
                  <span className="bg-white text-[#7C9885] text-xs px-1.5 py-0.5 rounded">
                    {[selectedCategory, selectedRiskLevel, selectedRegion, ...selectedTags].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-[#FEFEFE] rounded-lg border border-[#E8E8E6]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category filter */}
                  <div>
                    <label className="block text-sm font-medium text-[#636E72] mb-2">Categorie</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryConfig).map(([cat, config]) => {
                        const Icon = config.icon;
                        const isSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(isSelected ? null : cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              isSelected
                                ? config.color + ' border'
                                : 'bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risk level filter */}
                  <div>
                    <label className="block text-sm font-medium text-[#636E72] mb-2">Risico niveau</label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          onClick={() => setSelectedRiskLevel(selectedRiskLevel === level ? null : level)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedRiskLevel === level
                              ? 'bg-[#7C9885] text-white'
                              : 'bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Region filter */}
                  <div>
                    <label className="block text-sm font-medium text-[#636E72] mb-2">Regio</label>
                    <select
                      value={selectedRegion || ''}
                      onChange={(e) => setSelectedRegion(e.target.value || null)}
                      className="w-full px-3 py-2 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg text-[#2D3436] focus:outline-none focus:border-[#7C9885]"
                    >
                      <option value="">Alle regio's</option>
                      {allRegions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags filter */}
                  <div>
                    <label className="block text-sm font-medium text-[#636E72] mb-2">Tags</label>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {allTags.slice(0, 10).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-[#7C9885] text-white'
                              : 'bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t border-[#E8E8E6]">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#7C9885] hover:underline flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Wis alle filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredPortfolios.length === 0 ? (
          // No results
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#F5F6F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#B2BEC3]" />
            </div>
            <h3 className="text-lg font-medium text-[#2D3436] mb-2">Geen portefeuilles gevonden</h3>
            <p className="text-[#636E72] mb-4">Probeer andere filters of zoektermen</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[#7C9885] text-white rounded-lg font-medium hover:bg-[#6B8A74] transition-colors"
            >
              Wis filters
            </button>
          </div>
        ) : (
          // Portfolio groups
          <div className="space-y-8">
            {Object.entries(groupedPortfolios).map(([category, portfolios]) => {
              const config = categoryConfig[category];
              const Icon = config?.icon || Shield;

              return (
                <div key={category}>
                  {/* Category header */}
                  {!selectedCategory && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${config?.color || 'bg-[#F5F6F4] text-[#636E72]'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#2D3436]">{config?.label || category}</h2>
                        <p className="text-sm text-[#636E72]">{config?.description}</p>
                      </div>
                      <span className="ml-auto text-sm text-[#B2BEC3]">{portfolios.length} portefeuilles</span>
                    </div>
                  )}

                  {/* Portfolio grid/list */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {portfolios.map(portfolio => (
                        <ModelPortfolioCard
                          key={portfolio.id}
                          portfolio={portfolio}
                          onSelect={handleSelectPortfolio}
                          onBuyNow={handleBuyNow}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {portfolios.map(portfolio => (
                        <ModelPortfolioCard
                          key={portfolio.id}
                          portfolio={portfolio}
                          onSelect={handleSelectPortfolio}
                          onBuyNow={handleBuyNow}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedPortfolio && (
        <ModelPortfolioDetail
          portfolio={selectedPortfolio}
          onClose={() => setSelectedPortfolioId(null)}
          onBuyNow={handleBuyNow}
          isOffline={!isConnected}
          cachedPrices={marketData}
        />
      )}

      {/* Buy modal */}
      {buyPortfolioId && (
        <BulkBuyModal
          isOpen={true}
          onClose={handleBuyModalClose}
          portfolio={{ key: buyPortfolioId, ...MODEL_PORTFOLIOS[buyPortfolioId] }}
          calculation={calculation}
          calculationSummary={calculationSummary}
          isCalculating={isCalculating}
          error={bulkBuyError}
          availableCash={availableCash}
          canExecute={isConnected}
          hasMarketData={hasMarketData}
          onCalculate={prepareBulkBuy}
          onAddToBasket={handleAddToBasket}
        />
      )}
    </div>
  );
}
