import React, { useState, useEffect } from 'react';
import { X, Eye, Building2, Globe, PieChart, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Cache for holdings data
const holdingsCache = {};

// Sector colors for visual distinction
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

// Loading skeleton component
function HoldingsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg">
          <div className="w-8 h-8 bg-gray-700 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
          </div>
          <div className="w-20 h-4 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function HoldingsModal({ symbol, isOpen, onClose }) {
  const [holdings, setHoldings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    // Check cache first
    if (holdingsCache[symbol]) {
      setHoldings(holdingsCache[symbol]);
      setLoading(false);
      return;
    }

    const fetchHoldings = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${TRADING_API_URL}/etfs/${symbol}/holdings`);
        const data = await res.json();

        if (data.available) {
          holdingsCache[symbol] = data;
          setHoldings(data);
        } else {
          setError(data.message || 'Holdings data not available');
        }
      } catch (err) {
        setError('Failed to load holdings data');
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  const getSectorColor = (sector) => SECTOR_COLORS[sector] || 'bg-gray-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1B1F] border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#28EBCF]/20 rounded-lg">
              <Eye className="w-5 h-5 text-[#28EBCF]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {symbol}
                <span className="text-sm font-normal text-gray-400">Look-Through</span>
              </h2>
              {holdings && (
                <p className="text-sm text-gray-400">{holdings.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading && <HoldingsSkeleton />}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-600" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && holdings && (
            <>
              {/* ETF Info */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Index</div>
                  <div className="text-white font-medium">{holdings.index}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Issuer</div>
                  <div className="text-white font-medium">{holdings.issuer}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Total Holdings</div>
                  <div className="text-white font-medium">{holdings.total_holdings?.toLocaleString()}</div>
                </div>
              </div>

              {/* Top 10 Summary */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Top 10 Holdings</h3>
                <div className="flex items-center gap-2 text-sm">
                  <PieChart className="w-4 h-4 text-[#28EBCF]" />
                  <span className="text-[#28EBCF] font-medium">{holdings.top_10_weight}%</span>
                  <span className="text-gray-400">of fund</span>
                </div>
              </div>

              {/* Holdings List */}
              <div className="space-y-2">
                {holdings.holdings.map((holding, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/30 hover:bg-gray-800/50 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400 font-mono">
                        {idx + 1}
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">
                            {holding.name}
                          </span>
                          {holding.ticker && (
                            <span className="text-xs text-gray-500 font-mono">
                              {holding.ticker}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
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

                      {/* Weight */}
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {holding.weight_percent.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Weight Bar */}
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getSectorColor(holding.sector)} transition-all duration-500`}
                        style={{ width: `${Math.min(holding.weight_percent * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {holdings && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>ISIN: {holdings.isin}</span>
              <span>Last updated: {holdings.last_updated}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
