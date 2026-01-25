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

// Demo holdings data for when API is unavailable
const DEMO_HOLDINGS = {
  IWDA: {
    holdings: [
      { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology', country: 'US', weight_percent: 4.82 },
      { name: 'Microsoft Corp.', ticker: 'MSFT', sector: 'Technology', country: 'US', weight_percent: 4.45 },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Technology', country: 'US', weight_percent: 3.89 },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', sector: 'Consumer Discretionary', country: 'US', weight_percent: 2.65 },
      { name: 'Alphabet Inc. Class A', ticker: 'GOOGL', sector: 'Communication Services', country: 'US', weight_percent: 1.92 },
      { name: 'Meta Platforms Inc.', ticker: 'META', sector: 'Communication Services', country: 'US', weight_percent: 1.78 },
      { name: 'Tesla Inc.', ticker: 'TSLA', sector: 'Consumer Discretionary', country: 'US', weight_percent: 1.42 },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', sector: 'Financials', country: 'US', weight_percent: 1.18 },
      { name: 'JPMorgan Chase & Co.', ticker: 'JPM', sector: 'Financials', country: 'US', weight_percent: 1.05 },
      { name: 'UnitedHealth Group', ticker: 'UNH', sector: 'Healthcare', country: 'US', weight_percent: 0.98 },
    ],
    top_10_weight: 24.14,
    total_holdings: 1512,
    last_updated: '2026-01-24',
    is_demo: true
  },
  VWCE: {
    holdings: [
      { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology', country: 'US', weight_percent: 4.15 },
      { name: 'Microsoft Corp.', ticker: 'MSFT', sector: 'Technology', country: 'US', weight_percent: 3.82 },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Technology', country: 'US', weight_percent: 3.24 },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', sector: 'Consumer Discretionary', country: 'US', weight_percent: 2.28 },
      { name: 'Alphabet Inc. Class A', ticker: 'GOOGL', sector: 'Communication Services', country: 'US', weight_percent: 1.65 },
      { name: 'Meta Platforms Inc.', ticker: 'META', sector: 'Communication Services', country: 'US', weight_percent: 1.52 },
      { name: 'Tesla Inc.', ticker: 'TSLA', sector: 'Consumer Discretionary', country: 'US', weight_percent: 1.22 },
      { name: 'Taiwan Semiconductor', ticker: 'TSM', sector: 'Technology', country: 'TW', weight_percent: 1.15 },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', sector: 'Financials', country: 'US', weight_percent: 1.02 },
      { name: 'JPMorgan Chase & Co.', ticker: 'JPM', sector: 'Financials', country: 'US', weight_percent: 0.92 },
    ],
    top_10_weight: 20.97,
    total_holdings: 3642,
    last_updated: '2026-01-24',
    is_demo: true
  },
  EMIM: {
    holdings: [
      { name: 'Taiwan Semiconductor', ticker: 'TSM', sector: 'Technology', country: 'TW', weight_percent: 7.85 },
      { name: 'Tencent Holdings', ticker: '0700', sector: 'Communication Services', country: 'CN', weight_percent: 4.12 },
      { name: 'Samsung Electronics', ticker: '005930', sector: 'Technology', country: 'KR', weight_percent: 3.95 },
      { name: 'Alibaba Group', ticker: 'BABA', sector: 'Consumer Discretionary', country: 'CN', weight_percent: 2.48 },
      { name: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Energy', country: 'IN', weight_percent: 1.62 },
      { name: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Financials', country: 'IN', weight_percent: 1.25 },
      { name: 'Infosys Ltd.', ticker: 'INFY', sector: 'Technology', country: 'IN', weight_percent: 1.18 },
      { name: 'China Construction Bank', ticker: '0939', sector: 'Financials', country: 'CN', weight_percent: 1.05 },
      { name: 'Meituan', ticker: '3690', sector: 'Consumer Discretionary', country: 'CN', weight_percent: 0.98 },
      { name: 'SK Hynix Inc.', ticker: '000660', sector: 'Technology', country: 'KR', weight_percent: 0.92 },
    ],
    top_10_weight: 25.40,
    total_holdings: 3178,
    last_updated: '2026-01-24',
    is_demo: true
  },
  VUAA: {
    holdings: [
      { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology', country: 'US', weight_percent: 7.12 },
      { name: 'Microsoft Corp.', ticker: 'MSFT', sector: 'Technology', country: 'US', weight_percent: 6.58 },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Technology', country: 'US', weight_percent: 5.85 },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', sector: 'Consumer Discretionary', country: 'US', weight_percent: 3.92 },
      { name: 'Alphabet Inc. Class A', ticker: 'GOOGL', sector: 'Communication Services', country: 'US', weight_percent: 2.45 },
      { name: 'Meta Platforms Inc.', ticker: 'META', sector: 'Communication Services', country: 'US', weight_percent: 2.38 },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', sector: 'Financials', country: 'US', weight_percent: 1.85 },
      { name: 'Tesla Inc.', ticker: 'TSLA', sector: 'Consumer Discretionary', country: 'US', weight_percent: 1.72 },
      { name: 'UnitedHealth Group', ticker: 'UNH', sector: 'Healthcare', country: 'US', weight_percent: 1.42 },
      { name: 'JPMorgan Chase & Co.', ticker: 'JPM', sector: 'Financials', country: 'US', weight_percent: 1.38 },
    ],
    top_10_weight: 34.67,
    total_holdings: 503,
    last_updated: '2026-01-24',
    is_demo: true
  },
  EUNH: {
    holdings: [
      { name: 'Germany 0% 2026', ticker: 'DE0001102578', sector: 'Government Bond', country: 'DE', weight_percent: 8.45 },
      { name: 'France OAT 0.5% 2029', ticker: 'FR0013286192', sector: 'Government Bond', country: 'FR', weight_percent: 7.82 },
      { name: 'Italy BTP 1.5% 2028', ticker: 'IT0005340929', sector: 'Government Bond', country: 'IT', weight_percent: 6.15 },
      { name: 'Spain 1.45% 2027', ticker: 'ES0000012B88', sector: 'Government Bond', country: 'ES', weight_percent: 5.42 },
      { name: 'Germany 0.25% 2029', ticker: 'DE0001102481', sector: 'Government Bond', country: 'DE', weight_percent: 4.85 },
      { name: 'France OAT 1% 2027', ticker: 'FR0013250578', sector: 'Government Bond', country: 'FR', weight_percent: 4.28 },
      { name: 'Netherlands 0.5% 2028', ticker: 'NL0012650469', sector: 'Government Bond', country: 'NL', weight_percent: 3.65 },
      { name: 'Belgium 0.8% 2028', ticker: 'BE0000346552', sector: 'Government Bond', country: 'BE', weight_percent: 3.12 },
      { name: 'Austria 0.75% 2028', ticker: 'AT0000A1XML2', sector: 'Government Bond', country: 'AT', weight_percent: 2.85 },
      { name: 'Finland 0.5% 2029', ticker: 'FI4000369467', sector: 'Government Bond', country: 'FI', weight_percent: 2.42 },
    ],
    top_10_weight: 49.01,
    total_holdings: 356,
    last_updated: '2026-01-24',
    is_demo: true
  },
  SGLD: {
    holdings: [
      { name: 'Physical Gold Bullion', ticker: 'XAU', sector: 'Precious Metal', country: 'Global', weight_percent: 100.00 },
    ],
    top_10_weight: 100.00,
    total_holdings: 1,
    last_updated: '2026-01-24',
    is_demo: true
  }
};

// Default demo holdings for unknown ETFs
const DEFAULT_DEMO_HOLDINGS = {
  holdings: [
    { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology', country: 'US', weight_percent: 5.25 },
    { name: 'Microsoft Corp.', ticker: 'MSFT', sector: 'Technology', country: 'US', weight_percent: 4.85 },
    { name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Technology', country: 'US', weight_percent: 4.12 },
    { name: 'Amazon.com Inc.', ticker: 'AMZN', sector: 'Consumer Discretionary', country: 'US', weight_percent: 2.95 },
    { name: 'Alphabet Inc.', ticker: 'GOOGL', sector: 'Communication Services', country: 'US', weight_percent: 2.15 },
    { name: 'Meta Platforms', ticker: 'META', sector: 'Communication Services', country: 'US', weight_percent: 1.85 },
    { name: 'Tesla Inc.', ticker: 'TSLA', sector: 'Consumer Discretionary', country: 'US', weight_percent: 1.52 },
    { name: 'Berkshire Hathaway', ticker: 'BRK.B', sector: 'Financials', country: 'US', weight_percent: 1.28 },
    { name: 'JPMorgan Chase', ticker: 'JPM', sector: 'Financials', country: 'US', weight_percent: 1.15 },
    { name: 'Visa Inc.', ticker: 'V', sector: 'Financials', country: 'US', weight_percent: 1.02 },
  ],
  top_10_weight: 26.14,
  total_holdings: 1000,
  last_updated: '2026-01-24',
  is_demo: true
};

// Sector colors - Premium banking palette
const SECTOR_COLORS = {
  'Technology': 'bg-[#6B7B8A]',
  'Consumer Discretionary': 'bg-[#8B7B9A]',
  'Communication Services': 'bg-[#9A7B8B]',
  'Financials': 'bg-[#7C9885]',
  'Healthcare': 'bg-[#C0736D]',
  'Energy': 'bg-[#C9A962]',
  'Industrials': 'bg-[#B8956B]',
  'Materials': 'bg-[#7B9A8B]',
  'Utilities': 'bg-[#7B8A9A]',
  'Real Estate': 'bg-[#8A7B9A]',
  'Consumer Staples': 'bg-[#8B9A7B]',
  'Government Bond': 'bg-[#6B8A9A]',
  'Precious Metal': 'bg-[#C9A962]',
};

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2 bg-[#F5F6F4] rounded">
          <div className="w-6 h-6 bg-[#E8E8E6] rounded" />
          <div className="flex-1">
            <div className="h-4 bg-[#E8E8E6] rounded w-3/4 mb-1" />
            <div className="h-3 bg-[#E8E8E6] rounded w-1/2" />
          </div>
          <div className="w-16 h-4 bg-[#E8E8E6] rounded" />
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

  // Fetch holdings data (with demo fallback)
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

        if (data.available && data.holdings?.length > 0) {
          holdingsCache[symbol] = data;
          setHoldings(data);
        } else {
          // Use demo data as fallback
          const demoData = DEMO_HOLDINGS[symbol] || DEFAULT_DEMO_HOLDINGS;
          holdingsCache[symbol] = demoData;
          setHoldings(demoData);
        }
      } catch (err) {
        // Use demo data on error
        const demoData = DEMO_HOLDINGS[symbol] || DEFAULT_DEMO_HOLDINGS;
        holdingsCache[symbol] = demoData;
        setHoldings(demoData);
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

  const getSectorColor = (sector) => SECTOR_COLORS[sector] || 'bg-[#B2BEC3]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-[0_8px_32px_rgba(45,52,54,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8E8E6]">
          <div>
            <h2 className="text-xl font-bold text-[#2D3436] flex items-center gap-2">
              {symbol}
              <span className="text-base font-normal text-[#636E72]">- ETF Details</span>
            </h2>
            {metadata && (
              <p className="text-sm text-[#636E72] mt-0.5">{metadata.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
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
              <div className="bg-[#F5F6F4] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[#636E72] mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Algemene Informatie
                </h3>
                {metadata ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Symbol</span>
                      <span className="text-[#2D3436] font-mono">{symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">ISIN</span>
                      <span className="text-[#2D3436] font-mono">{metadata.isin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Provider</span>
                      <span className="text-[#2D3436]">{metadata.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Index</span>
                      <span className="text-[#2D3436]">{metadata.index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">TER</span>
                      <span className="text-[#7C9885] font-medium">{metadata.ter.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Currency</span>
                      <span className="text-[#2D3436]">{metadata.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Domicile</span>
                      <span className="text-[#2D3436]">{metadata.domicile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Replication</span>
                      <span className="text-[#2D3436]">{metadata.replication}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#B2BEC3] text-sm">Gegevens niet beschikbaar</p>
                )}
              </div>

              {/* Market Info */}
              <div className="bg-[#F5F6F4] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[#636E72] mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Marktgegevens
                </h3>
                {liveMarketData ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Laatste Prijs</span>
                      <span className="text-[#2D3436] font-medium">
                        {formatCurrency(liveMarketData.last, metadata?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Bid</span>
                      <span className="text-[#7C9885]">
                        {formatCurrency(liveMarketData.bid, metadata?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#636E72]">Ask</span>
                      <span className="text-[#C0736D]">
                        {formatCurrency(liveMarketData.ask, metadata?.currency)}
                      </span>
                    </div>
                    {spread && (
                      <div className="flex justify-between">
                        <span className="text-[#636E72]">Spread</span>
                        <span className="text-[#C9A962]">{spread}</span>
                      </div>
                    )}
                    {liveMarketData.volume && (
                      <div className="flex justify-between">
                        <span className="text-[#636E72]">Volume</span>
                        <span className="text-[#2D3436]">{liveMarketData.volume.toLocaleString()}</span>
                      </div>
                    )}
                    {liveMarketData.delayed && (
                      <div className="text-xs text-[#C9A962] mt-2">* Delayed data</div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#B2BEC3] text-sm">Marktgegevens niet beschikbaar</p>
                )}
              </div>

              {/* Asset Allocation */}
              {metadata && (
                <div className="bg-[#F5F6F4] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[#636E72] mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Asset Class
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-[#7C9885] rounded-full" />
                    <span className="text-[#2D3436] text-sm">{metadata.assetClass} 100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Holdings */}
            <div className="bg-[#F5F6F4] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#636E72] mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Top 10 Holdings
                {holdings && (
                  <span className="ml-auto text-[#7C9885]">{holdings.top_10_weight}% of fund</span>
                )}
              </h3>

              {loadingHoldings && <LoadingSkeleton />}

              {error && (
                <div className="flex flex-col items-center py-8 text-[#B2BEC3]">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>{error}</p>
                </div>
              )}


              {!loadingHoldings && holdings && (
                <div className="space-y-2">
                  {holdings.holdings.map((holding, idx) => (
                    <div key={idx} className="group">
                      <div className="flex items-center gap-2 p-2 rounded hover:bg-[#ECEEED] transition-colors">
                        <span className="w-5 h-5 bg-[#E8E8E6] rounded flex items-center justify-center text-xs text-[#636E72] font-mono">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#2D3436] text-sm truncate">
                            {holding.name}
                            {holding.ticker && (
                              <span className="ml-1.5 text-[#B2BEC3] font-mono text-xs">({holding.ticker})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#B2BEC3]">
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
                        <span className="text-[#2D3436] font-medium text-sm">
                          {holding.weight_percent.toFixed(2)}%
                        </span>
                      </div>
                      {/* Weight bar */}
                      <div className="h-1 mx-2 bg-[#E8E8E6] rounded-full overflow-hidden">
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
                <div className="mt-3 pt-3 border-t border-[#E8E8E6] text-xs text-[#B2BEC3]">
                  <div className="flex justify-between items-center">
                    <span>Totaal: {holdings.total_holdings?.toLocaleString()} posities</span>
                    <span>{holdings.last_updated}</span>
                  </div>
                  {holdings.is_demo && (
                    <div className="mt-1 text-[#C9A962]">* Indicatieve data</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
