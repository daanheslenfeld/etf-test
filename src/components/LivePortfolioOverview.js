import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Wifi, WifiOff, AlertCircle, Wallet, PiggyBank, BarChart3, ChevronRight } from 'lucide-react';
import ETFDetailsModal from './trading/ETFDetailsModal';

// ETF name lookup
const ETF_NAMES = {
  IWDA: 'iShares Core MSCI World UCITS ETF',
  VWCE: 'Vanguard FTSE All-World UCITS ETF',
  EMIM: 'iShares Core MSCI EM IMI UCITS ETF',
  VUAA: 'Vanguard S&P 500 UCITS ETF',
  SXR8: 'iShares Core S&P 500 UCITS ETF',
  EUNH: 'iShares Core Euro Government Bond',
  IEAC: 'iShares Core EUR Corporate Bond',
  VAGE: 'Vanguard Global Aggregate Bond',
  SGLD: 'Invesco Physical Gold ETC',
  IWDP: 'iShares Developed Markets Property Yield',
  XEON: 'Xtrackers II EUR Overnight Rate Swap',
};

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
  const [selectedEtf, setSelectedEtf] = useState(null);

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

    loadCachedData();
    const isConnected = await checkConnection();
    const fetchSuccess = await fetchData();

    if (!fetchSuccess) {
      const hasCache = loadCachedData();
      if (!hasCache) {
        setError('Unable to load portfolio data');
      }
    }

    if (!isConnected) {
      setIsDataStale(true);
    }

    setLoading(false);
  }, [checkConnection, fetchData, loadCachedData]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Polling
  useEffect(() => {
    const interval = setInterval(async () => {
      const isConnected = await checkConnection();
      if (isConnected) {
        await fetchData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [checkConnection, fetchData]);

  if (loading && positions.length === 0 && portfolioValue === 0) {
    return (
      <div className="bg-white border border-[#E4E8E5] rounded-2xl p-6 shadow-[0_2px_8px_rgba(45,62,54,0.05)]">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#E4E8E5] border-t-[#8AB4A0]"></div>
          <span className="text-[#5F7066]">Portfolio laden...</span>
        </div>
      </div>
    );
  }

  if (error && positions.length === 0 && portfolioValue === 0) {
    return (
      <div className="bg-white border border-[#E4E8E5] rounded-2xl p-6 shadow-[0_2px_8px_rgba(45,62,54,0.05)]">
        <div className="flex items-center gap-3 text-[#5F7066]">
          <AlertCircle className="w-5 h-5 text-[#D4A59A]" />
          <span>Kan portfolio data niet laden</span>
          <button
            onClick={refreshData}
            className="ml-auto px-4 py-2 bg-[#F0F2EE] rounded-lg hover:bg-[#E4E8E5] text-sm font-medium transition-colors"
          >
            Opnieuw
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E4E8E5] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(45,62,54,0.05)]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E4E8E5] flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-semibold text-[#2D3E36]">Live Portfolio</h2>
          {connected ? (
            <span className="flex items-center gap-1.5 text-[#8AB4A0] text-xs font-medium">
              <Wifi className="w-3.5 h-3.5" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#D4C39A] text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              Offline
            </span>
          )}
          {isDataStale && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#F8F5ED] border border-[#D4C39A]/30 rounded-full text-[10px] sm:text-xs text-[#B8A57A]">
              <Clock className="w-3 h-3" />
              Cache {formatTimeAgo(lastUpdate)}
            </span>
          )}
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 text-[#5F7066] hover:text-[#2D3E36] hover:bg-[#F0F2EE] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 border-b border-[#E4E8E5] bg-[#FAFBF9]">
        {/* Positions Value */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E4E8E5]">
          <div className="flex items-center gap-2 text-[#5F7066] text-xs font-medium mb-1 sm:mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="truncate">Belegd</span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-[#2D3E36] tabular-nums">{formatCurrency(portfolioValue)}</div>
        </div>

        {/* Available Cash */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E4E8E5]">
          <div className="flex items-center gap-2 text-[#5F7066] text-xs font-medium mb-1 sm:mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span className="truncate">Beschikbaar</span>
          </div>
          <div className={`text-base sm:text-lg font-semibold tabular-nums ${availableFunds > 0 ? 'text-[#5F8A74]' : 'text-[#2D3E36]'}`}>
            {formatCurrency(availableFunds)}
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E4E8E5]">
          <div className="flex items-center gap-2 text-[#5F7066] text-xs font-medium mb-1 sm:mb-2">
            <PiggyBank className="w-3.5 h-3.5" />
            <span className="truncate">Totaal</span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-[#2D3E36] tabular-nums">{formatCurrency(totalValue)}</div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E4E8E5]">
          <div className="flex items-center gap-2 text-[#5F7066] text-xs font-medium mb-1 sm:mb-2">
            {unrealizedPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="truncate">Rendement</span>
          </div>
          <div className={`text-base sm:text-lg font-semibold tabular-nums ${unrealizedPnL >= 0 ? 'text-[#5F8A74]' : 'text-[#B8847A]'}`}>
            {formatCurrency(unrealizedPnL)}
            <span className="text-xs sm:text-sm ml-1">({formatPercent(unrealizedPnLPercent)})</span>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden p-4 space-y-3">
        {positions.length === 0 ? (
          <div className="text-center text-[#95A39A] py-10">
            Geen posities gevonden
          </div>
        ) : (
          positions.map((position, idx) => {
            const qty = parseFloat(position.quantity) || 0;
            const marketValue = parseFloat(position.market_value) || 0;
            const pnl = parseFloat(position.unrealized_pnl) || 0;
            const pnlPercent = parseFloat(position.unrealized_pnl_pct) || 0;
            const isPositive = pnl >= 0;
            const etfName = position.name || ETF_NAMES[position.symbol] || position.symbol;

            return (
              <button
                key={idx}
                onClick={() => setSelectedEtf(position.symbol)}
                className="w-full bg-[#F5F6F4] rounded-xl p-4 text-left active:bg-[#ECEEED] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium text-[#2D3E36] text-sm truncate">{etfName}</div>
                    <div className="text-xs text-[#95A39A]">{position.symbol} • {qty} stuks</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#95A39A] flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-[#2D3E36] tabular-nums">
                    {formatCurrency(marketValue)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[#5F8A74]' : 'text-[#B8847A]'}`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span className="tabular-nums">{formatPercent(pnlPercent)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Desktop Positions Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FAFBF9]">
            <tr>
              <th className="text-left text-[#5F7066] text-xs font-medium px-5 py-3">ETF</th>
              <th className="text-right text-[#5F7066] text-xs font-medium px-5 py-3">Aantal</th>
              <th className="text-right text-[#5F7066] text-xs font-medium px-5 py-3 hidden md:table-cell">Gem. Koers</th>
              <th className="text-right text-[#5F7066] text-xs font-medium px-5 py-3">Huidige Koers</th>
              <th className="text-right text-[#5F7066] text-xs font-medium px-5 py-3">Waarde</th>
              <th className="text-right text-[#5F7066] text-xs font-medium px-5 py-3 hidden lg:table-cell">W/V</th>
              <th className="text-right text-[#5F7066] text-xs font-medium px-5 py-3">W/V %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8E5]">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-[#95A39A] py-10">
                  Geen posities gevonden
                </td>
              </tr>
            ) : (
              positions.map((position, idx) => {
                const qty = parseFloat(position.quantity) || 0;
                const avgCost = parseFloat(position.avg_cost) || 0;
                const lastPrice = parseFloat(position.last_price) || avgCost;
                const marketValue = parseFloat(position.market_value) || 0;
                const pnl = parseFloat(position.unrealized_pnl) || 0;
                const pnlPercent = parseFloat(position.unrealized_pnl_pct) || 0;
                const isPositive = pnl >= 0;
                const isStale = position.price_stale;
                const etfName = position.name || ETF_NAMES[position.symbol] || position.symbol;

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedEtf(position.symbol)}
                    className="hover:bg-[#FAFBF9] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#2D3E36] text-sm truncate max-w-[200px]" title={etfName}>{etfName}</div>
                      <div className="text-xs text-[#95A39A]">{position.symbol}</div>
                    </td>
                    <td className="px-5 py-4 text-right text-[#2D3E36] text-sm tabular-nums">
                      {qty.toFixed(0)}
                    </td>
                    <td className="px-5 py-4 text-right text-[#5F7066] text-sm hidden md:table-cell tabular-nums">
                      {formatCurrency(avgCost)}
                    </td>
                    <td className={`px-5 py-4 text-right text-sm tabular-nums ${isStale ? 'text-[#D4C39A]' : 'text-[#2D3E36]'}`}>
                      {formatCurrency(lastPrice)}
                      {isStale && <span className="text-xs text-[#95A39A] ml-1">(vertraagd)</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-[#2D3E36] font-medium text-sm tabular-nums">
                      {formatCurrency(marketValue)}
                    </td>
                    <td className={`px-5 py-4 text-right font-medium text-sm hidden lg:table-cell tabular-nums ${isPositive ? 'text-[#5F8A74]' : 'text-[#B8847A]'}`}>
                      {formatCurrency(pnl)}
                    </td>
                    <td className={`px-5 py-4 text-right font-medium text-sm tabular-nums ${isPositive ? 'text-[#5F8A74]' : 'text-[#B8847A]'}`}>
                      {formatPercent(pnlPercent)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {/* Totals Footer */}
          {positions.length > 0 && (
            <tfoot className="bg-[#FAFBF9] border-t border-[#E4E8E5]">
              <tr>
                <td className="px-5 py-4 font-semibold text-[#2D3E36] text-sm">Totaal Posities</td>
                <td className="px-5 py-4"></td>
                <td className="px-5 py-4 hidden md:table-cell"></td>
                <td className="px-5 py-4"></td>
                <td className="px-5 py-4 text-right font-semibold text-[#2D3E36] text-sm tabular-nums">
                  {formatCurrency(portfolioValue)}
                </td>
                <td className={`px-5 py-4 text-right font-semibold text-sm hidden lg:table-cell tabular-nums ${unrealizedPnL >= 0 ? 'text-[#5F8A74]' : 'text-[#B8847A]'}`}>
                  {formatCurrency(unrealizedPnL)}
                </td>
                <td className={`px-5 py-4 text-right font-semibold text-sm tabular-nums ${unrealizedPnL >= 0 ? 'text-[#5F8A74]' : 'text-[#B8847A]'}`}>
                  {formatPercent(unrealizedPnLPercent)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer with last update */}
      {lastUpdate && (
        <div className="px-5 py-3 border-t border-[#E4E8E5] text-xs text-[#95A39A] text-right">
          Laatst bijgewerkt: {new Date(lastUpdate).toLocaleString('nl-NL')}
        </div>
      )}

      {/* ETF Details Modal */}
      <ETFDetailsModal
        symbol={selectedEtf}
        isOpen={!!selectedEtf}
        onClose={() => setSelectedEtf(null)}
      />
    </div>
  );
}
