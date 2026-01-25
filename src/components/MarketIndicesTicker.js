import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Globe } from 'lucide-react';
import { isDemoMode, demoApi } from '../demo';

const TRADING_API_URL = 'http://localhost:8002';
const IS_DEMO = isDemoMode();

const formatPrice = (price, currency) => {
  if (!price || price === 0) return '-';

  // Format based on currency
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

export default function MarketIndicesTicker() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchIndices = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getIndices();
        setIndices(data.indices || []);
        setLastUpdate(new Date());
        setError(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${TRADING_API_URL}/trading/indices`);

      if (!response.ok) {
        throw new Error('Failed to fetch indices');
      }

      const data = await response.json();
      setIndices(data.indices || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching indices:', err);
      setError('Kon beurskoersen niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  // Refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

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
    <div className="bg-[#FEFEFE] border-b border-[#E8E8E6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {/* Market icon */}
          <div className="flex items-center gap-2 pr-4 border-r border-[#E8E8E6] shrink-0">
            <Globe className="w-4 h-4 text-[#B2BEC3]" />
            <span className="text-xs text-[#B2BEC3] hidden sm:inline">Beurzen</span>
          </div>

          {/* Index items */}
          <div className="flex items-center gap-4 sm:gap-6 px-4 overflow-x-auto">
            {indices.map((index) => {
              const { text: changeText, color: changeColor } = formatChange(index.change, index.change_percent);
              const isUp = index.change >= 0;

              return (
                <div
                  key={index.symbol}
                  className="flex items-center gap-2 shrink-0"
                >
                  {/* Index name */}
                  <span className="text-xs sm:text-sm font-medium text-[#2D3436]">
                    {index.symbol}
                  </span>

                  {/* Price with percentage */}
                  <span className="text-xs sm:text-sm text-[#636E72]">
                    {formatPrice(index.price, index.currency)}
                  </span>

                  {/* Percentage change */}
                  <span className={`flex items-center gap-0.5 text-xs sm:text-sm ${changeColor}`}>
                    {index.change !== 0 && (
                      isUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )
                    )}
                    {changeText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchIndices}
            className="shrink-0 ml-auto p-1 text-[#B2BEC3] hover:text-[#636E72] transition-colors"
            title={lastUpdate ? `Laatste update: ${lastUpdate.toLocaleTimeString('nl-NL')}` : 'Verversen'}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
