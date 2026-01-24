import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader, X } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-[#C9A962]', bg: 'bg-[#C9A962]/10', label: 'Pending' },
  submitted: { icon: Loader, color: 'text-[#6B7B8A]', bg: 'bg-[#6B7B8A]/10', label: 'Submitted' },
  filled: { icon: CheckCircle, color: 'text-[#7C9885]', bg: 'bg-[#7C9885]/10', label: 'Filled' },
  partially_filled: { icon: AlertCircle, color: 'text-[#C9A962]', bg: 'bg-[#C9A962]/10', label: 'Partial' },
  cancelled: { icon: XCircle, color: 'text-[#636E72]', bg: 'bg-[#ECEEED]', label: 'Cancelled' },
  rejected: { icon: XCircle, color: 'text-[#C0736D]', bg: 'bg-[#C0736D]/10', label: 'Rejected' },
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
    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8E6] flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#2D3436]">
          {isExecuting ? 'Executing Orders...' : 'Execution Results'}
        </h3>
        {!isExecuting && (
          <button
            onClick={clearExecutionResults}
            className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary */}
      {!isExecuting && (
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-[#E8E8E6] bg-[#F5F6F4]">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#7C9885]">{successCount}</div>
            <div className="text-sm text-[#636E72]">Submitted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#C0736D]">{failCount}</div>
            <div className="text-sm text-[#636E72]">Failed</div>
          </div>
        </div>
      )}

      {/* Order Results */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E8E6]">
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
                        result.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                      }`}>
                        {result.side}
                      </span>
                      <span className="font-medium text-[#2D3436]">{result.symbol}</span>
                    </div>
                    <div className="text-sm text-[#636E72] mt-1">
                      {result.message}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${config.color}`}>
                    {config.label}
                  </div>
                  {result.filledQty !== undefined && (
                    <div className="text-sm text-[#636E72]">
                      {result.filledQty}/{result.totalQty || result.quantity} filled
                    </div>
                  )}
                  {result.avgPrice && (
                    <div className="text-sm text-[#636E72]">
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
