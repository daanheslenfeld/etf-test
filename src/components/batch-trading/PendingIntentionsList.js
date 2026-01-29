import React, { useState } from 'react';
import { useBatchTrading } from '../../context/BatchTradingContext';
import { Clock, Trash2, CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-[#C9A962]/10',
    textColor: 'text-[#C9A962]',
    borderColor: 'border-[#C9A962]/30',
    icon: Clock,
  },
  executing: {
    label: 'Executing',
    bgColor: 'bg-[#6B7B8A]/10',
    textColor: 'text-[#6B7B8A]',
    borderColor: 'border-[#6B7B8A]/30',
    icon: RefreshCw,
  },
  filled: {
    label: 'Filled',
    bgColor: 'bg-[#7C9885]/10',
    textColor: 'text-[#7C9885]',
    borderColor: 'border-[#7C9885]/30',
    icon: CheckCircle,
  },
  partially_filled: {
    label: 'Partial',
    bgColor: 'bg-[#C9A962]/10',
    textColor: 'text-[#C9A962]',
    borderColor: 'border-[#C9A962]/30',
    icon: AlertTriangle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-[#B2BEC3]/10',
    textColor: 'text-[#B2BEC3]',
    borderColor: 'border-[#B2BEC3]/30',
    icon: XCircle,
  },
  rejected: {
    label: 'Rejected',
    bgColor: 'bg-[#C0736D]/10',
    textColor: 'text-[#C0736D]',
    borderColor: 'border-[#C0736D]/30',
    icon: XCircle,
  },
};

export default function PendingIntentionsList() {
  const { intentions, cancelIntention, fetchIntentions, submitting, loading } = useBatchTrading();
  const [expandedId, setExpandedId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const handleCancel = async (intentionId) => {
    setCancelling(intentionId);
    const result = await cancelIntention(intentionId);
    setCancelling(null);

    if (result.success) {
      // Success - intention removed from list automatically
    } else {
      alert(result.message);
    }
  };

  // Separate pending from completed/cancelled
  const pendingIntentions = intentions.filter(i => i.status === 'pending' || i.status === 'executing');
  const completedIntentions = intentions.filter(i => i.status !== 'pending' && i.status !== 'executing');

  if (loading) {
    return (
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#E8E8E6] rounded w-1/3"></div>
          <div className="h-16 bg-[#E8E8E6] rounded"></div>
          <div className="h-16 bg-[#E8E8E6] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl shadow-[0_2px_8px_rgba(45,52,54,0.06)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8E6] flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#7C9885]" />
          Order Intentions
          {pendingIntentions.length > 0 && (
            <span className="bg-[#C9A962] text-white text-sm px-2 py-0.5 rounded-full font-bold">
              {pendingIntentions.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => fetchIntentions()}
          disabled={loading}
          className="p-2 text-[#636E72] hover:text-[#7C9885] hover:bg-[#F5F6F4] rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Empty State */}
      {intentions.length === 0 ? (
        <div className="p-8 text-center text-[#B2BEC3]">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No order intentions</p>
          <p className="text-sm mt-1">Submit orders to see them here</p>
        </div>
      ) : (
        <>
          {/* Pending Orders */}
          {pendingIntentions.length > 0 && (
            <div className="divide-y divide-[#E8E8E6]">
              {pendingIntentions.map((intention) => {
                const config = STATUS_CONFIG[intention.status] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                const isExpanded = expandedId === intention.id;

                return (
                  <div key={intention.id} className="p-4 hover:bg-[#F5F6F4] transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            intention.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                          }`}>
                            {intention.side}
                          </span>
                          <span className="font-medium text-[#2D3436]">{intention.symbol}</span>
                          <span className="text-[#636E72]">x{intention.quantity}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${config.bgColor} ${config.textColor} ${config.borderColor} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                        <div className="text-sm text-[#B2BEC3] mt-1">
                          {intention.order_type === 'LMT' ? `Limit @ ${formatCurrency(intention.limit_price)}` : 'Market Order'}
                          {intention.estimated_value && (
                            <span className="ml-2">Est: {formatCurrency(intention.estimated_value)}</span>
                          )}
                        </div>
                        {intention.side === 'BUY' && intention.reserved_amount && (
                          <div className="text-xs text-[#C9A962] mt-1">
                            Reserved: {formatCurrency(intention.reserved_amount)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : intention.id)}
                          className="p-2 text-[#B2BEC3] hover:text-[#636E72] rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {intention.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(intention.id)}
                            disabled={cancelling === intention.id || submitting}
                            className="p-2 text-[#B2BEC3] hover:text-[#C0736D] hover:bg-[#C0736D]/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Cancel Order"
                          >
                            {cancelling === intention.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-[#C0736D] border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#E8E8E6] text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[#636E72]">ISIN:</span>
                            <span className="text-[#2D3436] ml-2">{intention.isin || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[#636E72]">Contract ID:</span>
                            <span className="text-[#2D3436] ml-2">{intention.conid}</span>
                          </div>
                          <div>
                            <span className="text-[#636E72]">Submitted:</span>
                            <span className="text-[#2D3436] ml-2">{formatDateTime(intention.submitted_at)}</span>
                          </div>
                          <div>
                            <span className="text-[#636E72]">Est. Price:</span>
                            <span className="text-[#2D3436] ml-2">{formatCurrency(intention.estimated_price)}</span>
                          </div>
                        </div>
                        {intention.status_message && (
                          <div className="mt-2 text-[#636E72]">
                            <span className="font-medium">Note:</span> {intention.status_message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Orders - Collapsed by default */}
          {completedIntentions.length > 0 && (
            <div className="border-t border-[#E8E8E6]">
              <details className="group">
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-[#F5F6F4] transition-colors">
                  <span className="text-sm text-[#636E72]">
                    Completed Orders ({completedIntentions.length})
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#B2BEC3] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="divide-y divide-[#E8E8E6]">
                  {completedIntentions.slice(0, 10).map((intention) => {
                    const config = STATUS_CONFIG[intention.status] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;

                    return (
                      <div key={intention.id} className="p-4 bg-[#F5F6F4]/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded opacity-60 ${
                                intention.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                              }`}>
                                {intention.side}
                              </span>
                              <span className="font-medium text-[#636E72]">{intention.symbol}</span>
                              <span className="text-[#B2BEC3]">x{intention.quantity}</span>
                              <span className={`text-xs px-2 py-0.5 rounded border ${config.bgColor} ${config.textColor} ${config.borderColor} flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                              </span>
                            </div>
                            {intention.fill_price && (
                              <div className="text-sm text-[#636E72] mt-1">
                                Filled @ {formatCurrency(intention.fill_price)} ({intention.filled_quantity} shares)
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-[#B2BEC3]">
                            {formatDateTime(intention.executed_at || intention.cancelled_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
}
