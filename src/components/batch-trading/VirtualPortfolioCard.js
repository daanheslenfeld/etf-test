import React from 'react';
import { useBatchTrading } from '../../context/BatchTradingContext';
import { Wallet, TrendingUp, TrendingDown, Lock, RefreshCw } from 'lucide-react';

export default function VirtualPortfolioCard() {
  const {
    cashBalance,
    reservedBalance,
    availableBalance,
    totalDeposited,
    totalWithdrawn,
    holdings,
    loading,
    fetchPortfolio
  } = useBatchTrading();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#E8E8E6] rounded w-1/3"></div>
          <div className="h-10 bg-[#E8E8E6] rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-[#E8E8E6] rounded"></div>
            <div className="h-16 bg-[#E8E8E6] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#7C9885]" />
          Virtual Portfolio
        </h3>
        <button
          onClick={fetchPortfolio}
          className="p-2 text-[#636E72] hover:text-[#7C9885] hover:bg-[#F5F6F4] rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Available Balance - Main Display */}
      <div className="mb-6">
        <p className="text-sm text-[#636E72] mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-[#7C9885]">
          {formatCurrency(availableBalance)}
        </p>
      </div>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#F5F6F4] rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-[#636E72] mb-1">
            <Wallet className="w-3 h-3" />
            Total Cash
          </div>
          <p className="font-bold text-[#2D3436]">{formatCurrency(cashBalance)}</p>
        </div>
        <div className="bg-[#C9A962]/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-[#C9A962] mb-1">
            <Lock className="w-3 h-3" />
            Reserved
          </div>
          <p className="font-bold text-[#C9A962]">{formatCurrency(reservedBalance)}</p>
        </div>
      </div>

      {/* Deposit/Withdrawal Summary */}
      <div className="border-t border-[#E8E8E6] pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7C9885]" />
            <span className="text-[#636E72]">Deposited:</span>
            <span className="font-medium text-[#2D3436]">{formatCurrency(totalDeposited)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#C0736D]" />
            <span className="text-[#636E72]">Withdrawn:</span>
            <span className="font-medium text-[#2D3436]">{formatCurrency(totalWithdrawn)}</span>
          </div>
        </div>
      </div>

      {/* Holdings Summary */}
      {holdings.length > 0 && (
        <div className="border-t border-[#E8E8E6] mt-4 pt-4">
          <p className="text-sm text-[#636E72] mb-3">Holdings ({holdings.length})</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {holdings.map((holding) => (
              <div
                key={holding.id}
                className="flex items-center justify-between bg-[#F5F6F4] rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-medium text-[#2D3436]">{holding.symbol}</span>
                  <span className="text-[#636E72] ml-2">x{holding.quantity}</span>
                </div>
                <span className="text-sm text-[#636E72]">
                  Avg: {formatCurrency(holding.avg_cost_basis)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {holdings.length === 0 && (
        <div className="border-t border-[#E8E8E6] mt-4 pt-4">
          <p className="text-sm text-[#B2BEC3] text-center py-2">
            No holdings yet. Submit buy orders to build your portfolio.
          </p>
        </div>
      )}
    </div>
  );
}
