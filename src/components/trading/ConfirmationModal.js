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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className={`p-4 border-b border-gray-700 flex items-center justify-between ${isLive ? 'bg-red-900/30' : 'bg-yellow-900/20'}`}>
          <div className="flex items-center gap-3">
            {isLive ? (
              <ShieldAlert className="w-6 h-6 text-red-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            )}
            <div>
              <h2 className="text-lg font-bold text-white">Confirm Order Execution</h2>
              <div className={`text-sm ${isLive ? 'text-red-400' : 'text-yellow-400'}`}>
                {isLive ? 'LIVE TRADING - REAL MONEY' : 'Paper Trading Mode'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning for Live Trading */}
          {isLive && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-400 font-medium">
                WARNING: You are about to execute orders with REAL MONEY.
                These orders cannot be undone once submitted.
              </p>
            </div>
          )}

          {/* Safety Warnings */}
          {hasWarnings && (
            <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4 mb-6">
              <h4 className="text-orange-400 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Safety Warnings
              </h4>
              <ul className="text-orange-300 text-sm space-y-1">
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
            <h3 className="text-white font-medium mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{buyOrders.length}</div>
                <div className="text-sm text-gray-400">Buy Orders</div>
              </div>
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{sellOrders.length}</div>
                <div className="text-sm text-gray-400">Sell Orders</div>
              </div>
            </div>

            {/* Order Details */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {orders.map((order, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      order.side === 'BUY' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                    }`}>
                      {order.side}
                    </span>
                    <span className="text-white font-medium">{order.symbol}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-300">{order.quantity} shares</div>
                    <div className="text-gray-500">{ORDER_TYPE_LABELS[order.orderType] || order.orderType}</div>
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
              className="flex-1 py-3 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 py-3 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#28EBCF] hover:bg-[#20D4BA] text-gray-900'
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
