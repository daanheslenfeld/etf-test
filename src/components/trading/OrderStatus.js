import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader, X } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Pending' },
  submitted: { icon: Loader, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Submitted' },
  filled: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: 'Filled' },
  partially_filled: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-900/20', label: 'Partial' },
  cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-900/20', label: 'Cancelled' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Rejected' },
};

export default function OrderStatus() {
  const { executionResults, clearExecutionResults, orders, isExecuting } = useTrading();

  // Combine execution results with live order status
  const getOrderStatus = (result) => {
    // Check if we have a live order status from API
    if (result.orderId) {
      const liveOrder = orders.find(o => o.order_id === result.orderId);
      if (liveOrder) {
        const status = liveOrder.status?.toLowerCase() || 'submitted';
        return {
          ...result,
          status: status.includes('fill') ? (liveOrder.filled_quantity >= liveOrder.quantity ? 'filled' : 'partially_filled') : status,
          filledQty: liveOrder.filled_quantity || 0,
          totalQty: liveOrder.quantity,
          avgPrice: liveOrder.avg_fill_price,
        };
      }
    }
    return result;
  };

  if (executionResults.length === 0) return null;

  const enrichedResults = executionResults.map(getOrderStatus);
  const successCount = enrichedResults.filter(r => ['submitted', 'filled', 'partially_filled'].includes(r.status)).length;
  const failCount = enrichedResults.filter(r => ['rejected', 'cancelled'].includes(r.status)).length;

  return (
    <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">
          {isExecuting ? 'Executing Orders...' : 'Execution Results'}
        </h3>
        {!isExecuting && (
          <button
            onClick={clearExecutionResults}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary */}
      {!isExecuting && (
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700 bg-gray-800/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{successCount}</div>
            <div className="text-sm text-gray-400">Submitted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{failCount}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
        </div>
      )}

      {/* Order Results */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
        {enrichedResults.map((result) => {
          const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.pending;
          const StatusIcon = config.icon;

          return (
            <div key={result.id} className={`p-4 ${config.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`w-5 h-5 ${config.color} ${result.status === 'submitted' ? 'animate-spin' : ''}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        result.side === 'BUY' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                      }`}>
                        {result.side}
                      </span>
                      <span className="font-medium text-white">{result.symbol}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {result.message}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${config.color}`}>
                    {config.label}
                  </div>
                  {result.filledQty !== undefined && (
                    <div className="text-sm text-gray-400">
                      {result.filledQty}/{result.totalQty || result.quantity} filled
                    </div>
                  )}
                  {result.avgPrice && (
                    <div className="text-sm text-gray-400">
                      @ {parseFloat(result.avgPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
