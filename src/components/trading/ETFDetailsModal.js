import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

// Extended ETF metadata with all fields needed
const ETF_DATA = {
  IWDA: {
    name: 'iShares Core MSCI World UCITS ETF',
    isin: 'IE00B4L5Y983',
    category: 'Aandelen Wereld',
    ter: '0.20%',
    ytd: '+18.5%',
    fundSize: '65,420',
    volatility: '14.2%',
    holdings: '1,512',
    distribution: 'Acc',
    returns: { '2021': 27.5, '2022': -13.2, '2023': 19.8, '2024': 22.1 }
  },
  VWCE: {
    name: 'Vanguard FTSE All-World UCITS ETF',
    isin: 'IE00BK5BQT80',
    category: 'Aandelen Wereld',
    ter: '0.22%',
    ytd: '+17.8%',
    fundSize: '28,150',
    volatility: '14.8%',
    holdings: '3,642',
    distribution: 'Acc',
    returns: { '2021': 26.8, '2022': -13.8, '2023': 18.5, '2024': 21.2 }
  },
  EMIM: {
    name: 'iShares Core MSCI EM IMI UCITS ETF',
    isin: 'IE00BKM4GZ66',
    category: 'Aandelen Emerging Markets',
    ter: '0.18%',
    ytd: '+8.2%',
    fundSize: '18,920',
    volatility: '18.5%',
    holdings: '3,178',
    distribution: 'Acc',
    returns: { '2021': 5.2, '2022': -15.4, '2023': 9.8, '2024': 12.5 }
  },
  VUAA: {
    name: 'Vanguard S&P 500 UCITS ETF',
    isin: 'IE00BFMXXD54',
    category: 'Aandelen VS',
    ter: '0.07%',
    ytd: '+24.2%',
    fundSize: '42,800',
    volatility: '15.2%',
    holdings: '503',
    distribution: 'Acc',
    returns: { '2021': 38.5, '2022': -13.0, '2023': 24.2, '2024': 28.5 }
  },
  SXR8: {
    name: 'iShares Core S&P 500 UCITS ETF',
    isin: 'IE00B5BMR087',
    category: 'Aandelen VS',
    ter: '0.07%',
    ytd: '+24.1%',
    fundSize: '78,500',
    volatility: '15.1%',
    holdings: '503',
    distribution: 'Acc',
    returns: { '2021': 38.2, '2022': -12.8, '2023': 24.0, '2024': 28.2 }
  },
  EUNH: {
    name: 'iShares Core Euro Government Bond',
    isin: 'IE00B4WXJJ64',
    category: 'Obligaties Euro',
    ter: '0.07%',
    ytd: '+2.8%',
    fundSize: '12,450',
    volatility: '6.2%',
    holdings: '356',
    distribution: 'Dist',
    returns: { '2021': -3.5, '2022': -18.2, '2023': 6.8, '2024': 4.2 }
  },
  IEAC: {
    name: 'iShares Core EUR Corporate Bond',
    isin: 'IE00B3F81R35',
    category: 'Obligaties Bedrijven',
    ter: '0.20%',
    ytd: '+4.5%',
    fundSize: '15,280',
    volatility: '5.8%',
    holdings: '3,124',
    distribution: 'Dist',
    returns: { '2021': -1.2, '2022': -14.5, '2023': 8.2, '2024': 5.8 }
  },
  VAGE: {
    name: 'Vanguard Global Aggregate Bond',
    isin: 'IE00BG47KB92',
    category: 'Obligaties Wereld',
    ter: '0.10%',
    ytd: '+3.2%',
    fundSize: '8,920',
    volatility: '7.5%',
    holdings: '8,542',
    distribution: 'Acc',
    returns: { '2021': -1.8, '2022': -16.2, '2023': 5.5, '2024': 3.8 }
  },
  SGLD: {
    name: 'Invesco Physical Gold ETC',
    isin: 'IE00B579F325',
    category: 'Grondstoffen',
    ter: '0.12%',
    ytd: '+28.5%',
    fundSize: '15,680',
    volatility: '12.8%',
    holdings: '1',
    distribution: 'N/A',
    returns: { '2021': -4.2, '2022': 0.5, '2023': 12.8, '2024': 32.5 }
  },
  IWDP: {
    name: 'iShares Developed Markets Property Yield',
    isin: 'IE00B1FZS350',
    category: 'Vastgoed',
    ter: '0.59%',
    ytd: '+5.8%',
    fundSize: '3,420',
    volatility: '18.2%',
    holdings: '324',
    distribution: 'Dist',
    returns: { '2021': 28.5, '2022': -25.2, '2023': 8.5, '2024': 6.2 }
  },
  XEON: {
    name: 'Xtrackers II EUR Overnight Rate Swap',
    isin: 'LU0290358497',
    category: 'Geldmarkt',
    ter: '0.10%',
    ytd: '+3.8%',
    fundSize: '6,850',
    volatility: '0.2%',
    holdings: '1',
    distribution: 'Acc',
    returns: { '2021': -0.5, '2022': 0.2, '2023': 3.2, '2024': 3.8 }
  }
};

// Demo holdings data
const TOP_HOLDINGS = {
  IWDA: [
    { name: 'Apple Inc.', weight: '4.8%' },
    { name: 'Microsoft Corp.', weight: '4.5%' },
    { name: 'NVIDIA Corp.', weight: '3.9%' },
    { name: 'Amazon.com Inc.', weight: '2.7%' },
    { name: 'Alphabet Inc.', weight: '1.9%' },
  ],
  VWCE: [
    { name: 'Apple Inc.', weight: '4.2%' },
    { name: 'Microsoft Corp.', weight: '3.8%' },
    { name: 'NVIDIA Corp.', weight: '3.2%' },
    { name: 'Amazon.com Inc.', weight: '2.3%' },
    { name: 'Alphabet Inc.', weight: '1.7%' },
  ],
  EMIM: [
    { name: 'Taiwan Semiconductor', weight: '7.9%' },
    { name: 'Tencent Holdings', weight: '4.1%' },
    { name: 'Samsung Electronics', weight: '4.0%' },
    { name: 'Alibaba Group', weight: '2.5%' },
    { name: 'Reliance Industries', weight: '1.6%' },
  ],
  VUAA: [
    { name: 'Apple Inc.', weight: '7.1%' },
    { name: 'Microsoft Corp.', weight: '6.6%' },
    { name: 'NVIDIA Corp.', weight: '5.9%' },
    { name: 'Amazon.com Inc.', weight: '3.9%' },
    { name: 'Alphabet Inc.', weight: '2.5%' },
  ],
  DEFAULT: [
    { name: 'Apple Inc.', weight: '5.2%' },
    { name: 'Microsoft Corp.', weight: '4.8%' },
    { name: 'NVIDIA Corp.', weight: '4.1%' },
    { name: 'Amazon.com Inc.', weight: '3.0%' },
    { name: 'Alphabet Inc.', weight: '2.2%' },
  ]
};

// Default ETF data for unknown symbols
const DEFAULT_ETF = {
  name: 'ETF',
  isin: '-',
  category: 'Aandelen',
  ter: '0.20%',
  ytd: '+10.0%',
  fundSize: '10,000',
  volatility: '15.0%',
  holdings: '500',
  distribution: 'Acc',
  returns: { '2021': 15.0, '2022': -10.0, '2023': 12.0, '2024': 15.0 }
};

export default function ETFDetailsModal({ symbol, isOpen, onClose }) {
  // Close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !symbol) return null;

  const etf = ETF_DATA[symbol] || { ...DEFAULT_ETF, name: symbol };
  const holdings = TOP_HOLDINGS[symbol] || TOP_HOLDINGS.DEFAULT;

  const chartData = Object.entries(etf.returns).map(([year, value]) => ({
    year,
    return: value
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#FEFEFE] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-[#E8E8E6]">
        {/* Header */}
        <div className="bg-[#FEFEFE] border-b border-[#E8E8E6] px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#2D3436]">{etf.name}</h3>
          <button
            onClick={onClose}
            className="text-2xl text-[#636E72] hover:text-[#2D3436] transition-colors w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-60px)]">
          {/* Two-column info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Basis Info */}
            <div>
              <div className="font-semibold mb-2 text-[#2D3436]">Basis Info</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#636E72]">ISIN:</span>
                  <span className="text-[#636E72]">{etf.isin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Categorie:</span>
                  <span className="text-[#636E72]">{etf.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">TER:</span>
                  <span className="text-[#7C9885] font-medium">{etf.ter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">YTD:</span>
                  <span className={etf.ytd.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{etf.ytd}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="font-semibold mb-2 text-[#2D3436]">Details</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Fund Size:</span>
                  <span className="text-[#636E72]">€{etf.fundSize}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Volatiliteit 1j:</span>
                  <span className="text-[#636E72]">{etf.volatility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Holdings:</span>
                  <span className="text-[#636E72]">{etf.holdings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#636E72]">Distributie:</span>
                  <span className="text-[#636E72]">{etf.distribution}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Returns Chart */}
          <div>
            <div className="font-semibold mb-2 text-sm text-[#2D3436]">Historisch Rendement</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#636E72', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#636E72', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#7C9885' : '#C0736D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Holdings */}
          <div>
            <div className="font-semibold mb-3 text-sm text-[#2D3436]">Top 5 Posities</div>
            <div className="space-y-2">
              {holdings.map((holding, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-[#E8E8E6] last:border-b-0">
                  <span className="text-[#2D3436]">{holding.name}</span>
                  <span className="text-[#7C9885] font-medium">{holding.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
