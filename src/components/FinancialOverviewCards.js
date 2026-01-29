import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, Clock, Wifi, WifiOff, ChevronRight } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
};

const formatPercent = (value) => {
  const num = parseFloat(value) || 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Nooit';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s geleden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.floor(hours / 24)}d geleden`;
};

export default function FinancialOverviewCards({ onNavigate }) {
  const {
    totalValue,
    portfolioValue,
    cashBalance,
    unrealizedPnL,
    unrealizedPnLPercent,
    connected,
    isDataStale,
    lastPositionsUpdate,
    loading,
    brokerLinked
  } = useTrading();

  // Show skeleton while loading (only if broker is linked)
  if (loading && brokerLinked) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
          <h2 className="text-xl font-semibold text-[#7C9885]">Portfolio Overzicht</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 animate-pulse shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
              <div className="h-4 bg-[#ECEEED] rounded-lg w-24 mb-4"></div>
              <div className="h-8 bg-[#ECEEED] rounded-lg w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if we have any data to show
  const hasData = totalValue !== 0 || portfolioValue !== 0 || cashBalance !== 0;

  return (
    <div className="mb-10">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
          <h2 className="text-xl font-semibold text-[#7C9885] whitespace-nowrap">Portfolio Overzicht</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D5D5D3] to-transparent"></div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!brokerLinked ? (
            <span className="flex items-center gap-1.5 text-[#636E72] text-xs">
              <WifiOff className="w-3.5 h-3.5" /> Niet verbonden
            </span>
          ) : connected ? (
            <span className="flex items-center gap-1.5 text-[#7C9885] text-xs font-medium">
              <Wifi className="w-3.5 h-3.5" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#C9A962] text-xs">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
          {isDataStale && brokerLinked && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full text-xs text-[#C9A962]">
              <Clock className="w-3 h-3" /> Gecached
            </span>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Value Card */}
        <button
          onClick={() => onNavigate?.('totaleWaardeDetail')}
          className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 hover:border-[#7C9885]/40 hover:shadow-[0_4px_16px_rgba(45,52,54,0.08)] transition-all duration-200 shadow-[0_2px_8px_rgba(45,52,54,0.06)] text-left active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#636E72] text-xs font-medium">
              <div className="p-1.5 bg-[#7C9885]/10 rounded-lg">
                <PiggyBank className="w-4 h-4 text-[#7C9885]" />
              </div>
              Totale Waarde
            </div>
            <ChevronRight className="w-4 h-4 text-[#B2BEC3] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#2D3436] tabular-nums">
            {formatCurrency(totalValue)}
          </div>
        </button>

        {/* Portfolio Value Card */}
        <button
          onClick={() => onNavigate?.('belegdVermogenDetail')}
          className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 hover:border-[#6B7B8A]/40 hover:shadow-[0_4px_16px_rgba(45,52,54,0.08)] transition-all duration-200 shadow-[0_2px_8px_rgba(45,52,54,0.06)] text-left active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#636E72] text-xs font-medium">
              <div className="p-1.5 bg-[#6B7B8A]/10 rounded-lg">
                <BarChart3 className="w-4 h-4 text-[#6B7B8A]" />
              </div>
              Belegd Vermogen
            </div>
            <ChevronRight className="w-4 h-4 text-[#B2BEC3] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#2D3436] tabular-nums">
            {formatCurrency(portfolioValue)}
          </div>
        </button>

        {/* Cash Balance Card */}
        <button
          onClick={() => onNavigate?.('beschikbaarDetail')}
          className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 hover:border-[#7C9885]/40 hover:shadow-[0_4px_16px_rgba(45,52,54,0.08)] transition-all duration-200 shadow-[0_2px_8px_rgba(45,52,54,0.06)] text-left active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#636E72] text-xs font-medium">
              <div className="p-1.5 bg-[#7C9885]/10 rounded-lg">
                <Wallet className="w-4 h-4 text-[#7C9885]" />
              </div>
              Beschikbaar
            </div>
            <ChevronRight className="w-4 h-4 text-[#B2BEC3] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold tabular-nums ${cashBalance > 0 ? 'text-[#7C9885]' : 'text-[#2D3436]'}`}>
            {formatCurrency(cashBalance)}
          </div>
        </button>

        {/* Returns Card */}
        <button
          onClick={() => onNavigate?.('rendementDetail')}
          className={`bg-[#FEFEFE] border rounded-2xl p-5 hover:shadow-[0_4px_16px_rgba(45,52,54,0.08)] transition-all duration-200 shadow-[0_2px_8px_rgba(45,52,54,0.06)] text-left active:scale-[0.98] group ${
            unrealizedPnL >= 0 ? 'border-[#7C9885]/30' : 'border-[#C0736D]/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#636E72] text-xs font-medium">
              <div className={`p-1.5 rounded-lg ${unrealizedPnL >= 0 ? 'bg-[#7C9885]/10' : 'bg-[#C0736D]/10'}`}>
                {unrealizedPnL >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-[#7C9885]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#C0736D]" />
                )}
              </div>
              Rendement
            </div>
            <ChevronRight className="w-4 h-4 text-[#B2BEC3] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold tabular-nums ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
            {formatCurrency(unrealizedPnL)}
          </div>
          <div className={`text-sm mt-1 tabular-nums ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
            {formatPercent(unrealizedPnLPercent)}
          </div>
        </button>
      </div>

      {/* Last Updated Footer or Connect Prompt */}
      {!brokerLinked ? (
        <div className="mt-5 p-4 bg-[#F5F6F4] border border-[#E8E8E6] rounded-xl">
          <p className="text-sm text-[#636E72] text-center">
            Verbind je broker om je portfolio live te volgen
          </p>
        </div>
      ) : lastPositionsUpdate && (
        <div className="mt-3 text-right text-xs text-[#B2BEC3]">
          Bijgewerkt: {formatTimeAgo(lastPositionsUpdate)}
        </div>
      )}
    </div>
  );
}
