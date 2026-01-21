import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { TrendingUp, TrendingDown, RefreshCw, Clock, AlertTriangle, Wallet, PiggyBank, BarChart3, Plus, Minus, Scale, Briefcase } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { DataCard, DataCardHeader, DataCardTitle, DataCardRow, DataCardActions, DataCardList, DataCardEmpty } from '../common/DataCard';
import { Button } from '../common';
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
  // Portfolio Value = sum(position_quantity × last_price) - from backend
  // Available Cash = AvailableFunds from IB - from backend
  // Total Value = Portfolio Value + Available Cash - from backend
  const displayPortfolioValue = portfolioValue;
  const displayUnrealizedPnL = unrealizedPnL;
  const displayPnLPercent = unrealizedPnLPercent;
  const displayAvailableFunds = availableFunds;
  const displayTotalValue = totalValue;

  // Check if any positions have stale prices
  const hasStaleData = isDataStale || positions.some(p => p.price_stale);

  return (
    <div className={`bg-[#1A1B1F] border rounded-xl overflow-hidden ${isLive ? 'border-blue-600/50' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Portfolio Overview</h2>
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isLive
              ? 'bg-blue-600/30 text-blue-400 border border-blue-600'
              : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
          }`}>
            {tradingMode}
          </div>
          {hasStaleData && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 border border-orange-600/40 rounded text-xs text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Stale {formatTimeAgo(lastPositionsUpdate)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {positions.length > 0 && (
            <button
              onClick={() => setShowRebalanceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-600/50 rounded-lg hover:bg-purple-600/30 transition-colors text-sm font-medium"
            >
              <Scale className="w-4 h-4" />
              Rebalance
            </button>
          )}
          <button
            onClick={fetchPositions}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portfolio Summary - Always visible at top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-gray-700 bg-gray-800/30">
        {/* Stock Market Value (positions only) */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <BarChart3 className="w-3 h-3" />
            Positions Value
          </div>
          <div className="text-lg font-bold text-white">{formatCurrency(displayPortfolioValue)}</div>
        </div>

        {/* Available Cash / Liquidity */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Wallet className="w-3 h-3" />
            Available Cash
          </div>
          <div className={`text-lg font-bold ${displayAvailableFunds > 0 ? 'text-green-400' : 'text-white'}`}>
            {formatCurrency(displayAvailableFunds)}
          </div>
        </div>

        {/* Total Account Value = positions + cash */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <PiggyBank className="w-3 h-3" />
            Total Value
          </div>
          <div className="text-lg font-bold text-white">
            {formatCurrency(displayTotalValue)}
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            {displayUnrealizedPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Unrealized P&L
          </div>
          <div className={`text-lg font-bold flex items-center gap-2 ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(displayUnrealizedPnL)}
            <span className="text-sm">({formatPercent(displayPnLPercent)})</span>
          </div>
        </div>
      </div>

      {/* Daily Limits */}
      {safetyLimits && (
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-2">Daily Trading Limits</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Orders Remaining</div>
                <div className="text-white font-medium">
                  {safetyLimits.ordersRemaining ?? '-'} / {safetyLimits.maxDailyOrders ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Exposure Remaining</div>
                <div className="text-white font-medium">
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
                          title={position.symbol}
                          subtitle={position.currency}
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
              <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-2">Totaal</div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">{formatCurrency(displayPortfolioValue)}</span>
                  <span className={`font-bold ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Symbol</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Qty</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Avg Cost</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Last Price</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Market Value</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">P&L (EUR)</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">P&L %</th>
                <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    No positions found
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
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedEtf(position.symbol)}
                            className="font-medium text-white hover:text-[#28EBCF] hover:underline cursor-pointer transition-colors"
                          >
                            {position.symbol}
                          </button>
                          {isStale && (
                            <AlertTriangle className="w-3 h-3 text-orange-400" title="Price may be stale" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{position.currency}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-white">
                        {qty.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatCurrency(avgCost)}
                      </td>
                      <td className={`px-4 py-3 text-right ${isStale ? 'text-orange-400' : 'text-white'}`}>
                        {formatCurrency(lastPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {formatCurrency(marketValue)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(pnl)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(pnlPercent)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleBuyMore(position)}
                            disabled={!getConidForPosition(position)}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 border border-green-600/40 rounded text-xs font-medium hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Buy more shares"
                          >
                            <Plus className="w-3 h-3" />
                            Buy
                          </button>
                          <button
                            onClick={() => handleSell(position)}
                            disabled={qty <= 0 || !getConidForPosition(position)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 border border-red-600/40 rounded text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={qty <= 0 ? 'No shares to sell' : 'Sell shares'}
                          >
                            <Minus className="w-3 h-3" />
                            Sell
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
              <tfoot className="bg-gray-800/50 border-t border-gray-700">
                <tr>
                  <td className="px-4 py-3 font-bold text-white">Positions Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {formatCurrency(displayPortfolioValue)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(displayUnrealizedPnL)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${displayUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
