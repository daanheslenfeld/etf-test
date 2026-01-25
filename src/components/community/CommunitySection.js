/**
 * CommunitySection Component
 *
 * Main container for Community features with three tabs:
 * - Top Portfolios (Leaderboard)
 * - Trending (Most Followed)
 * - My Follows (User's followed portfolios)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  TrendingUp,
  Users,
  Heart,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CommunityProvider, useCommunity } from '../../context/CommunityContext';
import Leaderboard from './Leaderboard';
import TrendingPortfolios from './TrendingPortfolios';
import FollowedPortfolios from './FollowedPortfolios';

// Tab configuration - Premium banking colors
const TABS = [
  { id: 'top', label: 'Top Portfolios', icon: Trophy, color: 'gold' },
  { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'purple' },
  { id: 'following', label: 'Mijn Volgers', icon: Heart, color: 'coral' },
];

function CommunitySectionInner({
  currentUserId,
  onSelectPortfolio,
  onBuyPortfolio,
  onCreatePortfolio,
}) {
  const [activeTab, setActiveTab] = useState('top');
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
    if (activeTab === 'top') {
      loadLeaderboard('year');
    } else if (activeTab === 'trending') {
      loadTrending(7);
    } else if (activeTab === 'following' && currentUserId) {
      loadFollowedPortfolios();
    }
  }, [activeTab, currentUserId, loadLeaderboard, loadTrending, loadFollowedPortfolios]);

  const handleRefresh = useCallback(() => {
    clearError();
    if (activeTab === 'top') {
      loadLeaderboard('year');
    } else if (activeTab === 'trending') {
      loadTrending(7);
    } else if (activeTab === 'following') {
      loadFollowedPortfolios();
    }
  }, [activeTab, loadLeaderboard, loadTrending, loadFollowedPortfolios, clearError]);

  const isLoading = loading.leaderboard || loading.trending || loading.follows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3436] flex items-center gap-3">
            <Users className="w-7 h-7 text-[#8B7B9A]" />
            Community
          </h2>
          <p className="text-[#636E72] mt-1">
            Ontdek, volg en leer van de beste beleggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#ECEEED] text-[#636E72] hover:text-[#2D3436] hover:bg-[#E8E8E6] transition-colors disabled:opacity-50"
            title="Vernieuwen"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {onCreatePortfolio && (
            <button
              onClick={onCreatePortfolio}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7C9885] text-white rounded-lg font-bold hover:bg-[#6B8A74] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Portfolio maken
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-[#C0736D]/10 border border-[#C0736D]/20 rounded-lg">
          <p className="text-[#C0736D]">{error}</p>
          <button
            onClick={clearError}
            className="text-[#C0736D]/80 text-sm underline mt-1"
          >
            Sluiten
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E8E6] pb-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Color classes - Premium banking palette
          const colorMap = {
            gold: isActive
              ? 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]'
              : 'hover:bg-[#C9A962]/5 border-transparent',
            purple: isActive
              ? 'bg-[#8B7B9A]/10 text-[#8B7B9A] border-[#8B7B9A]'
              : 'hover:bg-[#8B7B9A]/5 border-transparent',
            coral: isActive
              ? 'bg-[#C0736D]/10 text-[#C0736D] border-[#C0736D]'
              : 'hover:bg-[#C0736D]/5 border-transparent',
          };

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors
                ${colorMap[tab.color]}
                ${!isActive ? 'text-[#636E72]' : ''}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'following' && followedPortfolios.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#ECEEED] text-[#636E72] rounded">
                  {followedPortfolios.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'top' && (
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
      </div>
    </div>
  );
}

// Wrapper with CommunityProvider
export default function CommunitySection(props) {
  return (
    <CommunityProvider user={{ id: props.currentUserId }}>
      <CommunitySectionInner {...props} />
    </CommunityProvider>
  );
}
