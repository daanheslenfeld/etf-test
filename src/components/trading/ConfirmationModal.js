import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

const ORDER_TYPE_LABELS = {
  'MKT': 'Market',
  'LMT': 'Limit',
  'STP': 'Stop',
  'STP_LMT': 'Stop Limit',
};

export default function ConfirmationModal({ isOpen, onClose, onConfirm, orders, tradingMode, warnings = [], safetyLimits }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const buyOrders = orders.filter(o => o.side === 'BUY');
  const sellOrders = orders.filter(o => o.side === 'SELL');

  // Check for large orders
  const largeOrders = orders.filter(o => o.quantity >= (safetyLimits?.largeOrderThreshold || 25));
  const isBulkOrder = orders.length >= (safetyLimits?.bulkOrderThreshold || 3);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
    onClose();
  };

  const isLive = tradingMode === 'LIVE';
  const hasWarnings = warnings.length > 0 || largeOrders.length > 0 || isBulkOrder;

  return (
    <div className="fixed inset-0 bg-[#2D3436]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl max-w-lg w-full shadow-[0_8px_32px_rgba(45,52,54,0.12)]">
        {/* Header */}
        <div className={`p-4 border-b border-[#E8E8E6] flex items-center justify-between ${isLive ? 'bg-[#6B7B8A]/10' : 'bg-[#C9A962]/10'}`}>
          <div className="flex items-center gap-3">
            {isLive ? (
              <ShieldAlert className="w-6 h-6 text-[#6B7B8A]" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-[#C9A962]" />
            )}
            <div>
              <h2 className="text-lg font-bold text-[#2D3436]">Confirm Order Execution</h2>
              <div className={`text-sm ${isLive ? 'text-[#6B7B8A]' : 'text-[#C9A962]'}`}>
                {isLive ? 'LIVE TRADING - REAL MONEY' : 'Paper Trading Mode'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning for Live Trading */}
          {isLive && (
            <div className="bg-[#6B7B8A]/10 border border-[#6B7B8A]/30 rounded-lg p-4 mb-6">
              <p className="text-[#6B7B8A] font-medium">
                LIVE TRADING: You are about to execute orders with REAL MONEY.
                These orders cannot be undone once submitted.
              </p>
            </div>
          )}

          {/* Safety Warnings */}
          {hasWarnings && (
            <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-lg p-4 mb-6">
              <h4 className="text-[#C9A962] font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Safety Warnings
              </h4>
              <ul className="text-[#C9A962] text-sm space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
                {largeOrders.length > 0 && !warnings.includes(`Large order: ${largeOrders[0]?.quantity} shares`) && (
                  <li>• Large order{largeOrders.length > 1 ? 's' : ''}: {largeOrders.map(o => `${o.symbol} (${o.quantity})`).join(', ')}</li>
                )}
                {isBulkOrder && (
                  <li>• Bulk order: {orders.length} orders in basket</li>
                )}
              </ul>
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="text-[#2D3436] font-medium mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#7C9885]">{buyOrders.length}</div>
                <div className="text-sm text-[#636E72]">Buy Orders</div>
              </div>
              <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#C0736D]">{sellOrders.length}</div>
                <div className="text-sm text-[#636E72]">Sell Orders</div>
              </div>
            </div>

            {/* Order Details */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {orders.map((order, idx) => (
                <div key={idx} className="bg-[#F5F6F4] rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      order.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                    }`}>
                      {order.side}
                    </span>
                    <span className="text-[#2D3436] font-medium">{order.symbol}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-[#636E72]">{order.quantity} shares</div>
                    <div className="text-[#B2BEC3]">{ORDER_TYPE_LABELS[order.orderType] || order.orderType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#ECEEED] text-[#636E72] font-medium rounded-lg hover:bg-[#E8E8E6] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 py-3 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                isLive
                  ? 'bg-[#6B7B8A] hover:bg-[#5A6A79] text-white'
                  : 'bg-[#7C9885] hover:bg-[#6B8A74] text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  Executing...
                </>
              ) : (
                <>
                  {isLive ? 'Execute (LIVE)' : 'Execute Orders'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
