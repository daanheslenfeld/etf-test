import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Wifi, WifiOff, AlertCircle } from 'lucide-react';

const TRADING_API_URL = 'http://localhost:8002';

// Cache keys
const CACHE_KEYS = {
  POSITIONS: 'portal_cache_positions',
  MARKET_DATA: 'portal_cache_marketData',
  ACCOUNT_SUMMARY: 'portal_cache_accountSummary',
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
  const [positions, setPositions] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [cashBalance, setCashBalance] = useState(0);
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

  // Fetch positions from trading API
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/positions`, {
        headers: {
          'X-Customer-ID': user?.id?.toString() || '0',
          'X-Customer-Email': user?.email || '',
        }
      });

      if (res.ok) {
        const data = await res.json();
        const positionsData = data.positions || [];
        setPositions(positionsData);
        setIsDataStale(false);
        setLastUpdate(Date.now());
        saveToCache(CACHE_KEYS.POSITIONS, positionsData);
        return true;
      }
      throw new Error('Failed to fetch positions');
    } catch (err) {
      console.error('Error fetching positions:', err);
      // Load from cache
      const cached = loadFromCache(CACHE_KEYS.POSITIONS);
      if (cached?.data) {
        setPositions(cached.data);
        setLastUpdate(cached.timestamp);
        setIsDataStale(true);
      }
      return false;
    }
  }, [user]);

  // Fetch account summary for cash balance
  const fetchAccountSummary = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/account/summary`, {
        headers: {
          'X-Customer-ID': user?.id?.toString() || '0',
          'X-Customer-Email': user?.email || '',
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cash_balance !== undefined) {
          setCashBalance(data.cash_balance);
          saveToCache(CACHE_KEYS.ACCOUNT_SUMMARY, { cashBalance: data.cash_balance });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error fetching account summary:', err);
      const cached = loadFromCache(CACHE_KEYS.ACCOUNT_SUMMARY);
      if (cached?.data?.cashBalance !== undefined) {
        setCashBalance(cached.data.cashBalance);
      }
      return false;
    }
  }, [user]);

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/marketdata`, {
        headers: {
          'X-Customer-ID': user?.id?.toString() || '0',
          'X-Customer-Email': user?.email || '',
        }
      });

      if (res.ok) {
        const data = await res.json();
        const marketDataBySymbol = {};
        (data.data || []).forEach(item => {
          marketDataBySymbol[item.symbol] = {
            bid: item.bid,
            ask: item.ask,
            last: item.last,
            midPrice: item.midPrice,
            timestamp: item.timestamp,
          };
        });
        setMarketData(marketDataBySymbol);
        saveToCache(CACHE_KEYS.MARKET_DATA, marketDataBySymbol);
        return true;
      }
      throw new Error('Failed to fetch market data');
    } catch (err) {
      console.error('Error fetching market data:', err);
      const cached = loadFromCache(CACHE_KEYS.MARKET_DATA);
      if (cached?.data) {
        setMarketData(cached.data);
      }
      return false;
    }
  }, [user]);

  // Check connection
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setConnected(data.ib_gateway?.connected || false);
        return data.ib_gateway?.connected || false;
      }
      setConnected(false);
      return false;
    } catch (err) {
      setConnected(false);
      return false;
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Load cache first for instant display
    const cachedPositions = loadFromCache(CACHE_KEYS.POSITIONS);
    const cachedMarketData = loadFromCache(CACHE_KEYS.MARKET_DATA);
    const cachedSummary = loadFromCache(CACHE_KEYS.ACCOUNT_SUMMARY);

    if (cachedPositions?.data) {
      setPositions(cachedPositions.data);
      setLastUpdate(cachedPositions.timestamp);
    }
    if (cachedMarketData?.data) {
      setMarketData(cachedMarketData.data);
    }
    if (cachedSummary?.data?.cashBalance !== undefined) {
      setCashBalance(cachedSummary.data.cashBalance);
    }

    const isConnected = await checkConnection();
    const posSuccess = await fetchPositions();
    await fetchMarketData();
    await fetchAccountSummary();

    if (!posSuccess && !cachedPositions?.data) {
      setError('Unable to load portfolio data');
    }

    if (!isConnected && (cachedPositions?.data || cachedMarketData?.data)) {
      setIsDataStale(true);
    }

    setLoading(false);
  }, [checkConnection, fetchPositions, fetchMarketData, fetchAccountSummary]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Polling
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
      fetchPositions();
      fetchMarketData();
      fetchAccountSummary();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [checkConnection, fetchPositions, fetchMarketData, fetchAccountSummary]);

  // Calculate position value using market data
  const getPositionValue = (position) => {
    const md = marketData[position.symbol];
    const qty = parseFloat(position.quantity) || 0;

    if (md?.last) {
      return qty * md.last;
    }
    // Fallback to market_value from positions
    return parseFloat(position.market_value) || 0;
  };

  // Calculate P&L
  const calculatePnL = (position) => {
    const avgCost = parseFloat(position.avg_cost) || 0;
    const qty = parseFloat(position.quantity) || 0;
    const totalCost = avgCost * qty;
    const currentValue = getPositionValue(position);
    return currentValue - totalCost;
  };

  const calculatePnLPercent = (position) => {
    const avgCost = parseFloat(position.avg_cost) || 0;
    const qty = parseFloat(position.quantity) || 0;
    const totalCost = avgCost * qty;
    if (totalCost === 0) return 0;
    const pnl = calculatePnL(position);
    return (pnl / totalCost) * 100;
  };

  // Totals
  const totalMarketValue = positions.reduce((sum, p) => sum + getPositionValue(p), 0);
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + calculatePnL(p), 0);
  const totalPortfolioValue = totalMarketValue + cashBalance;

  if (loading && positions.length === 0) {
    return (
      <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#28EBCF]"></div>
          <span className="text-gray-400">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  if (error && positions.length === 0) {
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-700">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Portfolio Value</div>
          <div className="text-lg font-bold text-white">{formatCurrency(totalPortfolioValue)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Cash Balance</div>
          <div className="text-lg font-bold text-white">{formatCurrency(cashBalance)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Unrealized P&L</div>
          <div className={`text-lg font-bold flex items-center gap-1 ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalUnrealizedPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatCurrency(totalUnrealizedPnL)}
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
              <th className="text-right text-gray-400 text-xs font-medium px-4 py-2">Value</th>
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
                const pnl = calculatePnL(position);
                const pnlPercent = calculatePnLPercent(position);
                const isPositive = pnl >= 0;
                const md = marketData[position.symbol];
                const lastPrice = md?.last || parseFloat(position.avg_cost) || 0;

                return (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2">
                      <div className="font-medium text-white text-sm">{position.symbol}</div>
                      <div className="text-xs text-gray-500">{position.currency}</div>
                    </td>
                    <td className="px-4 py-2 text-right text-white text-sm">
                      {parseFloat(position.quantity).toFixed(0)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300 text-sm">
                      {formatCurrency(position.avg_cost)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      <span className={md?.last ? 'text-white' : 'text-gray-500'}>
                        {formatCurrency(lastPrice)}
                      </span>
                      {!md?.last && <span className="text-xs text-gray-600 ml-1">(est)</span>}
                    </td>
                    <td className="px-4 py-2 text-right text-white font-medium text-sm">
                      {formatCurrency(getPositionValue(position))}
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
