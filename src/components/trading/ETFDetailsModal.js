import React, { useState, useEffect } from 'react';
import { X, Building2, Globe, PieChart, TrendingUp, TrendingDown, Loader2, AlertCircle, Info, DollarSign, Percent } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Cache for holdings data
const holdingsCache = {};

// ETF metadata (static info not available from IB)
const ETF_METADATA = {
  IWDA: {
    name: 'iShares Core MSCI World UCITS ETF',
    isin: 'IE00B4L5Y983',
    provider: 'iShares (BlackRock)',
    ter: 0.20,
    currency: 'EUR',
    index: 'MSCI World',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  VUSA: {
    name: 'Vanguard S&P 500 UCITS ETF',
    isin: 'IE00B3XXRP09',
    provider: 'Vanguard',
    ter: 0.07,
    currency: 'EUR',
    index: 'S&P 500',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  VWCE: {
    name: 'Vanguard FTSE All-World UCITS ETF (Acc)',
    isin: 'IE00BK5BQT80',
    provider: 'Vanguard',
    ter: 0.22,
    currency: 'EUR',
    index: 'FTSE All-World',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  CSPX: {
    name: 'iShares Core S&P 500 UCITS ETF',
    isin: 'IE00B5BMR087',
    provider: 'iShares (BlackRock)',
    ter: 0.07,
    currency: 'USD',
    index: 'S&P 500',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  IUSA: {
    name: 'iShares S&P 500 UCITS ETF',
    isin: 'IE0031442068',
    provider: 'iShares (BlackRock)',
    ter: 0.07,
    currency: 'USD',
    index: 'S&P 500',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  VWRL: {
    name: 'Vanguard FTSE All-World UCITS ETF',
    isin: 'IE00B3RBWM25',
    provider: 'Vanguard',
    ter: 0.22,
    currency: 'USD',
    index: 'FTSE All-World',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  IEMM: {
    name: 'iShares MSCI EM UCITS ETF',
    isin: 'IE00B0M63177',
    provider: 'iShares (BlackRock)',
    ter: 0.18,
    currency: 'USD',
    index: 'MSCI Emerging Markets',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  },
  EMIM: {
    name: 'iShares Core MSCI EM IMI UCITS ETF',
    isin: 'IE00BKM4GZ66',
    provider: 'iShares (BlackRock)',
    ter: 0.18,
    currency: 'USD',
    index: 'MSCI Emerging Markets IMI',
    assetClass: 'Equity',
    domicile: 'Ireland',
    replication: 'Physical'
  }
};

// Sector colors
const SECTOR_COLORS = {
  'Technology': 'bg-blue-500',
  'Consumer Discretionary': 'bg-purple-500',
  'Communication Services': 'bg-pink-500',
  'Financials': 'bg-green-500',
  'Healthcare': 'bg-red-500',
  'Energy': 'bg-yellow-500',
  'Industrials': 'bg-orange-500',
  'Materials': 'bg-teal-500',
  'Utilities': 'bg-cyan-500',
  'Real Estate': 'bg-indigo-500',
  'Consumer Staples': 'bg-lime-500',
};

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2 bg-gray-800/30 rounded">
          <div className="w-6 h-6 bg-gray-700 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
          </div>
          <div className="w-16 h-4 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ETFDetailsModal({ symbol, isOpen, onClose }) {
  const { marketData } = useTrading();
  const [holdings, setHoldings] = useState(null);
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [error, setError] = useState(null);

  const metadata = ETF_METADATA[symbol] || null;
  const liveMarketData = marketData?.[symbol] || null;

  // Fetch holdings data
  useEffect(() => {
    if (!isOpen || !symbol) return;

    if (holdingsCache[symbol]) {
      setHoldings(holdingsCache[symbol]);
      return;
    }

    const fetchHoldings = async () => {
      setLoadingHoldings(true);
      setError(null);

      try {
        const res = await fetch(`${TRADING_API_URL}/etfs/${symbol}/holdings`);
        const data = await res.json();

        if (data.available) {
          holdingsCache[symbol] = data;
          setHoldings(data);
        } else {
          setHoldings(null);
        }
      } catch (err) {
        setError('Failed to load holdings');
      } finally {
        setLoadingHoldings(false);
      }
    };

    fetchHoldings();
  }, [isOpen, symbol]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatCurrency = (value, currency = 'EUR') => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency }).format(value);
  };

  const spread = liveMarketData?.ask && liveMarketData?.bid
    ? (liveMarketData.ask - liveMarketData.bid).toFixed(3)
    : null;

  const getSectorColor = (sector) => SECTOR_COLORS[sector] || 'bg-gray-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1B1F] border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {symbol}
              <span className="text-base font-normal text-gray-400">- ETF Details</span>
            </h2>
            {metadata && (
              <p className="text-sm text-gray-400 mt-0.5">{metadata.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* General Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  General Information
                </h3>
                {metadata ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Symbol</span>
                      <span className="text-white font-mono">{symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ISIN</span>
                      <span className="text-white font-mono">{metadata.isin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Provider</span>
                      <span className="text-white">{metadata.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Index</span>
                      <span className="text-white">{metadata.index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">TER</span>
                      <span className="text-[#28EBCF] font-medium">{metadata.ter.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency</span>
                      <span className="text-white">{metadata.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Domicile</span>
                      <span className="text-white">{metadata.domicile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Replication</span>
                      <span className="text-white">{metadata.replication}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Metadata not available</p>
                )}
              </div>

              {/* Market Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Market Data
                </h3>
                {liveMarketData ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Price</span>
                      <span className="text-white font-medium">
                        {formatCurrency(liveMarketData.last, metadata?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bid</span>
                      <span className="text-green-400">
                        {formatCurrency(liveMarketData.bid, metadata?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ask</span>
                      <span className="text-red-400">
                        {formatCurrency(liveMarketData.ask, metadata?.currency)}
                      </span>
                    </div>
                    {spread && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Spread</span>
                        <span className="text-yellow-400">{spread}</span>
                      </div>
                    )}
                    {liveMarketData.volume && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Volume</span>
                        <span className="text-white">{liveMarketData.volume.toLocaleString()}</span>
                      </div>
                    )}
                    {liveMarketData.delayed && (
                      <div className="text-xs text-yellow-400 mt-2">* Delayed data</div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Market data unavailable</p>
                )}
              </div>

              {/* Asset Allocation */}
              {metadata && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Asset Class
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-blue-500 rounded-full" />
                    <span className="text-white text-sm">{metadata.assetClass} 100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Holdings */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Top 10 Holdings
                {holdings && (
                  <span className="ml-auto text-[#28EBCF]">{holdings.top_10_weight}% of fund</span>
                )}
              </h3>

              {loadingHoldings && <LoadingSkeleton />}

              {error && (
                <div className="flex flex-col items-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>{error}</p>
                </div>
              )}

              {!loadingHoldings && !error && !holdings && (
                <div className="flex flex-col items-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>Look-through data coming soon</p>
                </div>
              )}

              {!loadingHoldings && holdings && (
                <div className="space-y-2">
                  {holdings.holdings.map((holding, idx) => (
                    <div key={idx} className="group">
                      <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-700/30 transition-colors">
                        <span className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400 font-mono">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">{holding.name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {holding.sector}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {holding.country}
                            </span>
                          </div>
                        </div>
                        <span className="text-white font-medium text-sm">
                          {holding.weight_percent.toFixed(2)}%
                        </span>
                      </div>
                      {/* Weight bar */}
                      <div className="h-1 mx-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getSectorColor(holding.sector)} transition-all`}
                          style={{ width: `${Math.min(holding.weight_percent * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {holdings && (
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                  Total holdings: {holdings.total_holdings?.toLocaleString()} | Updated: {holdings.last_updated}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
