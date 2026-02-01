/**
 * ModelPortfoliosPage Component
 *
 * Main page for all model portfolios with tabs for:
 * - Risk-based portfolios
 * - Theme-based portfolios
 * - Strategy-based portfolios
 * - Community portfolios
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  BarChart3,
  Users,
  Search,
  LayoutGrid,
} from 'lucide-react';
import { TradingProvider, useTrading } from '../../context/TradingContext';
import { useBulkBuy } from '../../hooks/useBulkBuy';
import { calculateMinimumInvestment, formatCurrency } from '../../utils/portfolioUtils';
import {
  MODEL_PORTFOLIOS,
  PORTFOLIO_CATEGORIES,
  getPortfoliosByCategory,
  getAllModelPortfolios,
  filterPortfolios,
} from '../../data/modelPortfolioDefinitions';
import ModelPortfolioDetail from './ModelPortfolioDetail';
import BulkBuyModal from './BulkBuyModal';
import CommunityPortfolios from './CommunityPortfolios';
import CreatePortfolio from './CreatePortfolio';

// Tab configurations
const TABS = [
  { id: 'all', label: 'Alles', icon: LayoutGrid, category: null, color: 'green' },
  { id: 'risk', label: 'Risico', icon: Shield, category: PORTFOLIO_CATEGORIES.RISK, color: 'blue' },
  { id: 'theme', label: 'Thema', icon: Sparkles, category: PORTFOLIO_CATEGORIES.THEME, color: 'purple' },
  { id: 'strategy', label: 'Strategie', icon: BarChart3, category: PORTFOLIO_CATEGORIES.STRATEGY, color: 'teal' },
  { id: 'community', label: 'Community', icon: Users, category: PORTFOLIO_CATEGORIES.COMMUNITY, color: 'pink' },
];

// Inner component that uses TradingContext
function ModelPortfoliosPageInner({ user, onBack, onNavigateToTrading }) {
  const { connected, marketData, accountSummary, isDataStale } = useTrading();
  const {
    calculation,
    calculationSummary,
    isCalculating,
    error: bulkBuyError,
    hasMarketData,
    availableCash,
    prepareBulkBuy,
    addToBasket,
    clearCalculation,
  } = useBulkBuy();

  // State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [buyPortfolioId, setBuyPortfolioId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const budgetAmount = useMemo(() => {
    const val = parseFloat(budgetInput.replace(/[^0-9.,]/g, '').replace(',', '.'));
    return isNaN(val) || val <= 0 ? null : val;
  }, [budgetInput]);

  // Get portfolios for active tab
  const filteredPortfolios = useMemo(() => {
    if (activeTab === 'community') return [];

    let portfolios;
    if (activeTab === 'all') {
      portfolios = getAllModelPortfolios();
    } else {
      const activeTabConfig = TABS.find(t => t.id === activeTab);
      if (!activeTabConfig) return [];
      portfolios = getPortfoliosByCategory(activeTabConfig.category);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      portfolios = portfolios.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some(t => t.includes(q))
      );
    }

    return portfolios;
  }, [activeTab, searchQuery]);

  // Pre-compute minimum investments for all filtered portfolios
  const portfolioMinInvestments = useMemo(() => {
    const map = {};
    filteredPortfolios.forEach(p => {
      map[p.id] = calculateMinimumInvestment(p.id, marketData || {});
    });
    return map;
  }, [filteredPortfolios, marketData]);

  // Count affordable portfolios
  const affordableCount = useMemo(() => {
    if (!budgetAmount) return filteredPortfolios.length;
    return filteredPortfolios.filter(p => {
      const min = portfolioMinInvestments[p.id]?.minimum || 0;
      return min === 0 || budgetAmount >= min;
    }).length;
  }, [filteredPortfolios, portfolioMinInvestments, budgetAmount]);

  // Selected portfolio for detail view
  const selectedPortfolio = useMemo(() => {
    if (!selectedPortfolioId) return null;
    return MODEL_PORTFOLIOS[selectedPortfolioId] || null;
  }, [selectedPortfolioId]);

  // Handlers
  const handleSelectPortfolio = useCallback((portfolioId) => {
    setSelectedPortfolioId(portfolioId);
  }, []);

  const handleBuyNow = useCallback((portfolioId) => {
    setBuyPortfolioId(portfolioId);
  }, []);

  const handleBuyModalClose = useCallback(() => {
    setBuyPortfolioId(null);
    clearCalculation();
  }, [clearCalculation]);

  const handleAddToBasket = useCallback(() => {
    const success = addToBasket();
    if (success) {
      setBuyPortfolioId(null);
      // Navigate to trading dashboard to see basket
      if (onNavigateToTrading) {
        setTimeout(() => onNavigateToTrading(), 500);
      }
    }
    return success;
  }, [addToBasket, onNavigateToTrading]);

  const handleCreatePortfolio = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleSavePortfolio = useCallback(async (portfolioData) => {
    // In production, this would call the API
    console.log('Saving portfolio:', portfolioData);
    // Simulated save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowCreateModal(false);
  }, []);

  // Risk level labels
  const riskLabels = { 1: 'Zeer laag', 2: 'Laag', 3: 'Gemiddeld', 4: 'Hoog', 5: 'Zeer hoog' };
  const riskColors = {
    1: 'text-[#6B7B8A]',
    2: 'text-[#7C9885]',
    3: 'text-[#C9A962]',
    4: 'text-[#B8956B]',
    5: 'text-[#C0736D]',
  };

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#FEFEFE]/95 backdrop-blur-sm border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Title row */}
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
                    Kies een portefeuille om de details te bekijken
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap text-sm ${
                      isActive
                        ? 'bg-[#7C9885] text-white border-[#7C9885]'
                        : 'border-[#E8E8E6] text-[#636E72] hover:bg-[#F5F6F4]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'community' && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#C0736D]/15 text-[#C0736D] rounded">
                        Nieuw
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'community' ? (
          <CommunityPortfolios
            currentUserId={user?.id}
            onSelectPortfolio={handleSelectPortfolio}
            onBuyPortfolio={handleBuyNow}
            onCreatePortfolio={handleCreatePortfolio}
          />
        ) : (
          <>
            {/* Budget input - prominent */}
            <div className="bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] p-4 mb-6">
              <label className="block text-sm font-medium text-[#2D3436] mb-2">
                Hoeveel wil je beleggen?
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636E72] font-medium text-sm">€</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="Vul een bedrag in..."
                    className="w-full pl-8 pr-4 py-2.5 bg-[#F5F6F4] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885] focus:bg-white text-base font-medium"
                  />
                </div>
                {budgetAmount ? (
                  <span className="text-sm text-[#7C9885] font-medium whitespace-nowrap">
                    {affordableCount} van {filteredPortfolios.length} portfolios beschikbaar
                  </span>
                ) : (
                  <span className="text-sm text-[#B2BEC3] whitespace-nowrap hidden sm:inline">
                    Vul in om te filteren
                  </span>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op naam, beschrijving of thema..."
                  className="w-full pl-10 pr-4 py-2 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885] text-sm"
                />
              </div>
            </div>

            {/* Portfolio grid - compact cards */}
            {filteredPortfolios.length === 0 ? (
              <div className="text-center py-12 bg-[#FEFEFE] rounded-xl border border-[#E8E8E6]">
                <Search className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
                <h3 className="text-base font-medium text-[#2D3436] mb-1">Geen portefeuilles gevonden</h3>
                <p className="text-sm text-[#636E72]">Pas je zoekopdracht aan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPortfolios.map(portfolio => {
                  const minInvestment = portfolioMinInvestments[portfolio.id] || { minimum: 0 };
                  const isAffordable = !budgetAmount || minInvestment.minimum === 0 || budgetAmount >= minInvestment.minimum;
                  const categoryLabel = portfolio.category === 'Risk' ? 'Risico' :
                    portfolio.category === 'Theme' ? 'Thema' :
                    portfolio.category === 'Strategy' ? 'Strategie' : portfolio.category;
                  return (
                    <button
                      key={portfolio.id}
                      onClick={() => handleSelectPortfolio(portfolio.id)}
                      className={`bg-[#FEFEFE] rounded-xl p-4 text-left border transition-all group ${
                        isAffordable
                          ? 'border-[#E8E8E6] hover:border-[#7C9885] hover:shadow-[0_4px_12px_rgba(45,52,54,0.08)]'
                          : 'border-[#E8E8E6] opacity-40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-[#2D3436] group-hover:text-[#7C9885] transition-colors text-sm leading-tight">
                          {portfolio.name}
                        </h4>
                        <span className="text-lg font-bold text-[#7C9885] ml-2 flex-shrink-0">
                          {(portfolio.expectedReturn * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-[#636E72] leading-relaxed mb-2 line-clamp-2">
                        {portfolio.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {activeTab === 'all' && (
                            <span className="text-xs px-1.5 py-0.5 bg-[#ECEEED] text-[#636E72] rounded">
                              {categoryLabel}
                            </span>
                          )}
                          <span className={`text-xs ${riskColors[portfolio.riskLevel] || 'text-[#636E72]'}`}>
                            {riskLabels[portfolio.riskLevel] || 'Onbekend'} risico
                          </span>
                        </div>
                        {minInvestment.minimum > 0 && (
                          <span className="text-xs text-[#636E72]">
                            min. {formatCurrency(minInvestment.minimum)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedPortfolio && (
        <ModelPortfolioDetail
          portfolio={selectedPortfolio}
          onClose={() => setSelectedPortfolioId(null)}
          onBuyNow={handleBuyNow}
          isOffline={!connected || isDataStale}
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
          canExecute={connected && !isDataStale}
          hasMarketData={hasMarketData}
          onCalculate={prepareBulkBuy}
          onAddToBasket={handleAddToBasket}
        />
      )}

      {/* Create portfolio modal */}
      <CreatePortfolio
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSavePortfolio}
      />
    </div>
  );
}

// Main wrapper that provides TradingContext
export default function ModelPortfoliosPage({ user, onBack, onNavigateToTrading }) {
  return (
    <TradingProvider user={user}>
      <ModelPortfoliosPageInner
        user={user}
        onBack={onBack}
        onNavigateToTrading={onNavigateToTrading}
      />
    </TradingProvider>
  );
}
