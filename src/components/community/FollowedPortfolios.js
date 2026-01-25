/**
 * FollowedPortfolios Component
 *
 * Displays portfolios the current user is following.
 * Allows viewing and unfollowing portfolios.
 */

import React, { useEffect } from 'react';
import {
  Heart,
  HeartOff,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ShoppingCart,
  Eye,
} from 'lucide-react';
import { useFollowedPortfolios } from '../../hooks/useCommunity';
import FollowButton from './FollowButton';
import { LoadingSkeleton } from '../common/LoadingSpinner';

function FollowedPortfolioCard({ item, onSelect, onBuy }) {
  const portfolio = item.portfolio;
  const followedAt = item.followed_at;

  if (!portfolio) return null;

  const returnPct = portfolio.performance?.year || 0;
  const isPositive = returnPct >= 0;

  // Format follow date
  const followDate = followedAt
    ? new Date(followedAt).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Onbekend';

  return (
    <div className="bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] hover:border-[#C0736D]/50 transition-colors overflow-hidden group shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C0736D]/10 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#C0736D]" />
            </div>
            <div>
              <button
                onClick={() => onSelect(portfolio.id)}
                className="font-medium text-[#2D3436] hover:text-[#7C9885] transition-colors text-left"
              >
                {portfolio.name}
              </button>
              <p className="text-sm text-[#636E72]">door {portfolio.creator_name}</p>
            </div>
          </div>
          <div className={`text-right ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
            <div className="flex items-center gap-1 font-bold text-lg">
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{(returnPct * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-[#B2BEC3]">jaarlijks</div>
          </div>
        </div>

        {/* Description */}
        {portfolio.description && (
          <p className="text-sm text-[#636E72] mb-3 line-clamp-2">
            {portfolio.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-[#B2BEC3] mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {portfolio.followers || 0} volgers
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Volgend sinds {followDate}
          </div>
        </div>

        {/* Performance bars */}
        <div className="space-y-2">
          {['month', 'quarter', 'year'].map(period => {
            const perf = portfolio.performance?.[period] || 0;
            const pos = perf >= 0;
            const label = period === 'month' ? '1M' : period === 'quarter' ? '3M' : '1J';
            return (
              <div key={period} className="flex items-center gap-2 text-sm">
                <span className="text-[#B2BEC3] w-8">{label}</span>
                <div className="flex-1 h-1.5 bg-[#ECEEED] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pos ? 'bg-[#7C9885]' : 'bg-[#C0736D]'}`}
                    style={{ width: `${Math.min(Math.abs(perf) * 200, 100)}%` }}
                  />
                </div>
                <span className={`w-16 text-right font-medium ${pos ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                  {pos ? '+' : ''}{(perf * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#E8E8E6] flex items-center justify-between bg-[#F5F6F4]">
        <div className="flex items-center gap-2">
          {/* Risk level */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#B2BEC3]">Risico:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={`w-2 h-2 rounded-full ${
                    level <= (portfolio.risk_level || 3) ? 'bg-[#7C9885]' : 'bg-[#E8E8E6]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(portfolio.id)}
            className="p-2 rounded-lg bg-[#ECEEED] text-[#636E72] hover:text-[#2D3436] hover:bg-[#E8E8E6] transition-colors"
            title="Bekijk details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <FollowButton
            portfolioId={portfolio.id}
            portfolio={portfolio}
            size="small"
            variant="outline"
          />
          {onBuy && (
            <button
              onClick={() => onBuy(portfolio.id)}
              className="px-3 py-1.5 rounded-lg bg-[#7C9885] text-white hover:bg-[#6B8A74] transition-colors font-medium text-sm flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Kopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FollowedPortfolios({ onSelectPortfolio, onBuyPortfolio }) {
  const {
    portfolios,
    isLoading,
    loadFollowedPortfolios,
    count,
  } = useFollowedPortfolios();

  // Load on mount
  useEffect(() => {
    loadFollowedPortfolios();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#C0736D]" />
          Mijn gevolgde portfolios
          {count > 0 && (
            <span className="ml-2 px-2 py-0.5 text-sm bg-[#C0736D]/10 text-[#C0736D] rounded-full">
              {count}
            </span>
          )}
        </h3>
      </div>

      {/* Followed portfolios */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <LoadingSkeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-12 bg-[#FEFEFE] rounded-2xl border border-[#E8E8E6]">
          <HeartOff className="w-12 h-12 text-[#B2BEC3] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D3436] mb-2">Nog geen portfolios gevolgd</h3>
          <p className="text-[#636E72] mb-4">
            Volg portfolios om ze hier te zien en op de hoogte te blijven van hun prestaties.
          </p>
          <p className="text-sm text-[#B2BEC3]">
            Ontdek portfolios in de <span className="text-[#C9A962]">Top Portfolios</span> of{' '}
            <span className="text-[#8B7B9A]">Trending</span> tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map(item => (
            <FollowedPortfolioCard
              key={item.portfolio?.id || item.portfolio_id}
              item={item}
              onSelect={onSelectPortfolio}
              onBuy={onBuyPortfolio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
