/**
 * CommunityPortfolios Component
 *
 * Community section with tabs for:
 * - Top portfolios (public portfolios sorted by followers)
 * - Trending (placeholder for future)
 * - My Follows (portfolios the user follows)
 * - My Portfolios (user's own portfolios with visibility controls)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Heart,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  ShoppingCart,
  Eye,
  EyeOff,
  Briefcase,
  Globe,
  Lock,
  Loader2,
  Crown,
  Medal,
  Award,
} from 'lucide-react';
import { CommunityProvider, useCommunity } from '../../context/CommunityContext';
import FollowButton from '../community/FollowButton';
import CommunityPortfolioDetail from './CommunityPortfolioDetail';

// API base URL
const API_BASE = process.env.REACT_APP_TRADING_API_URL || 'http://37.97.173.109:8002';

// Tab configuration
const COMMUNITY_TABS = [
  { id: 'top', label: 'Top portfolios', icon: Trophy, color: 'yellow' },
  { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'green' },
  { id: 'follows', label: 'My Follows', icon: Heart, color: 'pink' },
  { id: 'mine', label: 'My Portfolios', icon: Briefcase, color: 'blue' },
];

// Portfolio card for community portfolios
function CommunityPortfolioCard({ portfolio, onSelect, onBuy, showVisibility = false }) {
  const performance = portfolio.performance?.year || 0;
  const isPositive = performance >= 0;
  const creatorName = portfolio.creator_name || portfolio.creator || 'Unknown';
  const riskLevel = portfolio.risk_level || portfolio.riskLevel || 3;

  return (
    <div className="bg-[#1A1B1F] rounded-2xl border border-gray-800 hover:border-[#28EBCF] transition-colors overflow-hidden group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-[#28EBCF] transition-colors">
                {portfolio.name}
              </h4>
              <p className="text-sm text-gray-400">door {creatorName}</p>
            </div>
          </div>
          <div className="text-right">
            {showVisibility && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                portfolio.visibility === 'public'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {portfolio.visibility === 'public' ? (
                  <><Globe className="w-3 h-3" /> Publiek</>
                ) : (
                  <><Lock className="w-3 h-3" /> Privé</>
                )}
              </div>
            )}
            {!showVisibility && (
              <div className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                <div className="font-bold text-lg flex items-center gap-1">
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : null}
                  {isPositive ? '+' : ''}{(performance * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">jaarlijks</div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {portfolio.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{portfolio.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {portfolio.followers || 0} volgers
          </div>
          {portfolio.created_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(portfolio.created_at).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Risk level */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-400">Risico niveau</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-full ${
                  level <= riskLevel ? 'bg-[#28EBCF]' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 flex gap-2">
        <FollowButton
          portfolioId={portfolio.id}
          portfolio={portfolio}
          size="default"
          variant="outline"
        />
        <button
          onClick={() => onSelect(portfolio.id, portfolio)}
          className="flex-1 py-2.5 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Bekijk details
        </button>
        <button
          onClick={() => onBuy(portfolio.id)}
          className="flex-1 py-2.5 rounded-lg font-bold bg-[#28EBCF] text-gray-900 hover:bg-[#20d4ba] transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Kopen
        </button>
      </div>
    </div>
  );
}

// My Portfolio card with visibility toggle
function MyPortfolioCard({ portfolio, onSelect, onToggleVisibility, isUpdating }) {
  const riskLevel = portfolio.risk_level || portfolio.riskLevel || 3;
  const isPublic = portfolio.visibility === 'public';

  return (
    <div className="bg-[#1A1B1F] rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">{portfolio.name}</h4>
              {portfolio.published_at && (
                <p className="text-xs text-gray-500">
                  Gepubliceerd: {new Date(portfolio.published_at).toLocaleDateString('nl-NL')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400 text-sm">{portfolio.followers || 0}</span>
          </div>
        </div>

        {/* Description */}
        {portfolio.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{portfolio.description}</p>
        )}

        {/* Risk level */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-400">Risico niveau</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-full ${
                  level <= riskLevel ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <Globe className="w-4 h-4 text-green-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-300">
              {isPublic ? 'Publiek zichtbaar' : 'Privé (alleen jij)'}
            </span>
          </div>
          <button
            onClick={() => onToggleVisibility(portfolio.id, isPublic ? 'private' : 'public')}
            disabled={isUpdating}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isPublic ? 'bg-green-500' : 'bg-gray-600'
            } ${isUpdating ? 'opacity-50' : ''}`}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            ) : (
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => onSelect(portfolio.id, portfolio)}
          className="w-full py-2.5 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Bekijk & Bewerk
        </button>
      </div>
    </div>
  );
}

// Period options for leaderboard
const LEADERBOARD_PERIODS = [
  { id: '1M', label: '1 Maand' },
  { id: '3M', label: '3 Maanden' },
  { id: '1Y', label: '1 Jaar' },
  { id: 'ALL', label: 'Alles' },
];

// Rank badge icons
const getRankBadge = (rank) => {
  if (rank === 1) return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  if (rank === 2) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10' };
  if (rank === 3) return { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10' };
  return null;
};

// Top Portfolios tab - shows leaderboard
function TopPortfoliosContent({ onSelectPortfolio, onBuyPortfolio }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1M');

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/community/leaderboard?period=${period}&limit=20`);
      if (!response.ok) throw new Error('Failed to load leaderboard');
      const data = await response.json();
      setLeaderboard(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {LEADERBOARD_PERIODS.map(p => (
            <div key={p.id} className="h-9 w-20 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-[#1A1B1F] rounded-2xl border border-gray-800 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 border-b border-gray-800 animate-pulse bg-gray-800/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="text-[#28EBCF] hover:underline"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {LEADERBOARD_PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.id
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                  : 'bg-gray-800 text-gray-400 border border-transparent hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchLeaderboard}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Vernieuwen"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Geen data beschikbaar</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Er zijn nog geen performance snapshots. Leaderboards worden dagelijks bijgewerkt.
          </p>
        </div>
      ) : (
        <div className="bg-[#1A1B1F] rounded-2xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-800/50 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Portfolio</div>
            <div className="col-span-2 text-right">Rendement</div>
            <div className="col-span-2 text-right">Waarde</div>
            <div className="col-span-2 text-right">Volgers</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800">
            {leaderboard.map(entry => {
              const badge = getRankBadge(entry.rank);
              const isPositive = entry.return_pct >= 0;

              return (
                <div
                  key={entry.portfolio_id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-800/30 transition-colors group"
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    {badge ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${badge.bg}`}>
                        <badge.icon className={`w-4 h-4 ${badge.color}`} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 font-bold text-sm">{entry.rank}</span>
                      </div>
                    )}
                  </div>

                  {/* Portfolio info */}
                  <div className="col-span-5 min-w-0">
                    <button
                      onClick={() => onSelectPortfolio(entry.portfolio_id)}
                      className="text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white group-hover:text-[#28EBCF] transition-colors truncate">
                          {entry.portfolio_name}
                        </span>
                        {entry.rank <= 3 && (
                          <span className="text-xs">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        door {entry.creator_name}
                      </div>
                    </button>
                  </div>

                  {/* Return */}
                  <div className="col-span-2 text-right">
                    <div className={`font-bold flex items-center justify-end gap-1 ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {isPositive ? '+' : ''}{entry.return_pct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Value */}
                  <div className="col-span-2 text-right text-gray-300">
                    €{entry.total_value.toLocaleString('nl-NL', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>

                  {/* Followers */}
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1 text-gray-400">
                      <Users className="w-4 h-4" />
                      {entry.followers}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Trending tab content - portfolios ranked by followers
function TrendingContent({ onSelectPortfolio, onBuyPortfolio }) {
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/community/trending?limit=20`);
      if (!response.ok) throw new Error('Failed to load trending');
      const data = await response.json();
      setPortfolios(data.portfolios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchTrending}
          className="text-[#28EBCF] hover:underline"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Nog geen trending portfolios</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Er zijn nog geen publieke portfolios. Wees de eerste!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          {portfolios.length} trending portfolio{portfolios.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={fetchTrending}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Vernieuwen"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of trending portfolios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio, index) => {
          const hasReturn = portfolio.recent_return_pct !== null;
          const isPositive = hasReturn && portfolio.recent_return_pct >= 0;

          return (
            <div
              key={portfolio.portfolio_id}
              className="bg-[#1A1B1F] rounded-2xl border border-gray-800 hover:border-green-500/50 transition-colors overflow-hidden group"
            >
              <div className="p-5">
                {/* Rank badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < 3 ? 'bg-green-500/20' : 'bg-gray-800'
                  }`}>
                    <span className={`font-bold text-sm ${
                      index < 3 ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  {/* Followers badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full">
                    <Users className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">{portfolio.followers}</span>
                  </div>
                </div>

                {/* Portfolio info */}
                <div className="mb-3">
                  <h4 className="font-bold text-white group-hover:text-green-400 transition-colors truncate">
                    {portfolio.name}
                  </h4>
                  <p className="text-sm text-gray-400">door {portfolio.creator_name}</p>
                </div>

                {/* Description */}
                {portfolio.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {portfolio.description}
                  </p>
                )}

                {/* Recent return */}
                {hasReturn && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Rendement (1M)</span>
                    <div className={`flex items-center gap-1 font-medium ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {isPositive ? '+' : ''}{portfolio.recent_return_pct.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 flex gap-2">
                <button
                  onClick={() => onSelectPortfolio(portfolio.portfolio_id, portfolio)}
                  className="flex-1 py-2 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                >
                  Bekijk details
                </button>
                <button
                  onClick={() => onBuyPortfolio(portfolio.portfolio_id)}
                  className="flex-1 py-2 rounded-lg font-bold bg-green-500 text-gray-900 hover:bg-green-400 transition-colors text-sm flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Kopen
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// My Follows tab content
function MyFollowsContent({ onSelectPortfolio, onBuyPortfolio }) {
  const { followedPortfolios, loading, loadFollowedPortfolios, userId } = useCommunity();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFollowedPortfolios();
    }
  }, [userId, loadFollowedPortfolios]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFollowedPortfolios();
    setIsRefreshing(false);
  }, [loadFollowedPortfolios]);

  if (!userId) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Log in om te volgen</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Log in om portfolios te volgen en hier terug te zien.
        </p>
      </div>
    );
  }

  if (loading.follows) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (followedPortfolios.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Nog geen gevolgde portfolios</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Volg portfolios om ze hier terug te zien.
          Klik op "Volgen" bij een portfolio om te beginnen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400">
          {followedPortfolios.length} portfolio{followedPortfolios.length !== 1 ? 's' : ''} gevolgd
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Vernieuwen"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followedPortfolios.map(item => {
          const portfolio = item.portfolio || item;
          return (
            <CommunityPortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              onSelect={onSelectPortfolio}
              onBuy={onBuyPortfolio}
            />
          );
        })}
      </div>
    </div>
  );
}

// My Portfolios tab content
function MyPortfoliosContent({ onSelectPortfolio, onCreatePortfolio }) {
  const { userId } = useCommunity();
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchMyPortfolios = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/community/my-portfolios?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to load portfolios');
      const data = await response.json();
      setPortfolios(data.portfolios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchMyPortfolios();
    }
  }, [userId, fetchMyPortfolios]);

  const handleToggleVisibility = useCallback(async (portfolioId, newVisibility) => {
    setUpdatingId(portfolioId);
    try {
      const response = await fetch(
        `${API_BASE}/community/portfolio/${portfolioId}/visibility?user_id=${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibility: newVisibility }),
        }
      );
      if (!response.ok) throw new Error('Failed to update visibility');

      // Update local state
      setPortfolios(prev => prev.map(p =>
        p.id === portfolioId
          ? { ...p, visibility: newVisibility, published_at: newVisibility === 'public' ? new Date().toISOString() : p.published_at }
          : p
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Log in om je portfolios te beheren</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Log in om je eigen portfolios te maken en te beheren.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchMyPortfolios}
          className="text-[#28EBCF] hover:underline"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
        <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-medium">Zichtbaarheid instellen</p>
          <p className="text-blue-300 text-sm">
            Zet een portfolio op <strong>Publiek</strong> om hem zichtbaar te maken in de Community sectie.
            Andere gebruikers kunnen je portfolio dan volgen.
          </p>
        </div>
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-16 bg-[#1A1B1F] rounded-2xl border border-gray-800">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nog geen portfolios</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Maak je eerste portfolio en deel het met de community.
          </p>
          <button
            onClick={onCreatePortfolio}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#28EBCF] text-gray-900 rounded-lg font-bold hover:bg-[#20d4ba] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Maak Portfolio
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} •
              {' '}{portfolios.filter(p => p.visibility === 'public').length} publiek
            </p>
            <button
              onClick={fetchMyPortfolios}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Vernieuwen"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map(portfolio => (
              <MyPortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                onSelect={onSelectPortfolio}
                onToggleVisibility={handleToggleVisibility}
                isUpdating={updatingId === portfolio.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Inner component that uses CommunityContext
function CommunityPortfoliosInner({
  currentUserId,
  onSelectPortfolio,
  onBuyPortfolio,
  onCreatePortfolio,
}) {
  const [activeTab, setActiveTab] = useState('top');
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  // Handle portfolio selection - show detail modal
  const handleSelectPortfolio = useCallback((portfolioId, portfolio = null) => {
    setSelectedPortfolio({ id: portfolioId, data: portfolio });
  }, []);

  // Handle close detail modal
  const handleCloseDetail = useCallback(() => {
    setSelectedPortfolio(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-pink-400" />
            Community
          </h2>
          <p className="text-gray-400 mt-1">
            Ontdek en volg portefeuilles van andere beleggers
          </p>
        </div>
        <button
          onClick={onCreatePortfolio}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#28EBCF] text-gray-900 rounded-lg font-bold hover:bg-[#20d4ba] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Portfolio maken
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4 overflow-x-auto">
        {COMMUNITY_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const colorClasses = {
            yellow: isActive ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'hover:bg-yellow-500/10 hover:text-yellow-400',
            green: isActive ? 'bg-green-500/20 text-green-400 border-green-500' : 'hover:bg-green-500/10 hover:text-green-400',
            pink: isActive ? 'bg-pink-500/20 text-pink-400 border-pink-500' : 'hover:bg-pink-500/10 hover:text-pink-400',
            blue: isActive ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-blue-500/10 hover:text-blue-400',
          };

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors whitespace-nowrap ${
                isActive
                  ? colorClasses[tab.color]
                  : `border-transparent text-gray-400 ${colorClasses[tab.color]}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'top' && (
          <TopPortfoliosContent
            onSelectPortfolio={handleSelectPortfolio}
            onBuyPortfolio={onBuyPortfolio}
          />
        )}
        {activeTab === 'trending' && (
          <TrendingContent
            onSelectPortfolio={handleSelectPortfolio}
            onBuyPortfolio={onBuyPortfolio}
          />
        )}
        {activeTab === 'follows' && (
          <MyFollowsContent
            onSelectPortfolio={handleSelectPortfolio}
            onBuyPortfolio={onBuyPortfolio}
          />
        )}
        {activeTab === 'mine' && (
          <MyPortfoliosContent
            onSelectPortfolio={handleSelectPortfolio}
            onCreatePortfolio={onCreatePortfolio}
          />
        )}
      </div>

      {/* Portfolio Detail Modal */}
      {selectedPortfolio && (
        <CommunityPortfolioDetail
          portfolioId={selectedPortfolio.id}
          portfolio={selectedPortfolio.data}
          onClose={handleCloseDetail}
          onBuyNow={onBuyPortfolio}
        />
      )}
    </div>
  );
}

// Main component wrapped with CommunityProvider
export default function CommunityPortfolios(props) {
  return (
    <CommunityProvider user={{ id: props.currentUserId }}>
      <CommunityPortfoliosInner {...props} />
    </CommunityProvider>
  );
}
