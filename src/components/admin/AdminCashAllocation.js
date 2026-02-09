import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';
const API_URL = '/api';

const fmt = (v) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(v || 0);

function getAuthHeaders(user) {
  return {
    'Content-Type': 'application/json',
    'X-Customer-ID': String(user?.id ?? 0),
    'X-Customer-Email': user?.email || 'admin@etfportal.nl',
    'ngrok-skip-browser-warning': 'true',
  };
}

export function AdminCashAllocation({ user, onBack, embedded }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allocations, setAllocations] = useState({}); // { [accountId]: targetAmount }
  const [applying, setApplying] = useState(null); // accountId being applied
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [accountPositions, setAccountPositions] = useState({}); // { [accountId]: { positions, loading, error } }

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

  const fetchPositions = useCallback(async (accountId) => {
    setAccountPositions(prev => ({ ...prev, [accountId]: { positions: [], loading: true, error: null } }));
    try {
      const res = await fetch(`${TRADING_API_URL}/virtual-accounts/admin/account-positions/${accountId}`, {
        headers: getAuthHeaders(user),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAccountPositions(prev => ({ ...prev, [accountId]: { ...data, loading: false, error: null } }));
    } catch (err) {
      setAccountPositions(prev => ({ ...prev, [accountId]: { positions: [], loading: false, error: err.message } }));
    }
  }, [user]);

  const toggleExpand = (accountId) => {
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
    } else {
      setExpandedAccount(accountId);
      // Fetch positions if not already loaded
      if (!accountPositions[accountId] || accountPositions[accountId].error) {
        fetchPositions(accountId);
      }
    }
  };

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

      // Send email notification to account owner (best effort)
      if (delta > 0) {
        try {
          await fetch(`${API_URL}/notify-allocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ownerId: acc.owner_id,
              ownerName: acc.owner_name,
              amount: target,
            }),
          });
        } catch (_) { /* email is best-effort */ }
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
  const totalPortfolioValue = overview?.total_portfolio_value ?? 0;
  const grandTotalValue = overview?.grand_total_value ?? 0;
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

          <div className="grid grid-cols-3 sm:grid-cols-7 gap-4 mb-4">
            <div>
              <div className="text-xs text-[#636E72]">LYNX Cash</div>
              <div className="text-lg font-bold text-[#2D3436]">{fmt(lynxCash)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Assigned</div>
              <div className="text-lg font-bold text-[#2D3436]">{fmt(totalAssigned)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Reserved</div>
              <div className="text-lg font-bold text-[#C9A962]">{fmt(totalReserved)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Cash Beschikbaar</div>
              <div className="text-lg font-bold text-[#2D3436]">{fmt(totalAvailable)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Portfolio Waarde</div>
              <div className="text-lg font-bold text-[#6B7B8A]">{fmt(totalPortfolioValue)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Totaal Waarde</div>
              <div className="text-lg font-bold text-[#7C9885]">{fmt(grandTotalValue)}</div>
            </div>
            <div>
              <div className="text-xs text-[#636E72]">Unallocated</div>
              <div className={`text-lg font-bold ${overallocated ? 'text-red-500' : 'text-[#7C9885]'}`}>
                {fmt(unallocated)}
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
              {accounts.map((acc) => {
                const isExpanded = expandedAccount === acc.id;
                const posData = accountPositions[acc.id];

                return (
                  <div key={acc.id}>
                    <div className="px-5 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Expand toggle + Account info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(acc.id)}
                              className="text-[#636E72] hover:text-[#2D3436] transition-colors flex-shrink-0"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <span className="font-medium text-[#2D3436]">{acc.owner_name || `User #${acc.owner_id}`}</span>
                            <span className="text-xs text-[#636E72]">{acc.name}</span>
                            {!acc.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">inactive</span>
                            )}
                            {acc.is_frozen && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">FROZEN</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[#636E72] ml-6">
                            <span>Cash: <strong>{fmt(acc.available_cash)}</strong></span>
                            <span>Portfolio: <strong className="text-[#6B7B8A]">{fmt(acc.portfolio_value)}</strong></span>
                            <span>Totaal: <strong className="text-[#7C9885]">{fmt(acc.total_value)}</strong></span>
                            <span className="text-[#B2BEC3]">Assigned: {fmt(acc.assigned_cash)}</span>
                            <span className="text-[#B2BEC3]">Holdings: {acc.holdings_count}</span>
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

                    {/* Expanded: Holdings table */}
                    {isExpanded && (
                      <div className="px-5 py-4 bg-[#F5F6F4] border-t border-[#E8E8E6]">
                        {posData?.loading ? (
                          <div className="text-sm text-[#636E72] text-center py-4">Posities laden...</div>
                        ) : posData?.error ? (
                          <div className="text-sm text-red-500 text-center py-4">{posData.error}</div>
                        ) : !posData?.positions?.length ? (
                          <div className="text-sm text-[#636E72] text-center py-4">Geen posities</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-[#636E72] border-b border-[#E8E8E6]">
                                  <th className="text-left py-2 pr-4">Symbol</th>
                                  <th className="text-right py-2 px-3">Aantal</th>
                                  <th className="text-right py-2 px-3">Gem. Kosten</th>
                                  <th className="text-right py-2 px-3">Koers</th>
                                  <th className="text-right py-2 px-3">Waarde</th>
                                  <th className="text-right py-2 pl-3">P&L</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E8E8E6]/50">
                                {posData.positions.map((p, i) => (
                                  <tr key={i} className="text-[#2D3436]">
                                    <td className="py-2 pr-4 font-medium">{p.symbol}</td>
                                    <td className="py-2 px-3 text-right tabular-nums">{p.quantity}</td>
                                    <td className="py-2 px-3 text-right tabular-nums">{fmt(p.avg_cost_basis)}</td>
                                    <td className="py-2 px-3 text-right tabular-nums">{fmt(p.last_price)}</td>
                                    <td className="py-2 px-3 text-right tabular-nums">{fmt(p.market_value)}</td>
                                    <td className={`py-2 pl-3 text-right tabular-nums font-medium ${p.unrealized_pnl >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                                      {fmt(p.unrealized_pnl)} ({p.unrealized_pnl_pct >= 0 ? '+' : ''}{p.unrealized_pnl_pct}%)
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-[#E8E8E6] font-medium text-[#2D3436]">
                                  <td className="py-2 pr-4" colSpan={4}>Totaal</td>
                                  <td className="py-2 px-3 text-right tabular-nums">{fmt(posData.total_market_value)}</td>
                                  <td className={`py-2 pl-3 text-right tabular-nums ${(posData.total_unrealized_pnl || 0) >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                                    {fmt(posData.total_unrealized_pnl)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
