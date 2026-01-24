import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';

/**
 * MarketTicker Component
 *
 * Scrolling ticker showing major market indices
 * Auto-refreshes and shows real-time data
 */

// Default indices to display
const DEFAULT_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', region: 'US' },
  { symbol: '^DJI', name: 'Dow Jones', region: 'US' },
  { symbol: '^IXIC', name: 'Nasdaq', region: 'US' },
  { symbol: '^AEX', name: 'AEX', region: 'EU' },
  { symbol: '^GDAXI', name: 'DAX', region: 'EU' },
  { symbol: '^FTSE', name: 'FTSE 100', region: 'UK' },
  { symbol: '^N225', name: 'Nikkei', region: 'ASIA' },
];

export function MarketTicker({
  indices = DEFAULT_INDICES,
  data = {},
  loading = false,
  error = null,
  onRefresh,
  lastUpdated,
  autoScroll = true,
  scrollSpeed = 30, // seconds for one full scroll
  variant = 'default', // 'default' | 'compact' | 'card'
  className = '',
}) {
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef(null);

  // Format price
  const formatPrice = (value) => {
    if (typeof value !== 'number') return '—';
    return new Intl.NumberFormat('nl-NL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format change percent
  const formatChange = (value) => {
    if (typeof value !== 'number') return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine trend
  const getTrend = (change) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };

  // Trend styling - Premium banking palette
  const trendStyles = {
    up: {
      text: 'text-[#7C9885]',
      bg: 'bg-[#7C9885]/10',
      icon: TrendingUp,
    },
    down: {
      text: 'text-[#C0736D]',
      bg: 'bg-[#C0736D]/10',
      icon: TrendingDown,
    },
    neutral: {
      text: 'text-[#636E72]',
      bg: 'bg-[#ECEEED]',
      icon: Minus,
    },
  };

  if (variant === 'card') {
    return (
      <div className={`bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E6]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7C9885]" />
            <span className="text-sm font-medium text-[#2D3436]">Markt Overzicht</span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-[#B2BEC3] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(lastUpdated)}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Indices grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#E8E8E6]">
          {indices.map((index) => {
            const indexData = data[index.symbol] || {};
            const trend = getTrend(indexData.changePercent);
            const style = trendStyles[trend];
            const TrendIcon = style.icon;

            return (
              <div
                key={index.symbol}
                className="bg-[#FEFEFE] p-4 hover:bg-[#F5F6F4] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#636E72] font-medium">{index.name}</span>
                  <span className="text-[10px] text-[#B2BEC3] uppercase">{index.region}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-semibold text-[#2D3436] font-mono tabular-nums">
                    {formatPrice(indexData.price)}
                  </span>
                  <div className={`flex items-center gap-1 ${style.text}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium font-mono tabular-nums">
                      {formatChange(indexData.changePercent)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="px-4 py-2 bg-[#C0736D]/10 border-t border-[#C0736D]/20">
            <p className="text-xs text-[#C0736D] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 overflow-x-auto scrollbar-hide ${className}`}>
        {indices.map((index) => {
          const indexData = data[index.symbol] || {};
          const trend = getTrend(indexData.changePercent);
          const style = trendStyles[trend];

          return (
            <div key={index.symbol} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[#636E72]">{index.name}</span>
              <span className="text-sm text-[#2D3436] font-mono tabular-nums">
                {formatPrice(indexData.price)}
              </span>
              <span className={`text-xs font-medium font-mono tabular-nums ${style.text}`}>
                {formatChange(indexData.changePercent)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Default scrolling ticker
  return (
    <div
      className={`relative overflow-hidden bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center px-4 py-3">
        {/* Gradient fade left */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FEFEFE] to-transparent z-10 pointer-events-none" />

        {/* Scrolling content */}
        <div
          ref={tickerRef}
          className="flex items-center gap-8 animate-ticker"
          style={{
            animationPlayState: isPaused || !autoScroll ? 'paused' : 'running',
            animationDuration: `${scrollSpeed}s`,
          }}
        >
          {/* Duplicate content for seamless loop */}
          {[...indices, ...indices].map((index, i) => {
            const indexData = data[index.symbol] || {};
            const trend = getTrend(indexData.changePercent);
            const style = trendStyles[trend];
            const TrendIcon = style.icon;

            return (
              <div
                key={`${index.symbol}-${i}`}
                className="flex items-center gap-3 flex-shrink-0"
              >
                <span className="text-sm text-[#636E72] font-medium">{index.name}</span>
                <span className="text-sm text-[#2D3436] font-mono tabular-nums font-medium">
                  {formatPrice(indexData.price)}
                </span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${style.bg}`}>
                  <TrendIcon className={`w-3.5 h-3.5 ${style.text}`} />
                  <span className={`text-xs font-medium font-mono tabular-nums ${style.text}`}>
                    {formatChange(indexData.changePercent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gradient fade right */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FEFEFE] to-transparent z-10 pointer-events-none" />

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="absolute right-2 p-1.5 text-[#B2BEC3] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors z-20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* CSS for ticker animation */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * MarketTickerSkeleton - Loading state
 */
export function MarketTickerSkeleton({ className = '' }) {
  return (
    <div className={`bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl px-4 py-3 ${className}`}>
      <div className="flex items-center gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="animate-pulse bg-[#ECEEED] h-4 w-16 rounded" />
            <div className="animate-pulse bg-[#ECEEED] h-4 w-20 rounded" />
            <div className="animate-pulse bg-[#ECEEED] h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketTicker;
