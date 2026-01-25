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
  Wifi,
  WifiOff,
  ShoppingCart,
  Search,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Trophy,
} from 'lucide-react';
import { TradingProvider, useTrading } from '../../context/TradingContext';
import { useBulkBuy } from '../../hooks/useBulkBuy';
import {
  MODEL_PORTFOLIOS,
  PORTFOLIO_CATEGORIES,
  getPortfoliosByCategory,
  filterPortfolios,
} from '../../data/modelPortfolioDefinitions';
import ModelPortfolioCard from './ModelPortfolioCard';
import ModelPortfolioDetail from './ModelPortfolioDetail';
import BulkBuyModal from './BulkBuyModal';
import CommunityPortfolios from './CommunityPortfolios';
import CreatePortfolio from './CreatePortfolio';

// Tab configurations
const TABS = [
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
  const [activeTab, setActiveTab] = useState('risk');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [buyPortfolioId, setBuyPortfolioId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get portfolios for active tab
  const filteredPortfolios = useMemo(() => {
    const activeTabConfig = TABS.find(t => t.id === activeTab);
    if (!activeTabConfig || activeTab === 'community') return [];

    let portfolios = getPortfoliosByCategory(activeTabConfig.category);

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

  return (
    <div className="min-h-screen bg-[#0D0E12]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0D0E12]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">Model Portfolios</h1>
                  <p className="text-sm text-gray-400">
                    Kies uit kant-en-klare portefeuilles of maak je eigen
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Connection status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  connected && !isDataStale
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {connected && !isDataStale ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium hidden sm:inline">
                    {connected && !isDataStale ? 'Live prijzen' : 'Gecachete prijzen'}
                  </span>
                </div>

                {/* Available cash */}
                {availableCash > 0 && (
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-gray-400">Beschikbaar</div>
                    <div className="text-sm font-bold text-[#28EBCF]">
                      {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(availableCash)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const colorClasses = {
                  blue: isActive ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-blue-500/10',
                  purple: isActive ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'hover:bg-purple-500/10',
                  teal: isActive ? 'bg-teal-500/20 text-teal-400 border-teal-500' : 'hover:bg-teal-500/10',
                  pink: isActive ? 'bg-pink-500/20 text-pink-400 border-pink-500' : 'hover:bg-pink-500/10',
                };

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors whitespace-nowrap ${
                      isActive
                        ? colorClasses[tab.color]
                        : `border-transparent text-gray-400 ${colorClasses[tab.color]}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'community' && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-pink-500/20 text-pink-400 rounded">
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
          // Community portfolios tab
          <CommunityPortfolios
            currentUserId={user?.id}
            onSelectPortfolio={handleSelectPortfolio}
            onBuyPortfolio={handleBuyNow}
            onCreatePortfolio={handleCreatePortfolio}
          />
        ) : (
          // Model portfolios tabs (Risk, Theme, Strategy)
          <>
            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek portefeuilles..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1A1B1F] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-[#28EBCF] text-gray-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-[#28EBCF] text-gray-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Offline banner */}
            {(!connected || isDataStale) && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <WifiOff className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-400 font-medium">Prijzen kunnen vertraagd zijn</p>
                  <p className="text-yellow-300 text-sm">
                    Je bekijkt gecachete data. Verbind met de broker voor actuele koersen.
                  </p>
                </div>
              </div>
            )}

            {/* Portfolio grid/list */}
            {filteredPortfolios.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1B1F] rounded-2xl border border-gray-800">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Geen portefeuilles gevonden</h3>
                <p className="text-gray-400">Pas je zoekopdracht aan</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPortfolios.map(portfolio => (
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
                {filteredPortfolios.map(portfolio => (
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
