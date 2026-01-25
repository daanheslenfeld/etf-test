/**
 * CommunityPortfolioDetail Component
 *
 * Detailed view of a community portfolio showing holdings,
 * performance history, and follow functionality.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Calendar,
  Globe,
  Lock,
  BarChart3,
  PieChart,
  Loader2,
} from 'lucide-react';
import FollowButton from '../community/FollowButton';
import PerformanceChart from './PerformanceChart';

// API base URL
const API_BASE = 'http://localhost:8002';

// Risk level colors
const riskLevelColors = {
  1: { text: 'text-blue-400', bg: 'bg-blue-400/10', bar: 'bg-blue-500' },
  2: { text: 'text-green-400', bg: 'bg-green-400/10', bar: 'bg-green-500' },
  3: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', bar: 'bg-yellow-500' },
  4: { text: 'text-orange-400', bg: 'bg-orange-400/10', bar: 'bg-orange-500' },
  5: { text: 'text-red-400', bg: 'bg-red-400/10', bar: 'bg-red-500' },
};

// Category colors
const categoryColors = {
  'Aandelen': '#28EBCF',
  'Obligaties': '#3B82F6',
  'Commodities': '#F59E0B',
  'Vastgoed': '#EC4899',
  'Money market': '#8B5CF6',
  'Other': '#6B7280',
};

export default function CommunityPortfolioDetail({
  portfolioId,
  portfolio: initialPortfolio = null,
  onClose,
  onBuyNow,
}) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [isLoading, setIsLoading] = useState(!initialPortfolio);
  const [error, setError] = useState(null);
  const [showAllHoldings, setShowAllHoldings] = useState(false);

  // Fetch portfolio details if not provided
  useEffect(() => {
    if (!initialPortfolio && portfolioId) {
      const fetchPortfolio = async () => {
        setIsLoading(true);
        try {
          // Try to get from public portfolios list
          const response = await fetch(`${API_BASE}/community/portfolios?search=${portfolioId}`);
          if (response.ok) {
            const data = await response.json();
            const found = data.portfolios?.find(p => p.id === portfolioId);
            if (found) {
              setPortfolio(found);
            } else {
              setError('Portfolio not found');
            }
          } else {
            setError('Failed to load portfolio');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPortfolio();
    }
  }, [portfolioId, initialPortfolio]);

  const riskLevel = portfolio?.risk_level || portfolio?.riskLevel || 3;
  const riskColors = riskLevelColors[riskLevel];
  const isPublic = portfolio?.visibility === 'public';
  const creatorName = portfolio?.creator_name || portfolio?.creator || 'Unknown';

  // Calculate category allocation
  const categoryAllocation = useMemo(() => {
    if (!portfolio?.holdings) return [];
    const categories = {};
    portfolio.holdings.forEach(h => {
      const cat = h.category || 'Other';
      categories[cat] = (categories[cat] || 0) + h.weight;
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  }, [portfolio?.holdings]);

  // Visible holdings
  const holdings = portfolio?.holdings || [];
  const visibleHoldings = showAllHoldings ? holdings : holdings.slice(0, 5);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#1A1B1F] rounded-2xl p-8">
          <Loader2 className="w-8 h-8 text-[#28EBCF] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#1A1B1F] rounded-2xl p-8 text-center">
          <p className="text-red-400 mb-4">{error || 'Portfolio not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
          >
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-[#1A1B1F] rounded-2xl shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{portfolio.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isPublic
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isPublic ? 'Publiek' : 'Privé'}
                </span>
              </div>
              <p className="text-sm text-gray-400">door {creatorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FollowButton
              portfolioId={portfolio.id}
              portfolio={portfolio}
              size="default"
              variant="outline"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Description */}
          {portfolio.description && (
            <div className="mb-6">
              <p className="text-gray-300 leading-relaxed">{portfolio.description}</p>
            </div>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Risico niveau</div>
              <div className={`text-xl font-bold ${riskColors.text}`}>
                {riskLevel}/5
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Volgers</div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                {portfolio.followers || 0}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Aantal ETFs</div>
              <div className="text-xl font-bold text-white">
                {holdings.length}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Gepubliceerd</div>
              <div className="text-sm text-gray-300 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {portfolio.published_at
                  ? new Date(portfolio.published_at).toLocaleDateString('nl-NL')
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Risk bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Risicoprofiel</span>
              <span className={riskColors.text}>
                {riskLevel === 1 ? 'Zeer laag' :
                 riskLevel === 2 ? 'Laag' :
                 riskLevel === 3 ? 'Gemiddeld' :
                 riskLevel === 4 ? 'Hoog' : 'Zeer hoog'}
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${riskColors.bar}`}
                style={{ width: `${riskLevel * 20}%` }}
              />
            </div>
          </div>

          {/* Performance Chart */}
          {isPublic && (
            <div className="mb-6">
              <PerformanceChart portfolioId={portfolio.id} />
            </div>
          )}

          {/* Category allocation */}
          {categoryAllocation.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#28EBCF]" />
                Allocatie per categorie
              </h3>
              <div className="space-y-3">
                {categoryAllocation.map(([category, weight]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{category}</span>
                      <span className="text-white font-medium">{weight.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${weight}%`,
                          backgroundColor: categoryColors[category] || categoryColors.Other,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings list */}
          {holdings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#28EBCF]" />
                ETF Holdings
              </h3>
              <div className="space-y-2">
                {visibleHoldings.map((holding, idx) => (
                  <div
                    key={holding.isin || idx}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {holding.isin?.slice(-6) || 'ETF'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                          {holding.weight}%
                        </span>
                        {holding.category && (
                          <span className="text-xs text-gray-500">{holding.category}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">
                        {holding.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show more/less */}
              {holdings.length > 5 && (
                <button
                  onClick={() => setShowAllHoldings(!showAllHoldings)}
                  className="flex items-center gap-2 text-sm text-[#28EBCF] hover:underline mt-3"
                >
                  {showAllHoldings ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Toon minder
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Toon alle {holdings.length} holdings
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          {portfolio.tags && portfolio.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {portfolio.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-[#1A1B1F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {portfolio.followers || 0} volgers
              </span>
              {portfolio.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Gemaakt: {new Date(portfolio.created_at).toLocaleDateString('nl-NL')}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Sluiten
              </button>
              <button
                onClick={() => onBuyNow(portfolio.id)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-[#28EBCF] text-gray-900 hover:bg-[#20d4ba] transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Portfolio kopen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
