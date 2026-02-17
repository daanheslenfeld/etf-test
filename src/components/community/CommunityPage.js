/**
 * CommunityPage Component
 *
 * Dedicated page for Community features with four tabs:
 * - Discover (Top Portfolios by performance)
 * - Leaderboard (Rankings)
 * - Following (User's followed portfolios)
 * - My Portfolios (User's own public portfolios)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  TrendingUp,
  Users,
  Heart,
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  ArrowLeft,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Crown,
  Medal,
  Award,
  ShoppingCart,
} from 'lucide-react';
import { CommunityProvider, useCommunity } from '../../context/CommunityContext';
import { TradingProvider } from '../../context/TradingContext';
import Leaderboard from './Leaderboard';
import TrendingPortfolios from './TrendingPortfolios';
import FollowedPortfolios from './FollowedPortfolios';
import CopyPortfolioModal from './CopyPortfolioModal';
import CompetitionBanner from './CompetitionBanner';

// API base URL
const API_BASE = process.env.REACT_APP_TRADING_API_URL || 'http://37.97.173.109:8002';

// Tab configuration - Premium banking colors (sage green palette)
const TABS = [
  { id: 'discover', label: 'Ontdekken', icon: Trophy, color: 'gold' },
  { id: 'leaderboard', label: 'Ranglijst', icon: TrendingUp, color: 'sage' },
  { id: 'following', label: 'Mijn Volgers', icon: Heart, color: 'coral' },
  { id: 'myPortfolios', label: 'Mijn Portfolios', icon: Briefcase, color: 'blue' },
];

// My Portfolio Card component
function MyPortfolioCard({ portfolio, onToggleVisibility, onSelect }) {
  const isPublic = portfolio.visibility === 'public';
  const performance = portfolio.performance?.year || 0;
  const isPositive = performance >= 0;

  return (
    <div className="bg-[#FEFEFE] rounded-2xl border border-[#E8E8E6] hover:border-[#7C9885]/40 transition-all p-5 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7C9885]/10 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#7C9885]" />
          </div>
          <div>
            <h4 className="font-semibold text-[#2D3436]">{portfolio.name}</h4>
            <div className={`flex items-center gap-1 text-xs mt-1 ${
              isPublic ? 'text-[#7C9885]' : 'text-[#636E72]'
            }`}>
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? 'Publiek' : 'Prive'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
            {isPositive ? '+' : ''}{(performance * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-[#B2BEC3]">jaarlijks</div>
        </div>
      </div>

      {portfolio.description && (
        <p className="text-sm text-[#636E72] mb-4 line-clamp-2">{portfolio.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-[#636E72] mb-4">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {portfolio.follower_count || 0} volgers
        </div>
        <div className="flex items-center gap-1">
          <Briefcase className="w-4 h-4" />
          {portfolio.positions?.length || 0} posities
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelect(portfolio)}
          className="flex-1 px-4 py-2 bg-[#F5F6F4] text-[#2D3436] rounded-lg font-medium hover:bg-[#ECEEED] transition-colors"
        >
          Bekijken
        </button>
        <button
          onClick={() => onToggleVisibility(portfolio.id, isPublic ? 'private' : 'public')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isPublic
              ? 'bg-[#C0736D]/10 text-[#C0736D] hover:bg-[#C0736D]/20'
              : 'bg-[#7C9885]/10 text-[#7C9885] hover:bg-[#7C9885]/20'
          }`}
        >
          {isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isPublic ? 'Verberg' : 'Publiceer'}
        </button>
      </div>
    </div>
  );
}

// My Portfolios Tab Content
function MyPortfoliosContent({ onSelectPortfolio, currentUserId }) {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMyPortfolios = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/portfolios/user/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to load portfolios');
      const data = await response.json();
      setPortfolios(data.portfolios || []);
    } catch (err) {
      console.error('Error loading portfolios:', err);
      setError('Kon portfolios niet laden');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadMyPortfolios();
  }, [loadMyPortfolios]);

  const handleToggleVisibility = async (portfolioId, newVisibility) => {
    try {
      const response = await fetch(`${API_BASE}/community/portfolio/${portfolioId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          visibility: newVisibility,
        }),
      });

      if (!response.ok) throw new Error('Failed to update visibility');

      // Refresh portfolios
      loadMyPortfolios();
    } catch (err) {
      console.error('Error updating visibility:', err);
      setError('Kon zichtbaarheid niet wijzigen');
    }
  };

  if (!currentUserId) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#F5F6F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-[#636E72]" />
        </div>
        <h3 className="text-lg font-semibold text-[#2D3436] mb-2">Log in om je portfolios te zien</h3>
        <p className="text-[#636E72]">Je moet ingelogd zijn om je eigen portfolios te beheren.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#7C9885] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#C0736D] mb-2">{error}</p>
        <button
          onClick={loadMyPortfolios}
          className="text-[#7C9885] hover:underline"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#7C9885]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-[#7C9885]" />
        </div>
        <h3 className="text-lg font-semibold text-[#2D3436] mb-2">Geen portfolios gevonden</h3>
        <p className="text-[#636E72] mb-4">
          Maak je eerste portfolio aan om te delen met de community.
        </p>
        <button className="px-6 py-2.5 bg-[#7C9885] text-white rounded-lg font-medium hover:bg-[#6B8A74] transition-colors">
          <Plus className="w-4 h-4 inline mr-2" />
          Portfolio maken
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {portfolios.map(portfolio => (
        <MyPortfolioCard
          key={portfolio.id}
          portfolio={portfolio}
          onSelect={onSelectPortfolio}
          onToggleVisibility={handleToggleVisibility}
        />
      ))}
    </div>
  );
}

function CommunityPageInner({
  currentUserId,
  onSelectPortfolio,
  onBuyPortfolio,
  onCreatePortfolio,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState('discover');
  const {
    loadFollowedPortfolios,
    loadLeaderboard,
    loadTrending,
    loading,
    error,
    clearError,
    followedPortfolios,
  } = useCommunity();

  // Load data on mount and tab change
  useEffect(() => {
    if (activeTab === 'discover' || activeTab === 'leaderboard') {
      loadLeaderboard('year');
    } else if (activeTab === 'trending') {
      loadTrending(7);
    } else if (activeTab === 'following' && currentUserId) {
      loadFollowedPortfolios();
    }
  }, [activeTab, currentUserId, loadLeaderboard, loadTrending, loadFollowedPortfolios]);

  const handleRefresh = useCallback(() => {
    clearError();
    if (activeTab === 'discover' || activeTab === 'leaderboard') {
      loadLeaderboard('year');
    } else if (activeTab === 'trending') {
      loadTrending(7);
    } else if (activeTab === 'following') {
      loadFollowedPortfolios();
    }
  }, [activeTab, loadLeaderboard, loadTrending, loadFollowedPortfolios, clearError]);

  const isLoading = loading.leaderboard || loading.trending || loading.follows;

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Header */}
      <div className="bg-[#FEFEFE] border-b border-[#E8E8E6] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-[#F5F6F4] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#636E72]" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#2D3436] flex items-center gap-3">
                  <Users className="w-7 h-7 text-[#7C9885]" />
                  Community
                </h1>
                <p className="text-[#636E72] mt-1">
                  Ontdek, volg en leer van de beste beleggers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436] hover:bg-[#ECEEED] transition-colors disabled:opacity-50"
                title="Vernieuwen"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {onCreatePortfolio && (
                <button
                  onClick={onCreatePortfolio}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#7C9885] text-white rounded-xl font-semibold hover:bg-[#6B8A74] transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Portfolio maken
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // Color classes - Premium sage green palette
              const colorMap = {
                gold: isActive
                  ? 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]'
                  : 'hover:bg-[#C9A962]/5 border-transparent text-[#636E72]',
                sage: isActive
                  ? 'bg-[#7C9885]/10 text-[#7C9885] border-[#7C9885]'
                  : 'hover:bg-[#7C9885]/5 border-transparent text-[#636E72]',
                coral: isActive
                  ? 'bg-[#C0736D]/10 text-[#C0736D] border-[#C0736D]'
                  : 'hover:bg-[#C0736D]/5 border-transparent text-[#636E72]',
                blue: isActive
                  ? 'bg-[#6B7B8A]/10 text-[#6B7B8A] border-[#6B7B8A]'
                  : 'hover:bg-[#6B7B8A]/5 border-transparent text-[#636E72]',
              };

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap
                    ${colorMap[tab.color]}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.id === 'following' && followedPortfolios.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-[#ECEEED] text-[#636E72] rounded-full">
                      {followedPortfolios.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Active Competition Banner */}
        <div className="mb-6">
          <CompetitionBanner onViewStandings={(comp) => setActiveTab('leaderboard')} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-[#C0736D]/10 border border-[#C0736D]/20 rounded-xl">
            <p className="text-[#C0736D]">{error}</p>
            <button
              onClick={clearError}
              className="text-[#C0736D]/80 text-sm underline mt-1"
            >
              Sluiten
            </button>
          </div>
        )}

        {/* Tab content */}
        <div className="min-h-[500px]">
          {(activeTab === 'discover' || activeTab === 'leaderboard') && (
            <Leaderboard
              onSelectPortfolio={onSelectPortfolio}
              onBuyPortfolio={onBuyPortfolio}
            />
          )}

          {activeTab === 'trending' && (
            <TrendingPortfolios
              onSelectPortfolio={onSelectPortfolio}
              onBuyPortfolio={onBuyPortfolio}
            />
          )}

          {activeTab === 'following' && (
            <FollowedPortfolios
              onSelectPortfolio={onSelectPortfolio}
              onBuyPortfolio={onBuyPortfolio}
            />
          )}

          {activeTab === 'myPortfolios' && (
            <MyPortfoliosContent
              currentUserId={currentUserId}
              onSelectPortfolio={onSelectPortfolio}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper with CommunityProvider and TradingProvider
export default function CommunityPage(props) {
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  const handleBuyPortfolio = async (portfolioOrId) => {
    // If it's already a portfolio object with holdings, use it directly
    if (portfolioOrId && typeof portfolioOrId === 'object' && portfolioOrId.holdings) {
      setSelectedPortfolio({
        ...portfolioOrId,
        positions: portfolioOrId.holdings.map(h => ({
          isin: h.isin,
          name: h.name,
          symbol: h.symbol,
          weight: h.weight,
          category: h.category,
        }))
      });
      setCopyModalOpen(true);
      return;
    }

    // Otherwise, fetch the portfolio by ID
    const portfolioId = typeof portfolioOrId === 'string' ? portfolioOrId : portfolioOrId?.id;
    if (!portfolioId) return;

    setLoadingPortfolio(true);
    try {
      const response = await fetch(`${API_BASE}/portfolios/${portfolioId}`);
      if (!response.ok) {
        console.error('Failed to fetch portfolio');
        return;
      }
      const portfolio = await response.json();

      // Transform holdings to positions format expected by CopyPortfolioModal
      setSelectedPortfolio({
        ...portfolio,
        positions: portfolio.holdings?.map(h => ({
          isin: h.isin,
          name: h.name,
          symbol: h.symbol,
          weight: h.weight,
          category: h.category,
        })) || []
      });
      setCopyModalOpen(true);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleCloseCopyModal = () => {
    setCopyModalOpen(false);
    setSelectedPortfolio(null);
  };

  return (
    <TradingProvider user={props.user}>
      <CommunityProvider user={{ id: props.currentUserId || props.user?.id }}>
        <CommunityPageInner
          {...props}
          onBuyPortfolio={handleBuyPortfolio}
        />
        <CopyPortfolioModal
          isOpen={copyModalOpen}
          onClose={handleCloseCopyModal}
          portfolio={selectedPortfolio}
        />
        {/* Loading overlay when fetching portfolio */}
        {loadingPortfolio && (
          <div className="fixed inset-0 z-40 bg-[#2D3436]/30 flex items-center justify-center">
            <div className="bg-[#FEFEFE] rounded-xl p-6 flex items-center gap-3 shadow-lg">
              <Loader2 className="w-5 h-5 text-[#7C9885] animate-spin" />
              <span className="text-[#2D3436]">Portfolio laden...</span>
            </div>
          </div>
        )}
      </CommunityProvider>
    </TradingProvider>
  );
}
