import React, { useState, useEffect } from 'react';
import { X, Eye, Building2, Globe, PieChart, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Cache for holdings data
const holdingsCache = {};

// Sector colors for visual distinction - Premium banking palette
const SECTOR_COLORS = {
  'Technology': 'bg-[#5B8A9A]',
  'Consumer Discretionary': 'bg-[#8B7B9A]',
  'Communication Services': 'bg-[#C0736D]',
  'Financials': 'bg-[#7C9885]',
  'Healthcare': 'bg-[#C9A962]',
  'Energy': 'bg-[#B8956B]',
  'Industrials': 'bg-[#6B8A74]',
  'Materials': 'bg-[#6B7B8A]',
  'Utilities': 'bg-[#5A9A8A]',
  'Real Estate': 'bg-[#7A8B9A]',
  'Consumer Staples': 'bg-[#8A9A7B]',
};

// Loading skeleton component
function HoldingsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-[#F5F6F4] rounded-lg">
          <div className="w-8 h-8 bg-[#ECEEED] rounded" />
          <div className="flex-1">
            <div className="h-4 bg-[#ECEEED] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#ECEEED] rounded w-1/2" />
          </div>
          <div className="w-20 h-4 bg-[#ECEEED] rounded" />
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
        const res = await fetch(`${TRADING_API_URL}/etfs/${symbol}/holdings`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
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

  const getSectorColor = (sector) => SECTOR_COLORS[sector] || 'bg-[#B2BEC3]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-[0_8px_32px_rgba(45,52,54,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8E8E6]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7C9885]/10 rounded-lg">
              <Eye className="w-5 h-5 text-[#7C9885]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
                {symbol}
                <span className="text-sm font-normal text-[#636E72]">Look-Through</span>
              </h2>
              {holdings && (
                <p className="text-sm text-[#636E72]">{holdings.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading && <HoldingsSkeleton />}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-[#636E72]">
              <AlertCircle className="w-12 h-12 mb-4 text-[#C0736D]" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && holdings && (
            <>
              {/* ETF Info */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#F5F6F4] rounded-lg p-3">
                  <div className="text-xs text-[#B2BEC3] mb-1">Index</div>
                  <div className="text-[#2D3436] font-medium">{holdings.index}</div>
                </div>
                <div className="bg-[#F5F6F4] rounded-lg p-3">
                  <div className="text-xs text-[#B2BEC3] mb-1">Issuer</div>
                  <div className="text-[#2D3436] font-medium">{holdings.issuer}</div>
                </div>
                <div className="bg-[#F5F6F4] rounded-lg p-3">
                  <div className="text-xs text-[#B2BEC3] mb-1">Total Holdings</div>
                  <div className="text-[#2D3436] font-medium">{holdings.total_holdings?.toLocaleString()}</div>
                </div>
              </div>

              {/* Top 10 Summary */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#2D3436] font-medium">Top 10 Holdings</h3>
                <div className="flex items-center gap-2 text-sm">
                  <PieChart className="w-4 h-4 text-[#7C9885]" />
                  <span className="text-[#7C9885] font-medium">{holdings.top_10_weight}%</span>
                  <span className="text-[#636E72]">of fund</span>
                </div>
              </div>

              {/* Holdings List */}
              <div className="space-y-2">
                {holdings.holdings.map((holding, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F5F6F4] hover:bg-[#ECEEED] rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-6 h-6 bg-[#ECEEED] rounded flex items-center justify-center text-xs text-[#636E72] font-mono">
                        {idx + 1}
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#2D3436] font-medium truncate">
                            {holding.name}
                          </span>
                          {holding.ticker && (
                            <span className="text-xs text-[#B2BEC3] font-mono">
                              {holding.ticker}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#636E72] mt-1">
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
                        <div className="text-[#2D3436] font-medium">
                          {holding.weight_percent.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Weight Bar */}
                    <div className="mt-2 h-1.5 bg-[#ECEEED] rounded-full overflow-hidden">
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
          <div className="p-4 border-t border-[#E8E8E6] bg-[#F5F6F4]">
            <div className="flex items-center justify-between text-xs text-[#636E72]">
              <span>ISIN: {holdings.isin}</span>
              <span>Last updated: {holdings.last_updated}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
