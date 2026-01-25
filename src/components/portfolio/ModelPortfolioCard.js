/**
 * ModelPortfolioCard Component
 *
 * Card component for displaying a model portfolio with its key metrics.
 * Supports one-click investing and detail view.
 */

import React from 'react';
import {
  TrendingUp,
  Shield,
  Zap,
  Target,
  Leaf,
  DollarSign,
  Globe,
  Heart,
  Sparkles,
  BarChart3,
  Layers,
  PiggyBank,
  ChevronRight,
  Percent,
  ShoppingCart,
  Clock,
  Calendar,
  Users,
  Award,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/portfolioUtils';

// Map portfolio categories to icons
const categoryIcons = {
  Risk: Shield,
  Theme: Sparkles,
  Strategy: BarChart3,
  Community: Users,
};

// Map specific portfolios to icons based on their ID or theme
const getPortfolioIcon = (portfolio) => {
  const id = portfolio.id || '';
  const tags = portfolio.tags || [];

  if (id.includes('bonds')) return Shield;
  if (id.includes('defensive')) return Shield;
  if (id.includes('neutral')) return Target;
  if (id.includes('offensive') || id.includes('aggressive')) return Zap;
  if (id.includes('stocks')) return TrendingUp;
  if (id.includes('ai') || id.includes('tech')) return Sparkles;
  if (id.includes('esg') || id.includes('sustainability')) return Leaf;
  if (id.includes('dividend') || id.includes('income')) return DollarSign;
  if (id.includes('emerging')) return Globe;
  if (id.includes('healthcare')) return Heart;
  if (id.includes('energy')) return Zap;
  if (id.includes('all-weather')) return Layers;
  if (id.includes('factor')) return BarChart3;
  if (id.includes('core-satellite')) return Layers;
  if (id.includes('buy-hold')) return PiggyBank;
  if (tags.includes('inflation')) return Shield;

  return Target;
};

// Risk level colors - Premium banking palette
const riskLevelColors = {
  1: { text: 'text-[#6B7B8A]', bg: 'bg-[#6B7B8A]/10', bar: 'bg-[#6B7B8A]' },
  2: { text: 'text-[#7C9885]', bg: 'bg-[#7C9885]/10', bar: 'bg-[#7C9885]' },
  3: { text: 'text-[#C9A962]', bg: 'bg-[#C9A962]/10', bar: 'bg-[#C9A962]' },
  4: { text: 'text-[#B8956B]', bg: 'bg-[#B8956B]/10', bar: 'bg-[#B8956B]' },
  5: { text: 'text-[#C0736D]', bg: 'bg-[#C0736D]/10', bar: 'bg-[#C0736D]' },
};

// Category badge colors - Premium banking palette
const categoryColors = {
  Risk: 'bg-[#6B7B8A]/10 text-[#6B7B8A]',
  Theme: 'bg-[#8B7B9A]/10 text-[#8B7B9A]',
  Strategy: 'bg-[#7C9885]/10 text-[#7C9885]',
  Community: 'bg-[#C0736D]/10 text-[#C0736D]',
};

export default function ModelPortfolioCard({
  portfolio,
  onSelect,
  onBuyNow,
  compact = false,
  showCommunityBadge = false,
}) {
  const Icon = getPortfolioIcon(portfolio);
  const riskColors = riskLevelColors[portfolio.riskLevel] || riskLevelColors[3];
  const categoryColor = categoryColors[portfolio.category] || categoryColors.Risk;
  const CategoryIcon = categoryIcons[portfolio.category] || Shield;

  // Get category allocation summary
  const getCategoryAllocation = () => {
    const categories = {};
    (portfolio.holdings || []).forEach(h => {
      const cat = h.category || 'Other';
      categories[cat] = (categories[cat] || 0) + h.weight;
    });
    return Object.entries(categories);
  };

  const allocation = getCategoryAllocation();

  if (compact) {
    // Compact view for list/grid
    return (
      <button
        onClick={() => onSelect(portfolio.id)}
        className="w-full bg-[#FEFEFE] rounded-xl p-4 hover:bg-[#F5F6F4] transition-all text-left border border-[#E8E8E6] hover:border-[#7C9885] group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${riskColors.bg} ${riskColors.text}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[#2D3436] group-hover:text-[#7C9885] transition-colors truncate">
                {portfolio.name}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                {portfolio.category}
              </span>
            </div>
            <p className="text-sm text-[#636E72] truncate">
              {portfolio.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-[#7C9885] font-bold">
              <Percent className="w-3 h-3" />
              {(portfolio.expectedReturn * 100).toFixed(1)}
            </div>
            <div className="text-xs text-[#B2BEC3]">verwacht</div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B2BEC3] group-hover:text-[#7C9885] group-hover:translate-x-1 transition-all" />
        </div>
      </button>
    );
  }

  // Full card view
  return (
    <div className="bg-[#FEFEFE] rounded-2xl shadow-[0_2px_8px_rgba(45,52,54,0.06)] hover:shadow-[0_8px_32px_rgba(45,52,54,0.12)] transition-all border border-[#E8E8E6] hover:border-[#7C9885] group relative overflow-hidden flex flex-col">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7C9885]/0 to-[#7C9885]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header */}
      <div className="p-6 pb-4 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${riskColors.bg} ${riskColors.text}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[#7C9885] font-bold text-lg">
              <Percent className="w-4 h-4" />
              {(portfolio.expectedReturn * 100).toFixed(1)}
            </div>
            <div className="text-xs text-[#B2BEC3]">verwacht rendement</div>
          </div>
        </div>

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${categoryColor}`}>
            <CategoryIcon className="w-3 h-3" />
            {portfolio.category}
          </span>
          {showCommunityBadge && portfolio.creator && (
            <span className="text-xs px-2 py-1 rounded-full bg-[#ECEEED] text-[#636E72] inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              {portfolio.creator}
            </span>
          )}
          {portfolio.badge && (
            <span className="text-xs px-2 py-1 rounded-full bg-[#C9A962]/10 text-[#C9A962] inline-flex items-center gap-1">
              <Award className="w-3 h-3" />
              {portfolio.badge}
            </span>
          )}
        </div>

        {/* Title and description */}
        <h4 className="font-bold text-xl mb-2 text-[#2D3436] group-hover:text-[#7C9885] transition-colors">
          {portfolio.name}
        </h4>
        <p className="text-sm text-[#636E72] leading-relaxed line-clamp-2">
          {portfolio.description}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 pb-4 flex-grow relative z-10">
        {/* Allocation breakdown */}
        <div className="space-y-1.5 mb-4">
          {allocation.slice(0, 4).map(([cat, pct]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-[#636E72]">{cat}</span>
              <span className="text-[#2D3436] font-medium">{pct.toFixed(1)}%</span>
            </div>
          ))}
          {allocation.length > 4 && (
            <div className="text-xs text-[#B2BEC3]">
              +{allocation.length - 4} meer categorieën
            </div>
          )}
        </div>

        {/* Risk indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#B2BEC3] mb-1">
            <span>Risico niveau {portfolio.riskLevel}/5</span>
            <span>{(portfolio.stdDev * 100).toFixed(1)}% volatiliteit</span>
          </div>
          <div className="h-2 bg-[#ECEEED] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${riskColors.bar}`}
              style={{ width: `${portfolio.riskLevel * 20}%` }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-[#B2BEC3]">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {portfolio.holdings?.length || 0} ETFs
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {portfolio.rebalanceFrequency === 'quarterly' ? 'Kwartaal' :
             portfolio.rebalanceFrequency === 'yearly' ? 'Jaarlijks' : 'Maandelijks'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-[#E8E8E6] relative z-10 mt-auto space-y-3">
        {/* Buy button */}
        {onBuyNow && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(portfolio.id);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7C9885] text-white font-bold rounded-lg hover:bg-[#6B8A74] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Toevoegen aan basket
          </button>
        )}

        {/* View details link */}
        <button
          onClick={() => onSelect(portfolio.id)}
          className="w-full flex items-center justify-between text-sm text-[#7C9885] font-medium hover:underline"
        >
          <span>Bekijk details</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
