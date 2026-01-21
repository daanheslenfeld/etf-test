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

  // Trend styling
  const trendStyles = {
    up: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      icon: TrendingUp,
    },
    down: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      icon: TrendingDown,
    },
    neutral: {
      text: 'text-gray-400',
      bg: 'bg-gray-500/10',
      icon: Minus,
    },
  };

  if (variant === 'card') {
    return (
      <div className={`bg-[#1A1B1F] border border-gray-800/50 rounded-xl overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#28EBCF]" />
            <span className="text-sm font-medium text-white">Markt Overzicht</span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(lastUpdated)}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Indices grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-800/30">
          {indices.map((index) => {
            const indexData = data[index.symbol] || {};
            const trend = getTrend(indexData.changePercent);
            const style = trendStyles[trend];
            const TrendIcon = style.icon;

            return (
              <div
                key={index.symbol}
                className="bg-[#1A1B1F] p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">{index.name}</span>
                  <span className="text-[10px] text-gray-600 uppercase">{index.region}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-semibold text-white font-mono tabular-nums">
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
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <p className="text-xs text-red-400 flex items-center gap-1.5">
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
              <span className="text-xs text-gray-500">{index.name}</span>
              <span className="text-sm text-white font-mono tabular-nums">
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
      className={`relative overflow-hidden bg-[#1A1B1F] border border-gray-800/50 rounded-xl ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center px-4 py-3">
        {/* Gradient fade left */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#1A1B1F] to-transparent z-10 pointer-events-none" />

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
                <span className="text-sm text-gray-400 font-medium">{index.name}</span>
                <span className="text-sm text-white font-mono tabular-nums font-medium">
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
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1A1B1F] to-transparent z-10 pointer-events-none" />

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="absolute right-2 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors z-20 disabled:opacity-50"
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
    <div className={`bg-[#1A1B1F] border border-gray-800/50 rounded-xl px-4 py-3 ${className}`}>
      <div className="flex items-center gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="animate-pulse bg-gray-800/50 h-4 w-16 rounded" />
            <div className="animate-pulse bg-gray-800/50 h-4 w-20 rounded" />
            <div className="animate-pulse bg-gray-800/50 h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketTicker;
