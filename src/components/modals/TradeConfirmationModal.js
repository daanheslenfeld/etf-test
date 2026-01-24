import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from './ModalContainer';
import { Button, Badge } from '../common';

/**
 * TradeConfirmationModal Component
 *
 * Specialized modal for confirming trade orders
 * Shows order summary, warnings, and live/paper mode indication
 */

const ORDER_TYPE_LABELS = {
  'MKT': 'Market',
  'LMT': 'Limit',
  'STP': 'Stop',
  'STP_LMT': 'Stop Limit',
};

export function TradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  orders = [],
  tradingMode = 'PAPER',
  warnings = [],
  safetyLimits = {},
  marketData = {},
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLive = tradingMode === 'LIVE';

  // Calculate order statistics
  const buyOrders = orders.filter(o => o.side === 'BUY');
  const sellOrders = orders.filter(o => o.side === 'SELL');

  // Check for large/bulk orders
  const largeOrders = orders.filter(o => o.quantity >= (safetyLimits?.largeOrderThreshold || 25));
  const isBulkOrder = orders.length >= (safetyLimits?.bulkOrderThreshold || 3);

  // Calculate estimated values
  const calculateEstimatedValue = (order) => {
    if (order.limitPrice) return order.limitPrice * order.quantity;
    const md = marketData[order.symbol];
    if (!md) return null;
    const price = order.side === 'BUY' ? md.ask : md.bid;
    return price ? price * order.quantity : null;
  };

  const totalBuyValue = buyOrders.reduce((sum, o) => sum + (calculateEstimatedValue(o) || 0), 0);
  const totalSellValue = sellOrders.reduce((sum, o) => sum + (calculateEstimatedValue(o) || 0), 0);
  const netCashImpact = totalSellValue - totalBuyValue;

  // Format currency
  const formatPrice = (value) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  // All warnings
  const allWarnings = [...warnings];
  if (largeOrders.length > 0) {
    allWarnings.push(`Large order: ${largeOrders.map(o => `${o.symbol} (${o.quantity})`).join(', ')}`);
  }
  if (isBulkOrder) {
    allWarnings.push(`Bulk order: ${orders.length} orders`);
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Trade execution failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {/* Header */}
      <ModalHeader
        title="Order Uitvoering Bevestigen"
        subtitle={isLive ? 'LIVE TRADING - ECHTE TRANSACTIES' : 'Paper Trading Mode'}
        icon={isLive ? ShieldAlert : AlertTriangle}
        variant={isLive ? 'danger' : 'warning'}
      >
        <div className="mt-2">
          <Badge variant={isLive ? 'error' : 'info'} size="sm">
            {tradingMode}
          </Badge>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Live Trading Warning */}
        {isLive && (
          <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#C0736D] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#C0736D] font-medium">
                  Je staat op het punt om echte orders uit te voeren.
                </p>
                <p className="text-[#C0736D]/80 text-sm mt-1">
                  Deze transacties kunnen niet ongedaan worden gemaakt na uitvoering.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Safety Warnings */}
        {allWarnings.length > 0 && (
          <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-xl p-4 mb-5">
            <h4 className="text-[#C9A962] font-medium flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Waarschuwingen
            </h4>
            <ul className="text-[#C9A962]/80 text-sm space-y-1">
              {allWarnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Order Summary */}
        <div className="mb-5">
          <h3 className="text-sm font-medium text-[#636E72] uppercase tracking-wider mb-3">
            Order Samenvatting
          </h3>

          {/* Buy/Sell counts */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#7C9885]/10 border border-[#7C9885]/20 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-[#7C9885]" />
                <span className="text-2xl font-bold text-[#7C9885]">{buyOrders.length}</span>
              </div>
              <div className="text-sm text-[#636E72]">Koop Orders</div>
              {totalBuyValue > 0 && (
                <div className="text-xs text-[#7C9885]/70 mt-1">
                  ~{formatPrice(totalBuyValue)}
                </div>
              )}
            </div>
            <div className="bg-[#C0736D]/10 border border-[#C0736D]/20 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="w-5 h-5 text-[#C0736D]" />
                <span className="text-2xl font-bold text-[#C0736D]">{sellOrders.length}</span>
              </div>
              <div className="text-sm text-[#636E72]">Verkoop Orders</div>
              {totalSellValue > 0 && (
                <div className="text-xs text-[#C0736D]/70 mt-1">
                  ~{formatPrice(totalSellValue)}
                </div>
              )}
            </div>
          </div>

          {/* Net cash impact */}
          {(totalBuyValue > 0 || totalSellValue > 0) && (
            <div className="bg-[#F5F6F4] rounded-xl p-3 text-center">
              <span className="text-sm text-[#636E72]">Geschat Cash Effect: </span>
              <span className={`font-semibold font-mono ${netCashImpact >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                {netCashImpact >= 0 ? '+' : ''}{formatPrice(netCashImpact)}
              </span>
            </div>
          )}
        </div>

        {/* Order List */}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {orders.map((order, idx) => (
            <OrderSummaryRow key={order.id || idx} order={order} marketData={marketData} />
          ))}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuleren
        </Button>
        <Button
          variant={isLive ? 'danger' : 'primary'}
          onClick={handleConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
          icon={isSubmitting ? Loader2 : CheckCircle}
        >
          {isLive ? 'Uitvoeren (LIVE)' : `Uitvoeren (${orders.length} orders)`}
        </Button>
      </ModalFooter>
    </ModalContainer>
  );
}

/**
 * OrderSummaryRow - Single order in the confirmation list
 */
function OrderSummaryRow({ order, marketData }) {
  const md = marketData[order.symbol];

  const formatPrice = (value) => {
    if (!value) return '—';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="bg-[#F5F6F4] rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`
          text-xs font-bold px-2 py-1 rounded
          ${order.side === 'BUY'
            ? 'bg-[#7C9885]/20 text-[#7C9885]'
            : 'bg-[#C0736D]/20 text-[#C0736D]'
          }
        `}>
          {order.side === 'BUY' ? 'KOOP' : 'VERKOOP'}
        </span>
        <div>
          <span className="text-[#2D3436] font-medium">{order.symbol}</span>
          <span className="text-[#636E72] ml-2">×{order.quantity}</span>
        </div>
      </div>
      <div className="text-right text-sm">
        <div className="text-[#636E72]">
          {ORDER_TYPE_LABELS[order.orderType] || order.orderType}
        </div>
        {order.limitPrice && (
          <div className="text-[#B2BEC3] text-xs">
            Limiet: {formatPrice(order.limitPrice)}
          </div>
        )}
        {order.orderType === 'MKT' && md && (
          <div className="text-[#B2BEC3] text-xs">
            {order.side === 'BUY' ? `Ask: ${formatPrice(md.ask)}` : `Bid: ${formatPrice(md.bid)}`}
          </div>
        )}
      </div>
    </div>
  );
}

export default TradeConfirmationModal;
