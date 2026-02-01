import React, { useState, useEffect, useCallback } from 'react';

const TRADING_API_URL = 'http://localhost:8002';

function getAuthHeaders(user) {
  return {
    'Content-Type': 'application/json',
    'X-Customer-ID': String(user?.id ?? 0),
    'X-Customer-Email': user?.email || 'admin@etfportal.nl',
  };
}

export function AdminCashAllocation({ user, onBack, embedded }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allocations, setAllocations] = useState({}); // { [accountId]: targetAmount }
  const [applying, setApplying] = useState(null); // accountId being applied

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/virtual-accounts/admin/cash-overview`, {
        headers: getAuthHeaders(user),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setOverview(data);
      setError(null);

      // Initialize allocation inputs with current assigned_cash values
      const initial = {};
      for (const acc of data.accounts) {
        initial[acc.id] = (acc.assigned_cash || 0).toFixed(2);
      }
      setAllocations(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleAllocate = async (accountId) => {
    const target = parseFloat(allocations[accountId]);
    if (isNaN(target) || target < 0) {
      setError('Invalid amount');
      return;
    }

    // Find current assigned_cash for this account to compute delta
    const acc = (overview?.accounts || []).find(a => a.id === accountId);
    const currentAssigned = acc?.assigned_cash || 0;
    const delta = target - currentAssigned;

    if (Math.abs(delta) < 0.01) {
      setError('No change needed.');
      return;
    }

    setApplying(accountId);
    setError(null);

    try {
      const res = await fetch(`${TRADING_API_URL}/virtual-accounts/${accountId}/allocate`, {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      // Refresh overview
      await fetchOverview();
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className={`${embedded ? '' : 'min-h-screen bg-[#F5F5F3]'} flex items-center justify-center py-12`}>
        <div className="text-[#636E72]">Loading cash overview...</div>
      </div>
    );
  }

  const lynxCash = overview?.lynx_cash ?? 0;
  const totalAssigned = overview?.total_assigned ?? 0;
  const totalReserved = overview?.total_reserved ?? 0;
  const totalAvailable = overview?.total_available ?? 0;
  const unallocated = overview?.unallocated ?? 0;
  const ibConnected = overview?.ib_connected ?? false;
  const overallocated = overview?.overallocated ?? false;
  const accounts = overview?.accounts ?? [];

  const assignedPct = lynxCash > 0 ? ((totalAssigned + totalReserved) / lynxCash) * 100 : 0;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-[#F5F5F3]'}>
      {/* Header - only shown in standalone mode */}
      {!embedded && (
        <div className="bg-white border-b border-[#E8E8E6] px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-[#636E72] hover:text-[#2D3436] transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-[#2D3436]">Cash Allocation</h1>
            <button
              onClick={fetchOverview}
              className="ml-auto text-sm px-3 py-1 bg-[#7C9885]/10 text-[#7C9885] rounded hover:bg-[#7C9885]/20"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <div className={`${embedded ? '' : 'max-w-4xl mx-auto px-4 sm:px-6 py-6'} space-y-6`}>
        {/* Refresh button in embedded mode */}
        {embedded && (
          <div className="flex justify-end">
            <button
              onClick={fetchOverview}
              className="text-sm px-3 py-1 bg-[#7C9885]/10 text-[#7C9885] rounded hover:bg-[#7C9885]/20"
            >
              Refresh
            </button>
          </div>
        )}
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {/* LYNX Cash Overview */}
        <div className="bg-white rounded-xl border border-[#E8E8E6] p-5">
          <h2 className="text-sm font-medium text-[#636E72] mb-4">LYNX Account</h2>

          {!ibConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-700 text-sm">
              IB Gateway not connected. LYNX cash balance unavailable.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div>
              <div className="text-xs text-[#636E72]">LYNX Cash</div>
              <div className="text-lg font-bold text-[#2D3436]">{lynxCash.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Assigned</div>
              <div className="text-lg font-bold text-[#2D3436]">{totalAssigned.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Reserved</div>
              <div className="text-lg font-bold text-[#C9A962]">{totalReserved.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Available</div>
              <div className="text-lg font-bold text-[#2D3436]">{totalAvailable.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Unallocated</div>
              <div className={`text-lg font-bold ${overallocated ? 'text-red-500' : 'text-[#7C9885]'}`}>
                {unallocated.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Allocation bar */}
          {lynxCash > 0 && (
            <div className="w-full bg-[#E8E8E6] rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${overallocated ? 'bg-red-500' : 'bg-[#7C9885]'}`}
                style={{ width: `${Math.min(100, assignedPct)}%` }}
              />
            </div>
          )}
          {lynxCash > 0 && (
            <div className="text-xs text-[#636E72] mt-1">
              {assignedPct.toFixed(1)}% committed (assigned + reserved)
            </div>
          )}
        </div>

        {/* Virtual Accounts Table */}
        <div className="bg-white rounded-xl border border-[#E8E8E6] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E8E6]">
            <h2 className="text-sm font-medium text-[#636E72]">Virtual Accounts ({accounts.length})</h2>
          </div>

          {accounts.length === 0 ? (
            <div className="px-5 py-8 text-center text-[#636E72]">No virtual accounts found.</div>
          ) : (
            <div className="divide-y divide-[#E8E8E6]">
              {accounts.map((acc) => (
                <div key={acc.id} className="px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Account info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2D3436]">{acc.owner_name || `User #${acc.owner_id}`}</span>
                        <span className="text-xs text-[#636E72]">{acc.name}</span>
                        {!acc.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">inactive</span>
                        )}
                        {acc.is_frozen && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">FROZEN</span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-[#636E72]">
                        <span>Assigned: <strong>{(acc.assigned_cash || 0).toFixed(2)}</strong></span>
                        <span>Reserved: <strong>{(acc.reserved_cash || 0).toFixed(2)}</strong></span>
                        <span>Available: <strong>{(acc.available_cash || 0).toFixed(2)}</strong></span>
                        <span>Holdings: {acc.holdings_count}</span>
                      </div>
                    </div>

                    {/* Allocation control — set target assigned_cash */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#636E72]">Target:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={allocations[acc.id] ?? ''}
                        onChange={(e) => setAllocations(prev => ({ ...prev, [acc.id]: e.target.value }))}
                        className="w-28 px-3 py-1.5 border border-[#E8E8E6] rounded text-sm text-right focus:outline-none focus:border-[#7C9885]"
                        disabled={applying === acc.id || !acc.is_active || acc.is_frozen}
                      />
                      <button
                        onClick={() => handleAllocate(acc.id)}
                        disabled={applying === acc.id || !acc.is_active || acc.is_frozen}
                        className="px-3 py-1.5 bg-[#7C9885] text-white text-sm rounded hover:bg-[#6B8A74] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {applying === acc.id ? 'Applying...' : 'Set'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
