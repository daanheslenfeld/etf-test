import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, RefreshCw, Globe } from 'lucide-react';
import { isDemoMode, demoApi } from '../demo';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';
const IS_DEMO = isDemoMode();

const formatPrice = (price, currency) => {
  if (!price || price === 0) return '-';

  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };

  if (currency === 'JPY') {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }

  return price.toLocaleString('nl-NL', options);
};

const formatChange = (change, changePercent) => {
  if (change === 0 && changePercent === 0) return { text: '-', color: 'text-[#636E72]' };

  const sign = change >= 0 ? '+' : '';
  const color = change >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]';

  return {
    text: `${sign}${changePercent.toFixed(2)}%`,
    color
  };
};

const TickerItem = ({ index }) => {
  const { text: changeText, color: changeColor } = formatChange(index.change, index.change_percent);
  const isUp = index.change >= 0;

  return (
    <div className="flex items-center gap-1.5 px-4 shrink-0">
      <span className="text-xs font-medium text-[#2D3436] whitespace-nowrap">
        {index.symbol}
      </span>
      <span className="text-xs text-[#636E72] whitespace-nowrap">
        {formatPrice(index.price, index.currency)}
      </span>
      <span className={`flex items-center gap-0 text-xs font-medium whitespace-nowrap ${changeColor}`}>
        {index.change !== 0 && (
          isUp ? (
            <ChevronUp className="w-3.5 h-3.5 -mr-0.5" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 -mr-0.5" strokeWidth={2.5} />
          )
        )}
        {changeText}
      </span>
      <span className="text-[#E0E0DE] ml-2">·</span>
    </div>
  );
};

const INDICES_CACHE_KEY = 'indices_cache';

const loadCachedIndices = () => {
  try {
    const cached = localStorage.getItem(INDICES_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (data?.length > 0) return { data, timestamp };
    }
  } catch (e) { /* ignore */ }
  return null;
};

const saveCachedIndices = (data) => {
  try {
    localStorage.setItem(INDICES_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) { /* ignore */ }
};

export default function MarketIndicesTicker() {
  const cached = loadCachedIndices();
  const [indices, setIndices] = useState(cached?.data || []);
  const [loading, setLoading] = useState(!cached?.data);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(cached?.timestamp ? new Date(cached.timestamp) : null);
  const [isPaused, setIsPaused] = useState(false);
  const [animDuration, setAnimDuration] = useState(30);
  const contentRef = useRef(null);

  const fetchIndices = useCallback(async () => {
    try {
      if (IS_DEMO) {
        const data = await demoApi.getIndices();
        setIndices(data.indices || []);
        saveCachedIndices(data.indices || []);
        setLastUpdate(new Date());
        setError(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${TRADING_API_URL}/trading/indices`, { headers: { 'ngrok-skip-browser-warning': 'true' } });

      if (!response.ok) {
        throw new Error('Failed to fetch indices');
      }

      const data = await response.json();
      setIndices(data.indices || []);
      saveCachedIndices(data.indices || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching indices:', err);
      setError('Kon beurskoersen niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  useEffect(() => {
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  // Calculate animation duration based on content width
  useEffect(() => {
    if (contentRef.current) {
      const width = contentRef.current.scrollWidth;
      // ~50px per second for smooth readable scrolling
      setAnimDuration(Math.max(20, width / 50));
    }
  }, [indices]);

  if (loading && indices.length === 0) {
    return (
      <div className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-[#B2BEC3] text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Beurskoersen laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && indices.length === 0) {
    return (
      <div className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-[#B2BEC3] text-sm">
            <Globe className="w-4 h-4" />
            <span>{error}</span>
            <button
              onClick={fetchIndices}
              className="text-[#7C9885] hover:underline ml-2"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
      <div className="flex items-center">
        {/* Fixed left: Globe icon */}
        <div className="flex items-center px-3 py-1.5 border-r border-[#E8E8E6] shrink-0 bg-[#FEFEFE] z-10">
          <Globe className="w-3.5 h-3.5 text-[#B2BEC3]" />
        </div>

        {/* Scrolling ticker area */}
        <div
          className="flex-1 overflow-hidden py-1.5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={contentRef}
            className="flex items-center whitespace-nowrap"
            style={{
              animation: `ticker ${animDuration}s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {/* Render items twice for seamless loop */}
            {indices.map((index) => (
              <TickerItem key={`a-${index.symbol}`} index={index} />
            ))}
            {indices.map((index) => (
              <TickerItem key={`b-${index.symbol}`} index={index} />
            ))}
          </div>
        </div>

        {/* Fixed right: Refresh button */}
        <button
          onClick={fetchIndices}
          className="shrink-0 px-3 py-1.5 text-[#B2BEC3] hover:text-[#636E72] transition-colors border-l border-[#E8E8E6] bg-[#FEFEFE] z-10"
          title={lastUpdate ? `Laatste update: ${lastUpdate.toLocaleTimeString('nl-NL')}` : 'Verversen'}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Ticker animation keyframes */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
