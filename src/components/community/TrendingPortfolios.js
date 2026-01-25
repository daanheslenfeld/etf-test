/**
 * TrendingPortfolios Component
 *
 * Displays most followed portfolios in the recent period.
 * Shows new follower counts and total followers.
 */

import React, { useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Flame,
  ShoppingCart,
} from 'lucide-react';
import { useTrending } from '../../hooks/useCommunity';
import FollowButton from './FollowButton';
import { LoadingSkeleton } from '../common/LoadingSpinner';

function TrendingEntry({ entry, onSelect, onBuy }) {
  const returnPct = entry.return_pct || 0;
  const isPositive = returnPct >= 0;

  // Build portfolio object for follow button
  const portfolioForFollow = {
    id: entry.portfolio_id,
    name: entry.portfolio_name,
    creator_name: entry.creator_name,
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] hover:border-[#8B7B9A]/50 transition-colors group shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Trending indicator */}
      <div className="w-12 h-12 rounded-full bg-[#8B7B9A]/10 flex items-center justify-center flex-shrink-0">
        <Flame className="w-6 h-6 text-[#8B7B9A]" />
      </div>

      {/* Portfolio info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onSelect(entry.portfolio_id)}
          className="font-medium text-[#2D3436] hover:text-[#7C9885] transition-colors truncate block text-left"
        >
          {entry.portfolio_name}
        </button>
        <div className="text-sm text-[#636E72]">
          door {entry.creator_name}
        </div>
      </div>

      {/* New followers badge */}
      <div className="text-center">
        <div className="flex items-center gap-1 text-[#8B7B9A] font-bold">
          <UserPlus className="w-4 h-4" />
          +{entry.new_followers}
        </div>
        <div className="text-xs text-[#B2BEC3]">
          nieuwe volgers
        </div>
      </div>

      {/* Total followers */}
      <div className="text-center">
        <div className="flex items-center gap-1 text-[#636E72] font-medium">
          <Users className="w-4 h-4" />
          {entry.total_followers}
        </div>
        <div className="text-xs text-[#B2BEC3]">
          totaal
        </div>
      </div>

      {/* Performance */}
      <div className={`text-right ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
        <div className="flex items-center gap-1 font-bold">
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isPositive ? '+' : ''}{(returnPct * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-[#B2BEC3]">jaarlijks</div>
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

export default function TrendingPortfolios({ onSelectPortfolio, onBuyPortfolio }) {
  const { portfolios, isLoading, loadTrending } = useTrending();

  // Load on mount
  useEffect(() => {
    loadTrending(7);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#8B7B9A]" />
          Trending deze week
        </h3>
        <p className="text-sm text-[#636E72]">
          Meest gevolgde portfolios in de afgelopen 7 dagen
        </p>
      </div>

      {/* Trending list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingSkeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-12 bg-[#FEFEFE] rounded-2xl border border-[#E8E8E6]">
          <TrendingUp className="w-12 h-12 text-[#B2BEC3] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D3436] mb-2">Nog geen trending data</h3>
          <p className="text-[#636E72]">
            Er zijn nog geen nieuwe volgers in de afgelopen week.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map((entry, index) => (
            <TrendingEntry
              key={entry.portfolio_id}
              entry={entry}
              onSelect={onSelectPortfolio}
              onBuy={onBuyPortfolio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
