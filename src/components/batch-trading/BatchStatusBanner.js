import React from 'react';
import { useBatchTrading } from '../../context/BatchTradingContext';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BatchStatusBanner() {
  const { nextBatchAt, cancellationCutoff, ordersLocked, pendingCount } = useBatchTrading();

  // Format time for display
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam'
      });
    } catch {
      return isoString;
    }
  };

  if (ordersLocked) {
    return (
      <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C9A962]/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-[#C9A962]" />
          </div>
          <div>
            <h3 className="font-bold text-[#C9A962]">Orders Locked</h3>
            <p className="text-sm text-[#636E72]">
              Batch execution in progress. New orders will be included in the next batch.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7C9885]/20 rounded-lg">
            <Clock className="w-5 h-5 text-[#7C9885]" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D3436]">Next Batch: 14:00 CET</h3>
            <p className="text-sm text-[#636E72]">
              Orders submitted before 13:55 CET will be executed in the next batch
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-[#FEFEFE] px-3 py-2 rounded-lg border border-[#E8E8E6]">
            <CheckCircle className="w-4 h-4 text-[#7C9885]" />
            <span className="text-sm text-[#2D3436]">
              <span className="font-bold">{pendingCount}</span> order{pendingCount !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
