/**
 * Leaderboard Component
 *
 * Displays portfolio rankings by performance.
 * Supports monthly, quarterly, yearly, and all-time periods.
 */

import React, { useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { useLeaderboard } from '../../hooks/useCommunity';
import FollowButton from './FollowButton';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { CompactBadgeRow } from './BadgeDisplay';

// Time period options
const PERIODS = [
  { id: 'month', label: '1M', fullLabel: 'Maand' },
  { id: 'quarter', label: '3M', fullLabel: 'Kwartaal' },
  { id: 'year', label: '1J', fullLabel: 'Jaar' },
  { id: 'all_time', label: 'All', fullLabel: 'Totaal' },
];

// Rank badges - Premium banking palette
const rankBadges = {
  1: { icon: Crown, color: 'text-[#C9A962]', bg: 'bg-[#C9A962]/10', emoji: '🥇' },
  2: { icon: Medal, color: 'text-[#6B7B8A]', bg: 'bg-[#6B7B8A]/10', emoji: '🥈' },
  3: { icon: Award, color: 'text-[#B8956B]', bg: 'bg-[#B8956B]/10', emoji: '🥉' },
};

function LeaderboardEntry({
  entry,
  period,
  onSelect,
  onBuy,
}) {
  const rank = entry.rank;
  const badge = rankBadges[rank];
  const returnPct = entry.return_pct || entry.performance || 0;
  const isPositive = returnPct >= 0;

  // Build a minimal portfolio object for the follow button
  const portfolioForFollow = {
    id: entry.portfolio_id,
    name: entry.portfolio_name,
    creator_name: entry.creator_name,
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] hover:border-[#7C9885]/50 transition-colors group shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Rank */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
        badge ? badge.bg : 'bg-[#ECEEED]'
      }`}>
        {badge ? (
          <badge.icon className={`w-6 h-6 ${badge.color}`} />
        ) : (
          <span className="text-[#636E72] font-bold text-lg">{rank}</span>
        )}
      </div>

      {/* Portfolio info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(entry.portfolio_id)}
            className="font-medium text-[#2D3436] hover:text-[#7C9885] transition-colors truncate"
          >
            {entry.portfolio_name}
          </button>
          {rank <= 3 && (
            <span className="text-sm">{badge.emoji}</span>
          )}
        </div>
        <div className="text-sm text-[#636E72] flex items-center gap-2">
          <span>door {entry.creator_name}</span>
          {entry.badges && entry.badges.length > 0 && (
            <>
              <span className="text-[#B2BEC3]">•</span>
              <CompactBadgeRow badges={entry.badges} />
            </>
          )}
          {entry.follower_count > 0 && (
            <>
              <span className="text-[#B2BEC3]">•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {entry.follower_count}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Performance */}
      <div className={`text-right ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
        <div className="flex items-center gap-1 font-bold text-lg">
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isPositive ? '+' : ''}{(returnPct * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-[#B2BEC3]">
          {PERIODS.find(p => p.id === period)?.fullLabel || period}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <FollowButton
          portfolioId={entry.portfolio_id}
          portfolio={portfolioForFollow}
          size="small"
          variant="outline"
        />
        {onBuy && (
          <button
            onClick={() => onBuy(entry.portfolio_id)}
            className="p-2 rounded-lg bg-[#7C9885] text-white hover:bg-[#6B8A74] transition-colors"
            title="Kopen"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard({ onSelectPortfolio, onBuyPortfolio }) {
  const {
    entries,
    period,
    isLoading,
    loadLeaderboard,
    setLeaderboardPeriod,
  } = useLeaderboard();

  // Load on mount
  useEffect(() => {
    loadLeaderboard(period);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (newPeriod) => {
    setLeaderboardPeriod(newPeriod);
  };

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#C9A962]" />
          Leaderboard
        </h3>
        <div className="flex items-center gap-1 bg-[#ECEEED] rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.id
                  ? 'bg-[#7C9885] text-white'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingSkeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-[#FEFEFE] rounded-2xl border border-[#E8E8E6]">
          <Trophy className="w-12 h-12 text-[#B2BEC3] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D3436] mb-2">Nog geen rankings</h3>
          <p className="text-[#636E72]">
            Er zijn nog geen portfolios met performance data voor deze periode.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <LeaderboardEntry
              key={entry.portfolio_id}
              entry={entry}
              period={period}
              onSelect={onSelectPortfolio}
              onBuy={onBuyPortfolio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
