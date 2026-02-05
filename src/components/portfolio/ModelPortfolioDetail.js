/**
 * ModelPortfolioDetail Component
 *
 * Detailed view of a model portfolio showing all holdings,
 * risk metrics, and one-click investing functionality.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Shield,
  Zap,
  Target,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
  Globe,
  Clock,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import { formatCurrency, formatPercentage, calculateMinimumInvestment } from '../../utils/portfolioUtils';
import { getTradingInfo } from '../../data/tradableETFs';
import { useTrading } from '../../context/TradingContext';

// Risk level colors - Premium banking palette
const riskLevelColors = {
  1: { text: 'text-[#6B7B8A]', bg: 'bg-[#6B7B8A]/10', bar: 'bg-[#6B7B8A]' },
  2: { text: 'text-[#7C9885]', bg: 'bg-[#7C9885]/10', bar: 'bg-[#7C9885]' },
  3: { text: 'text-[#C9A962]', bg: 'bg-[#C9A962]/10', bar: 'bg-[#C9A962]' },
  4: { text: 'text-[#B8956B]', bg: 'bg-[#B8956B]/10', bar: 'bg-[#B8956B]' },
  5: { text: 'text-[#C0736D]', bg: 'bg-[#C0736D]/10', bar: 'bg-[#C0736D]' },
};

// Category colors for allocation chart - Premium banking palette
const categoryColors = {
  'Aandelen': '#7C9885',
  'Obligaties': '#6B7B8A',
  'Commodities': '#C9A962',
  'Vastgoed': '#C0736D',
  'Money market': '#8B7B9A',
  'Other': '#B2BEC3',
};

export default function ModelPortfolioDetail({
  portfolio,
  onClose,
  onBuyNow,
  isOffline = false,
  cachedPrices = {},
}) {
  const { marketData } = useTrading();
  const [showAllHoldings, setShowAllHoldings] = useState(false);
  const riskColors = riskLevelColors[portfolio.riskLevel] || riskLevelColors[3];

  // Calculate minimum investment
  const minimumInvestment = useMemo(() => {
    return calculateMinimumInvestment(portfolio.id, marketData || {});
  }, [portfolio.id, marketData]);

  // Calculate category allocation
  const categoryAllocation = useMemo(() => {
    const categories = {};
    portfolio.holdings.forEach(h => {
      const cat = h.category || 'Other';
      categories[cat] = (categories[cat] || 0) + h.weight;
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  }, [portfolio.holdings]);

  // Get trading info for each holding - use live marketData with cachedPrices fallback
  const enrichedHoldings = useMemo(() => {
    return portfolio.holdings.map(holding => {
      const tradingInfo = getTradingInfo(holding.isin);
      const symbol = tradingInfo?.symbol;
      const liveData = symbol ? (marketData || {})[symbol] : null;
      const cachedPrice = symbol ? cachedPrices[symbol] : null;
      const price = liveData?.last || liveData?.ask || cachedPrice?.last || cachedPrice?.ask || null;
      const isLive = !!(liveData?.last || liveData?.ask);
      return {
        ...holding,
        tradingInfo,
        price,
        priceStale: isLive ? (liveData?.delayed || false) : true,
      };
    });
  }, [portfolio.holdings, cachedPrices, marketData]);

  // Visible holdings (collapsed or expanded)
  const visibleHoldings = showAllHoldings ? enrichedHoldings : enrichedHoldings.slice(0, 5);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Onbekend';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-[#FEFEFE] rounded-2xl shadow-[0_8px_32px_rgba(45,52,54,0.12)] border border-[#E8E8E6]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E6]">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${riskColors.bg} ${riskColors.text}`}>
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3436]">{portfolio.name}</h2>
              <p className="text-sm text-[#636E72]">{portfolio.category} Portfolio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F5F6F4] transition-colors"
          >
            <X className="w-5 h-5 text-[#636E72]" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Offline banner */}
          {isOffline && (
            <div className="flex items-center gap-3 p-4 bg-[#C9A962]/10 rounded-lg mb-6">
              <WifiOff className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
              <div>
                <p className="text-[#C9A962] font-medium">Prijzen kunnen vertraagd zijn</p>
                <p className="text-[#C9A962]/80 text-sm">Je bekijkt gecachete data. Verbind met de broker voor actuele koersen.</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <p className="text-[#636E72] leading-relaxed">{portfolio.description}</p>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#F5F6F4] rounded-lg p-4">
              <div className="text-sm text-[#636E72] mb-1">Verwacht rendement</div>
              <div className="text-xl font-bold text-[#7C9885]">
                {(portfolio.expectedReturn * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#F5F6F4] rounded-lg p-4">
              <div className="text-sm text-[#636E72] mb-1">Volatiliteit</div>
              <div className="text-xl font-bold text-[#2D3436]">
                {(portfolio.stdDev * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#F5F6F4] rounded-lg p-4">
              <div className="text-sm text-[#636E72] mb-1">Risico niveau</div>
              <div className={`text-xl font-bold ${riskColors.text}`}>
                {portfolio.riskLevel}/5
              </div>
            </div>
            <div className="bg-[#F5F6F4] rounded-lg p-4">
              <div className="text-sm text-[#636E72] mb-1">Minimale inleg</div>
              <div className="text-xl font-bold text-[#2D3436]">
                {minimumInvestment.minimum > 0
                  ? formatCurrency(minimumInvestment.minimum)
                  : `${portfolio.holdings.length} ETFs`}
              </div>
            </div>
          </div>

          {/* Risk bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-[#636E72] mb-2">
              <span>Risicoprofiel</span>
              <span className={riskColors.text}>
                {portfolio.riskLevel === 1 ? 'Zeer laag' :
                 portfolio.riskLevel === 2 ? 'Laag' :
                 portfolio.riskLevel === 3 ? 'Gemiddeld' :
                 portfolio.riskLevel === 4 ? 'Hoog' : 'Zeer hoog'}
              </span>
            </div>
            <div className="h-3 bg-[#ECEEED] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${riskColors.bar}`}
                style={{ width: `${portfolio.riskLevel * 20}%` }}
              />
            </div>
          </div>

          {/* Category allocation */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#2D3436] mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#7C9885]" />
              Allocatie per categorie
            </h3>
            <div className="space-y-3">
              {categoryAllocation.map(([category, weight]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#636E72]">{category}</span>
                    <span className="text-[#2D3436] font-medium">{weight.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[#ECEEED] rounded-full overflow-hidden">
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

          {/* Region exposure */}
          {portfolio.regionExposure && portfolio.regionExposure.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#2D3436] mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#7C9885]" />
                Regionale spreiding
              </h3>
              <div className="flex flex-wrap gap-2">
                {portfolio.regionExposure.map(({ region, weight }) => (
                  <div
                    key={region}
                    className="px-3 py-1.5 bg-[#F5F6F4] rounded-lg text-sm"
                  >
                    <span className="text-[#636E72]">{region}:</span>{' '}
                    <span className="text-[#2D3436] font-medium">{weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings list */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#2D3436] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#7C9885]" />
              ETF Holdings
            </h3>
            <div className="space-y-2">
              {visibleHoldings.map((holding) => (
                <div
                  key={holding.isin}
                  className="flex items-center justify-between p-3 bg-[#F5F6F4] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#2D3436]">
                        {holding.tradingInfo?.symbol || holding.isin.slice(-6)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[#ECEEED] text-[#636E72] rounded">
                        {holding.weight}%
                      </span>
                      {holding.category && (
                        <span className="text-xs text-[#B2BEC3]">{holding.category}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#636E72] truncate mt-0.5">
                      {holding.name}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {holding.price ? (
                      <div>
                        <span className="font-medium text-[#2D3436]">
                          {formatCurrency(holding.price)}
                        </span>
                        {holding.priceStale && (
                          <span className="text-xs text-[#C9A962] ml-1">*</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#B2BEC3] text-sm">Geen prijs</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Show more/less button */}
            {enrichedHoldings.length > 5 && (
              <button
                onClick={() => setShowAllHoldings(!showAllHoldings)}
                className="flex items-center gap-2 text-sm text-[#7C9885] hover:underline mt-3"
              >
                {showAllHoldings ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Toon minder
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Toon alle {enrichedHoldings.length} holdings
                  </>
                )}
              </button>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#636E72] mb-4">
            <div className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              Herbalanceren:{' '}
              {portfolio.rebalanceFrequency === 'quarterly' ? 'Elk kwartaal' :
               portfolio.rebalanceFrequency === 'yearly' ? 'Jaarlijks' : 'Maandelijks'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Bijgewerkt: {formatDate(portfolio.lastUpdated)}
            </div>
          </div>

          {/* Tags */}
          {portfolio.tags && portfolio.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {portfolio.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-[#F5F6F4] text-[#636E72] rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E8E6] bg-[#FEFEFE]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-[#636E72]">Verwacht jaarlijks rendement</div>
                <div className="text-2xl font-bold text-[#7C9885]">
                  {(portfolio.expectedReturn * 100).toFixed(1)}%
                </div>
              </div>
              {minimumInvestment.minimum > 0 && (
                <div>
                  <div className="text-sm text-[#636E72]">Minimale inleg</div>
                  <div className="text-2xl font-bold text-[#2D3436]">
                    {formatCurrency(minimumInvestment.minimum)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium bg-[#ECEEED] text-[#636E72] hover:bg-[#E8E8E6] transition-colors"
              >
                Sluiten
              </button>
              <button
                onClick={() => onBuyNow(portfolio.id)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-[#7C9885] text-white hover:bg-[#6B8A74] transition-colors"
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
