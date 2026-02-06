import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Globe } from 'lucide-react';
import { isDemoMode, demoApi } from '../demo';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';
const IS_DEMO = isDemoMode();

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

const formatPrice = (price, currency) => {
  if (!price || price === 0) return '-';
  const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (currency === 'JPY') { options.minimumFractionDigits = 0; options.maximumFractionDigits = 0; }
  return price.toLocaleString('nl-NL', options);
};

const formatChange = (change, changePercent) => {
  if (change === 0 && changePercent === 0) return { text: '-', isUp: true, isZero: true };
  const sign = change >= 0 ? '+' : '';
  return { text: `${sign}${changePercent.toFixed(2)}%`, isUp: change >= 0, isZero: false };
};

// Build the inner HTML for a single ticker item (used for direct DOM updates)
const buildItemHTML = (index) => {
  const { text, isUp, isZero } = formatChange(index.change, index.change_percent);
  const colorClass = isZero ? 'text-[#636E72]' : isUp ? 'text-[#7C9885]' : 'text-[#C0736D]';
  const arrow = isZero ? '' : isUp
    ? '<svg class="w-3.5 h-3.5 -mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>'
    : '<svg class="w-3.5 h-3.5 -mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  return `<div class="flex items-center gap-1.5 px-4 shrink-0">
    <span class="text-xs font-medium text-[#2D3436] whitespace-nowrap">${index.symbol}</span>
    <span class="text-xs text-[#636E72] whitespace-nowrap">${formatPrice(index.price, index.currency)}</span>
    <span class="flex items-center gap-0 text-xs font-medium whitespace-nowrap ${colorClass}">${arrow}${text}</span>
    <span class="text-[#E0E0DE] ml-2">&middot;</span>
  </div>`;
};

export default function MarketIndicesTicker() {
  const cached = loadCachedIndices();
  const [initialIndices] = useState(cached?.data || []);
  const [loading, setLoading] = useState(!cached?.data);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(cached?.timestamp ? new Date(cached.timestamp) : null);

  const stripRef = useRef(null);
  const indicesRef = useRef(cached?.data || []);
  const durationSet = useRef(false);

  // Update ticker DOM directly without React re-render
  const updateTickerDOM = useCallback((newIndices) => {
    if (!stripRef.current || newIndices.length === 0) return;

    // Find all item containers by data-copy attribute
    const copyA = stripRef.current.querySelector('[data-copy="a"]');
    const copyB = stripRef.current.querySelector('[data-copy="b"]');
    if (!copyA || !copyB) return;

    const html = newIndices.map(buildItemHTML).join('');
    copyA.innerHTML = html;
    copyB.innerHTML = html;
  }, []);

  // Set animation duration once after first render
  useEffect(() => {
    if (stripRef.current && !durationSet.current && indicesRef.current.length > 0) {
      const width = stripRef.current.scrollWidth;
      const duration = Math.max(10, width / 120);
      stripRef.current.style.setProperty('--ticker-duration', `${duration}s`);
      durationSet.current = true;
    }
  });

  const fetchIndices = useCallback(async () => {
    try {
      let newIndices;
      if (IS_DEMO) {
        const data = await demoApi.getIndices();
        newIndices = data.indices || [];
      } else {
        const response = await fetch(`${TRADING_API_URL}/trading/indices`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        if (!response.ok) throw new Error('Failed to fetch indices');
        const data = await response.json();
        newIndices = data.indices || [];
      }

      // Store in ref and cache, update DOM directly (no React re-render)
      indicesRef.current = newIndices;
      saveCachedIndices(newIndices);
      updateTickerDOM(newIndices);
      setLastUpdate(new Date());
      setError(null);

      // Only trigger React re-render on first load (to hide loading state)
      if (loading) setLoading(false);
    } catch (err) {
      console.error('Error fetching indices:', err);
      setError('Kon beurskoersen niet laden');
      if (loading) setLoading(false);
    }
  }, [loading, updateTickerDOM]);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  useEffect(() => {
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  if (loading && initialIndices.length === 0) {
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

  if (error && initialIndices.length === 0) {
    return (
      <div className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-[#B2BEC3] text-sm">
            <Globe className="w-4 h-4" />
            <span>{error}</span>
            <button onClick={fetchIndices} className="text-[#7C9885] hover:underline ml-2">
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Build initial HTML (rendered once, then updated via DOM)
  const itemsHTML = initialIndices.map(buildItemHTML).join('');

  return (
    <div className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
      <div className="flex items-center">
        <div className="flex items-center px-3 py-1.5 border-r border-[#E8E8E6] shrink-0 bg-[#FEFEFE] z-10">
          <Globe className="w-3.5 h-3.5 text-[#B2BEC3]" />
        </div>

        <div
          className="flex-1 overflow-hidden py-1.5"
          onMouseEnter={() => stripRef.current?.classList.add('ticker-paused')}
          onMouseLeave={() => stripRef.current?.classList.remove('ticker-paused')}
        >
          <div
            ref={stripRef}
            className="flex items-center whitespace-nowrap ticker-strip"
          >
            <div data-copy="a" className="flex items-center" dangerouslySetInnerHTML={{ __html: itemsHTML }} />
            <div data-copy="b" className="flex items-center" dangerouslySetInnerHTML={{ __html: itemsHTML }} />
          </div>
        </div>

        <button
          onClick={fetchIndices}
          className="shrink-0 px-3 py-1.5 text-[#B2BEC3] hover:text-[#636E72] transition-colors border-l border-[#E8E8E6] bg-[#FEFEFE] z-10"
          title={lastUpdate ? `Laatste update: ${lastUpdate.toLocaleTimeString('nl-NL')}` : 'Verversen'}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-strip {
          animation: ticker var(--ticker-duration, 30s) linear infinite;
          will-change: transform;
        }
        .ticker-paused .ticker-strip,
        .ticker-strip.ticker-paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
