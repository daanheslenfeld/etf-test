import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Wifi, WifiOff, AlertCircle, Wallet, PiggyBank, BarChart3 } from 'lucide-react';

const TRADING_API_URL = 'http://localhost:8002';

// Shared cache keys (same as TradingContext for consistency)
const CACHE_KEYS = {
  POSITIONS: 'trading_cache_positions',
  ACCOUNT_SUMMARY: 'trading_cache_accountSummary',
};

// Cache helpers
const saveToCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
};

const loadFromCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function LivePortfolioOverview({ user }) {
  // Portfolio data from backend
  const [positions, setPositions] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [unrealizedPnL, setUnrealizedPnL] = useState(0);
  const [unrealizedPnLPercent, setUnrealizedPnLPercent] = useState(0);

  // Connection state
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercent = (value) => {
    const num = parseFloat(value) || 0;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-Customer-ID': user?.id?.toString() || '0',
      'X-Customer-Email': user?.email || '',
    };
  }, [user]);

  // Check connection to IB Gateway
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        const isConnected = data.ib_gateway?.connected || false;
        setConnected(isConnected);
        return isConnected;
      }
      setConnected(false);
      return false;
    } catch (err) {
      setConnected(false);
      return false;
    }
  }, []);

  // Fetch positions and account summary from backend (single source of truth)
  const fetchData = useCallback(async () => {
    try {
      const [posRes, summaryRes] = await Promise.all([
        fetch(`${TRADING_API_URL}/trading/positions`, { headers: getAuthHeaders() }),
        fetch(`${TRADING_API_URL}/trading/account/summary`, { headers: getAuthHeaders() })
      ]);

      let dataUpdated = false;

      if (posRes.ok) {
        const data = await posRes.json();
        const positionsData = data.positions || [];
        setPositions(positionsData);
        saveToCache(CACHE_KEYS.POSITIONS, positionsData);
        dataUpdated = true;
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        // Use backend values directly - backend is single source of truth
        setPortfolioValue(data.portfolio_value || 0);
        setAvailableFunds(data.available_funds || 0);
        setTotalValue(data.total_value || 0);
        setUnrealizedPnL(data.unrealized_pnl || 0);
        setUnrealizedPnLPercent(data.unrealized_pnl_percent || 0);

        saveToCache(CACHE_KEYS.ACCOUNT_SUMMARY, {
          portfolioValue: data.portfolio_value || 0,
          availableFunds: data.available_funds || 0,
          totalValue: data.total_value || 0,
          unrealizedPnL: data.unrealized_pnl || 0,
          unrealizedPnLPercent: data.unrealized_pnl_percent || 0,
        });
        dataUpdated = true;
      }

      if (dataUpdated) {
        setIsDataStale(false);
        setLastUpdate(Date.now());
        setError(null);
        return true;
      }

      throw new Error('Failed to fetch data');
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      return false;
    }
  }, [getAuthHeaders]);

  // Load from cache (used when backend unavailable)
  const loadCachedData = useCallback(() => {
    const cachedPositions = loadFromCache(CACHE_KEYS.POSITIONS);
    const cachedSummary = loadFromCache(CACHE_KEYS.ACCOUNT_SUMMARY);
    let hasData = false;

    if (cachedPositions?.data) {
      setPositions(cachedPositions.data);
      setLastUpdate(cachedPositions.timestamp);
      hasData = true;
    }

    if (cachedSummary?.data) {
      setPortfolioValue(cachedSummary.data.portfolioValue || 0);
      setAvailableFunds(cachedSummary.data.availableFunds || 0);
      setTotalValue(cachedSummary.data.totalValue || 0);
      setUnrealizedPnL(cachedSummary.data.unrealizedPnL || 0);
      setUnrealizedPnLPercent(cachedSummary.data.unrealizedPnLPercent || 0);
      hasData = true;
    }

    if (hasData) {
      setIsDataStale(true);
    }

    return hasData;
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Load cache first for instant display
    loadCachedData();

    // Check connection
    const isConnected = await checkConnection();

    // Fetch fresh data
    const fetchSuccess = await fetchData();

    // If fetch failed but we have cache, mark as stale
    if (!fetchSuccess) {
      const hasCache = loadCachedData();
      if (!hasCache) {
        setError('Unable to load portfolio data');
      }
    }

    // Mark stale if disconnected
    if (!isConnected) {
      setIsDataStale(true);
    }

    setLoading(false);
  }, [checkConnection, fetchData, loadCachedData]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Polling - continue even when disconnected to detect reconnection
  useEffect(() => {
    const interval = setInterval(async () => {
      const isConnected = await checkConnection();
      if (isConnected) {
        await fetchData();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [checkConnection, fetchData]);

  if (loading && positions.length === 0 && portfolioValue === 0) {
    return (
      <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#28EBCF]"></div>
          <span className="text-gray-400">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  if (error && positions.length === 0 && portfolioValue === 0) {
    return (
      <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button
            onClick={refreshData}
            className="ml-auto px-3 py-1 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Live Portfolio</h2>
          {connected ? (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <Wifi className="w-3 h-3" />
              <span>Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-400 text-xs">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
          {isDataStale && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 border border-orange-600/40 rounded text-xs text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Cached {formatTimeAgo(lastUpdate)}</span>
            </div>
          )}
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards - Using backend values directly (single source of truth) */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-700 bg-gray-800/30">
        {/* Positions Value */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <BarChart3 className="w-3 h-3" />
            Positions Value
          </div>
          <div className="text-lg font-bold text-white">{formatCurrency(portfolioValue)}</div>
        </div>

        {/* Available Cash */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Wallet className="w-3 h-3" />
            Available Cash
          </div>
          <div className={`text-lg font-bold ${availableFunds > 0 ? 'text-green-400' : 'text-white'}`}>
            {formatCurrency(availableFunds)}
          </div>
        </div>

        {/* Total Value = Positions + Cash */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <PiggyBank className="w-3 h-3" />
            Total Value
          </div>
          <div className="text-lg font-bold text-white">{formatCurrency(totalValue)}</div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            {unrealizedPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Unrealized P&L
          </div>
          <div className={`text-lg font-bold flex items-center gap-2 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(unrealizedPnL)}
            <span className="text-sm">({formatPercent(unrealizedPnLPercent)})</span>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left text-gray-400 text-xs font-medium px-4 py-2">Symbol</th>
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Qty</th>
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Avg Cost</th>
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Last Price</th>
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Market Value</th>
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">P&L</th>
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">P&L %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">
                  No positions found
                </td>
              </tr>
            ) : (
              positions.map((position, idx) => {
                // Use backend-provided values directly (single source of truth)
                const qty = parseFloat(position.quantity) || 0;
                const avgCost = parseFloat(position.avg_cost) || 0;
                const lastPrice = parseFloat(position.last_price) || avgCost;
                const marketValue = parseFloat(position.market_value) || 0;
                const pnl = parseFloat(position.unrealized_pnl) || 0;
                const pnlPercent = parseFloat(position.unrealized_pnl_pct) || 0;
                const isPositive = pnl >= 0;
                const isStale = position.price_stale;

                return (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2">
                      <div className="font-medium text-white text-sm">{position.symbol}</div>
                      <div className="text-xs text-gray-500">{position.currency}</div>
                    </td>
                    <td className="px-4 py-2 text-right text-white text-sm">
                      {qty.toFixed(0)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300 text-sm">
                      {formatCurrency(avgCost)}
                    </td>
                    <td className={`px-4 py-2 text-right text-sm ${isStale ? 'text-orange-400' : 'text-white'}`}>
                      {formatCurrency(lastPrice)}
                      {isStale && <span className="text-xs text-gray-600 ml-1">(stale)</span>}
                    </td>
                    <td className="px-4 py-2 text-right text-white font-medium text-sm">
                      {formatCurrency(marketValue)}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(pnl)}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(pnlPercent)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {/* Totals Footer */}
          {positions.length > 0 && (
            <tfoot className="bg-gray-800/50 border-t border-gray-700">
              <tr>
                <td className="px-4 py-2 font-bold text-white text-sm">Positions Total</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-right font-bold text-white text-sm">
                  {formatCurrency(portfolioValue)}
                </td>
                <td className={`px-4 py-2 text-right font-bold text-sm ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(unrealizedPnL)}
                </td>
                <td className={`px-4 py-2 text-right font-bold text-sm ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(unrealizedPnLPercent)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer with last update */}
      {lastUpdate && (
        <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500 text-right">
          Last updated: {new Date(lastUpdate).toLocaleString('nl-NL')}
        </div>
      )}
    </div>
  );
}
