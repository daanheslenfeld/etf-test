import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { TrendingUp, TrendingDown, RefreshCw, Clock, AlertTriangle, Wallet, PiggyBank, BarChart3, Plus, Minus, Scale, Briefcase } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { DataCard, DataCardHeader, DataCardTitle, DataCardRow, DataCardActions, DataCardList, DataCardEmpty } from '../common/DataCard';
import { Button } from '../common';
import { StatsCard } from '../dashboard/StatsCard';
import ETFDetailsModal from './ETFDetailsModal';
import RebalanceModal from './RebalanceModal';

// Helper to format time ago
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

export default function PortfolioOverview({ onPrefillOrder }) {
  const {
    positions,
    portfolioValue,
    cashBalance,
    availableFunds,
    unrealizedPnL,
    unrealizedPnLPercent,
    totalValue,
    fetchPositions,
    loading,
    isDataStale,
    lastPositionsUpdate,
    safetyLimits,
    isLive,
    tradingMode,
    tradableETFs,
    marketData
  } = useTrading();

  // ETF details modal state
  const [selectedEtf, setSelectedEtf] = useState(null);
  // Rebalance modal state
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  // Responsive hook
  const isMobile = useIsMobile();

  // Helper to get conid for a position
  const getConidForPosition = (position) => {
    // Try to find the conid from tradability data or position
    if (position.conid) return position.conid;
    // Check tradableETFs by symbol (need to find by matching symbol)
    const tradInfo = Object.values(tradableETFs).find(t => t.contract?.symbol === position.symbol);
    if (tradInfo?.contract?.conId) return tradInfo.contract.conId;
    return null;
  };

  // Handle BUY MORE action
  const handleBuyMore = (position) => {
    const conid = getConidForPosition(position);
    if (onPrefillOrder && conid) {
      onPrefillOrder({
        symbol: position.symbol,
        conid: conid,
        side: 'BUY',
        quantity: 1,
      });
    }
  };

  // Handle SELL action
  const handleSell = (position) => {
    const conid = getConidForPosition(position);
    const maxQty = Math.floor(parseFloat(position.quantity) || 0);
    if (onPrefillOrder && conid && maxQty > 0) {
      onPrefillOrder({
        symbol: position.symbol,
        conid: conid,
        side: 'SELL',
        quantity: 1,
        maxQuantity: maxQty,
      });
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercent = (value) => {
    const num = parseFloat(value) || 0;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  // Use backend as single source of truth - no local recalculation
  const displayPortfolioValue = portfolioValue;
  const displayUnrealizedPnL = unrealizedPnL;
  const displayPnLPercent = unrealizedPnLPercent;
  const displayAvailableFunds = availableFunds;
  const displayTotalValue = totalValue;

  // Check if any positions have stale prices
  const hasStaleData = isDataStale || positions.some(p => p.price_stale);

  return (
    <div className={`bg-[#FEFEFE] border rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${isLive ? 'border-[#6B7B8A]/30' : 'border-[#E8E8E6]'}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8E6] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[#2D3436]">Portefeuilleoverzicht</h2>
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isLive
              ? 'bg-[#6B7B8A]/10 text-[#6B7B8A] border border-[#6B7B8A]/30'
              : 'bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30'
          }`}>
            {tradingMode}
          </div>
          {hasStaleData && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded text-xs text-[#C9A962]">
              <Clock className="w-3 h-3" />
              <span>Stale {formatTimeAgo(lastPositionsUpdate)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {positions.length > 0 && (
            <button
              onClick={() => setShowRebalanceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B7B9A]/10 text-[#8B7B9A] border border-[#8B7B9A]/30 rounded-lg hover:bg-[#8B7B9A]/20 transition-colors text-sm font-medium"
            >
              <Scale className="w-4 h-4" />
              Rebalance
            </button>
          )}
          <button
            onClick={fetchPositions}
            disabled={loading}
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portfolio Summary - Premium Stats Cards */}
      <div className="p-5 border-b border-[#E8E8E6] bg-[#F5F6F4]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Portfolio Value - Hero Card spanning 2 cols on mobile */}
          <div className="col-span-2">
            <StatsCard
              variant="hero"
              label="Totale Portefeuillewaarde"
              value={formatCurrency(displayTotalValue)}
              change={displayUnrealizedPnL}
              changePercent={displayPnLPercent}
              icon={PiggyBank}
              trend={displayUnrealizedPnL >= 0 ? 'up' : 'down'}
            />
          </div>

          {/* Positions Value */}
          <StatsCard
            label="Belegd"
            value={formatCurrency(displayPortfolioValue)}
            icon={BarChart3}
            iconColor="text-[#6B7B8A]"
            iconBg="bg-[#6B7B8A]/10"
          />

          {/* Available Cash */}
          <StatsCard
            label="Beschikbaar"
            value={formatCurrency(displayAvailableFunds)}
            icon={Wallet}
            iconColor={displayAvailableFunds > 0 ? 'text-[#7C9885]' : 'text-[#636E72]'}
            iconBg={displayAvailableFunds > 0 ? 'bg-[#7C9885]/10' : 'bg-[#ECEEED]'}
          />
        </div>
      </div>

      {/* Daily Limits */}
      {safetyLimits && (
        <div className="px-4 py-3 border-b border-[#E8E8E6]">
          <div className="bg-[#F5F6F4] rounded-lg p-3">
            <div className="text-xs text-[#636E72] mb-2">Dagelijkse Handelslimieten</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[#B2BEC3] text-xs">Resterende Orders</div>
                <div className="text-[#2D3436] font-medium">
                  {safetyLimits.ordersRemaining ?? '-'} / {safetyLimits.maxDailyOrders ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-[#B2BEC3] text-xs">Resterende Exposure</div>
                <div className="text-[#2D3436] font-medium">
                  {formatCurrency(safetyLimits.exposureRemaining ?? 0)} / {formatCurrency(safetyLimits.maxDailyExposure ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Positions - Mobile Card View */}
      {isMobile ? (
        <div className="p-4">
          {positions.length === 0 ? (
            <DataCardEmpty
              icon={Briefcase}
              title="Geen posities"
              description="Je hebt nog geen posities in je portfolio"
            />
          ) : (
            <>
              <DataCardList>
                {positions.map((position, idx) => {
                  const qty = parseFloat(position.quantity) || 0;
                  const avgCost = parseFloat(position.avg_cost) || 0;
                  const lastPrice = parseFloat(position.last_price) || avgCost;
                  const marketValue = parseFloat(position.market_value) || 0;
                  const pnl = parseFloat(position.unrealized_pnl) || 0;
                  const pnlPercent = parseFloat(position.unrealized_pnl_pct) || 0;
                  const isPositive = pnl >= 0;
                  const isStale = position.price_stale;

                  return (
                    <DataCard key={idx} variant={isStale ? 'highlighted' : 'default'}>
                      <DataCardHeader>
                        <DataCardTitle
                          title={position.name || position.symbol}
                          subtitle={`${position.symbol} • ${position.currency}`}
                          badge={formatPercent(pnlPercent)}
                          badgeVariant={isPositive ? 'success' : 'danger'}
                        />
                      </DataCardHeader>

                      <DataCardRow label="Aantal" value={qty.toFixed(0)} mono />
                      <DataCardRow label="Gem. kosten" value={formatCurrency(avgCost)} mono />
                      <DataCardRow
                        label="Laatste prijs"
                        value={formatCurrency(lastPrice)}
                        valueColor={isStale ? 'warning' : 'default'}
                        mono
                      />
                      <DataCardRow label="Marktwaarde" value={formatCurrency(marketValue)} mono />
                      <DataCardRow
                        label="P&L"
                        value={formatCurrency(pnl)}
                        valueColor={isPositive ? 'success' : 'danger'}
                        mono
                      />

                      <DataCardActions>
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-1 min-h-[44px]"
                          onClick={() => handleBuyMore(position)}
                          disabled={!getConidForPosition(position)}
                          icon={Plus}
                        >
                          Koop
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1 min-h-[44px]"
                          onClick={() => handleSell(position)}
                          disabled={qty <= 0 || !getConidForPosition(position)}
                          icon={Minus}
                        >
                          Verkoop
                        </Button>
                      </DataCardActions>
                    </DataCard>
                  );
                })}
              </DataCardList>

              {/* Mobile Totals */}
              <div className="mt-4 p-4 bg-[#F5F6F4] rounded-xl border border-[#E8E8E6]">
                <div className="text-sm text-[#636E72] mb-2">Totaal</div>
                <div className="flex justify-between items-center">
                  <span className="text-[#2D3436] font-bold">{formatCurrency(displayPortfolioValue)}</span>
                  <span className={`font-bold ${displayUnrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {formatCurrency(displayUnrealizedPnL)} ({formatPercent(displayPnLPercent)})
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F6F4]">
              <tr>
                <th className="text-left text-[#636E72] text-sm font-medium px-4 py-3">ETF</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Aantal</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Gem. Kosten</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Laatste Prijs</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Marktwaarde</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">W/V (EUR)</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">W/V %</th>
                <th className="text-center text-[#636E72] text-sm font-medium px-4 py-3">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E6]">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[#B2BEC3] py-8">
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

                  return (
                    <tr key={idx} className="hover:bg-[#F5F6F4] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedEtf(position.symbol)}
                            className="font-medium text-[#2D3436] hover:text-[#7C9885] hover:underline cursor-pointer transition-colors text-left"
                          >
                            {position.name || position.symbol}
                          </button>
                          {isStale && (
                            <AlertTriangle className="w-3 h-3 text-[#C9A962]" title="Price may be stale" />
                          )}
                        </div>
                        <div className="text-xs text-[#B2BEC3]">{position.symbol} • {position.currency}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-[#2D3436]">
                        {qty.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#636E72]">
                        {formatCurrency(avgCost)}
                      </td>
                      <td className={`px-4 py-3 text-right ${isStale ? 'text-[#C9A962]' : 'text-[#2D3436]'}`}>
                        {formatCurrency(lastPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#2D3436] font-medium">
                        {formatCurrency(marketValue)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                        {formatCurrency(pnl)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                        {formatPercent(pnlPercent)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleBuyMore(position)}
                            disabled={!getConidForPosition(position)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#7C9885]/10 text-[#7C9885] border border-[#7C9885]/30 rounded text-xs font-medium hover:bg-[#7C9885]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Koop meer aandelen"
                          >
                            <Plus className="w-3 h-3" />
                            Koop
                          </button>
                          <button
                            onClick={() => handleSell(position)}
                            disabled={qty <= 0 || !getConidForPosition(position)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#C0736D]/10 text-[#C0736D] border border-[#C0736D]/30 rounded text-xs font-medium hover:bg-[#C0736D]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={qty <= 0 ? 'Geen aandelen om te verkopen' : 'Verkoop aandelen'}
                          >
                            <Minus className="w-3 h-3" />
                            Verkoop
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals Footer */}
            {positions.length > 0 && (
              <tfoot className="bg-[#F5F6F4] border-t border-[#E8E8E6]">
                <tr>
                  <td className="px-4 py-3 font-bold text-[#2D3436]">Totaal Posities</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-[#2D3436]">
                    {formatCurrency(displayPortfolioValue)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${displayUnrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {formatCurrency(displayUnrealizedPnL)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${displayUnrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {formatPercent(displayPnLPercent)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ETF Details Modal */}
      <ETFDetailsModal
        symbol={selectedEtf}
        isOpen={!!selectedEtf}
        onClose={() => setSelectedEtf(null)}
      />

      {/* Rebalance Modal */}
      <RebalanceModal
        isOpen={showRebalanceModal}
        onClose={() => setShowRebalanceModal(false)}
        positions={positions}
        portfolioValue={displayPortfolioValue}
        availableCash={displayAvailableFunds}
      />
    </div>
  );
}
