import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, Clock, Wifi, WifiOff } from 'lucide-react';
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

export default function FinancialOverviewCards() {
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <h2 className="text-xl font-bold text-white">Portfolio Overzicht</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if we have any data to show
  const hasData = totalValue !== 0 || portfolioValue !== 0 || cashBalance !== 0;

  return (
    <div className="mb-8">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <h2 className="text-xl font-bold text-white whitespace-nowrap">Portfolio Overzicht</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!brokerLinked ? (
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <WifiOff className="w-3 h-3" /> Niet verbonden
            </span>
          ) : connected ? (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-400 text-xs">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
          {isDataStale && brokerLinked && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 border border-orange-600/40 rounded text-xs text-orange-400">
              <Clock className="w-3 h-3" /> Gecached
            </span>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Value Card */}
        <div className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <PiggyBank className="w-4 h-4" />
            Totale Waarde
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(totalValue)}
          </div>
        </div>

        {/* Portfolio Value Card */}
        <div className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <BarChart3 className="w-4 h-4" />
            Belegd Vermogen
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(portfolioValue)}
          </div>
        </div>

        {/* Cash Balance Card */}
        <div className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Wallet className="w-4 h-4" />
            Beschikbaar
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${cashBalance > 0 ? 'text-green-400' : 'text-white'}`}>
            {formatCurrency(cashBalance)}
          </div>
        </div>

        {/* Returns Card */}
        <div className="bg-[#1A1B1F] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            {unrealizedPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            Rendement
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(unrealizedPnL)}
          </div>
          <div className={`text-sm ${unrealizedPnL >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
            {formatPercent(unrealizedPnLPercent)}
          </div>
        </div>
      </div>

      {/* Last Updated Footer or Connect Prompt */}
      {!brokerLinked ? (
        <div className="mt-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400 text-center">
            Verbind je broker om je portfolio live te volgen
          </p>
        </div>
      ) : lastPositionsUpdate && (
        <div className="mt-2 text-right text-xs text-gray-500">
          Bijgewerkt: {formatTimeAgo(lastPositionsUpdate)}
        </div>
      )}
    </div>
  );
}
