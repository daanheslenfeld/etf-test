import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://37.97.173.109:8002';
const API_URL = '/api';

const fmt = (v) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(v || 0);

function getAuthHeaders(user) {
  const customerId = user?.role === 'accountmanager' ? '0' : String(user?.id ?? 0);
  return {
    'Content-Type': 'application/json',
    'X-Customer-ID': customerId,
    'X-Customer-Email': user?.email || 'admin@etfportal.nl',
    'ngrok-skip-browser-warning': 'true',
  };
}

export function AdminCashAllocation({ user, onBack, embedded }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allocations, setAllocations] = useState({});
  const [applying, setApplying] = useState(null);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [accountPositions, setAccountPositions] = useState({});
  // Remove cash modal state
  const [removeModal, setRemoveModal] = useState(null); // { accountId, ownerName, available }
  const [removeAmount, setRemoveAmount] = useState('');

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

      const initial = {};
      for (const acc of data.accounts) {
        initial[acc.id] = '';
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
      if (!accountPositions[accountId] || accountPositions[accountId].error) {
        fetchPositions(accountId);
      }
    }
  };

  const handleAllocate = async (accountId) => {
    const delta = parseFloat(allocations[accountId]);
    if (isNaN(delta) || delta <= 0) {
      setError('Enter a positive amount to add');
      return;
    }

    const acc = (overview?.accounts || []).find(a => a.id === accountId);

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

      try {
          await fetch(`${API_URL}/notify-allocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ownerId: acc.owner_id,
              ownerName: acc.owner_name,
              amount: (acc.assigned_cash || 0) + delta,
            }),
          });
        } catch (_) { /* email is best-effort */ }

      setAllocations(prev => ({ ...prev, [accountId]: '' }));
      await fetchOverview();
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(null);
    }
  };

  const handleRemoveCash = async () => {
    if (!removeModal) return;
    const amount = parseFloat(removeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return;
    }
    if (amount > removeModal.available + 0.01) {
      setError(`Cannot remove more than available cash (${fmt(removeModal.available)})`);
      return;
    }

    setApplying(removeModal.accountId);
    setError(null);

    try {
      const acc = (overview?.accounts || []).find(a => a.id === removeModal.accountId);
      const res = await fetch(`${TRADING_API_URL}/virtual-accounts/${removeModal.accountId}/allocate`, {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ delta: -amount, description: `Admin removed ${amount} EUR` }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || `HTTP ${res.status}`);
      }
      setRemoveModal(null);
      setRemoveAmount('');
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
        <div className="text-[#636E72]">Loading capital overview...</div>
      </div>
    );
  }

  const brokerTotalEquity = overview?.broker_total_equity ?? overview?.lynx_cash ?? 0;
  const brokerAvailableCash = overview?.lynx_cash ?? 0;
  const totalAssigned = overview?.total_assigned ?? 0;
  const totalReserved = overview?.total_reserved ?? 0;
  const totalAvailable = overview?.total_available ?? 0;
  const totalPortfolioValue = overview?.total_portfolio_value ?? 0;
  const unallocated = overview?.unallocated ?? 0;
  const ibConnected = overview?.ib_connected ?? false;
  const overallocated = overview?.overallocated ?? false;
  const accounts = overview?.accounts ?? [];

  // Actual cash claims = available + reserved (invested cash is backed by real broker positions)
  const totalCashClaims = totalAvailable + totalReserved;
  const claimsPct = brokerAvailableCash > 0 ? (totalCashClaims / brokerAvailableCash) * 100 : 0;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-[#F5F5F3]'}>
      {/* Header - standalone mode only */}
      {!embedded && (
        <div className="bg-white border-b border-[#E8E8E6] px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button onClick={onBack} className="text-[#636E72] hover:text-[#2D3436] transition-colors">
              ← Back
            </button>
            <h1 className="text-xl font-bold text-[#2D3436]">Capital Allocation</h1>
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

        {/* ============================================================ */}
        {/* BROKER CAPITAL OVERVIEW                                      */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-[#E8E8E6] p-5">
          <h2 className="text-sm font-medium text-[#636E72] mb-4">Broker Account (LYNX / IB)</h2>

          {!ibConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-700 text-sm">
              IB Gateway not connected. Broker data unavailable.
            </div>
          )}

          {/* Primary metrics: 4 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-[#F5F6F4] rounded-lg p-3">
              <div className="text-xs text-[#636E72] mb-1">Broker Available Cash</div>
              <div className="text-xl font-bold text-[#2D3436]">{fmt(brokerAvailableCash)}</div>
            </div>
            <div className="bg-[#F5F6F4] rounded-lg p-3">
              <div className="text-xs text-[#636E72] mb-1">Customer Cash Claims</div>
              <div className="text-xl font-bold text-[#6B7B8A]">{fmt(totalCashClaims)}</div>
              <div className="text-[10px] text-[#B2BEC3] mt-0.5">available + reserved</div>
            </div>
            <div className="bg-[#F5F6F4] rounded-lg p-3">
              <div className="text-xs text-[#636E72] mb-1">Customer Investments</div>
              <div className="text-xl font-bold text-[#6B7B8A]">{fmt(totalPortfolioValue)}</div>
              <div className="text-[10px] text-[#B2BEC3] mt-0.5">backed by broker positions</div>
            </div>
            <div className={`rounded-lg p-3 ${overallocated ? 'bg-red-50' : 'bg-[#7C9885]/10'}`}>
              <div className="text-xs text-[#636E72] mb-1">Free to Assign</div>
              <div className={`text-xl font-bold ${overallocated ? 'text-red-500' : 'text-[#7C9885]'}`}>
                {fmt(unallocated)}
              </div>
            </div>
          </div>

          {/* Secondary metrics */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#636E72] mb-3">
            <span>Broker Total Equity: <strong className="text-[#2D3436]">{fmt(brokerTotalEquity)}</strong></span>
            <span>Total Assigned (ledger): <strong className="text-[#2D3436]">{fmt(totalAssigned)}</strong></span>
            {totalReserved > 0 && (
              <span>Reserved (pending orders): <strong className="text-[#C9A962]">{fmt(totalReserved)}</strong></span>
            )}
          </div>

          {/* Allocation bar */}
          {brokerAvailableCash > 0 && (
            <>
              <div className="w-full bg-[#E8E8E6] rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overallocated ? 'bg-red-500' : 'bg-[#7C9885]'}`}
                  style={{ width: `${Math.min(100, claimsPct)}%` }}
                />
              </div>
              <div className="text-xs text-[#636E72] mt-1">
                {claimsPct.toFixed(1)}% of broker cash claimed by customers
              </div>
            </>
          )}
        </div>

        {/* ============================================================ */}
        {/* CUSTOMER ACCOUNTS TABLE                                      */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-[#E8E8E6] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E8E6]">
            <h2 className="text-sm font-medium text-[#636E72]">Customer Accounts ({accounts.length})</h2>
          </div>

          {/* Column headers (desktop) */}
          {accounts.length > 0 && (
            <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2 text-xs text-[#636E72] border-b border-[#E8E8E6] bg-[#F5F6F4]">
              <div className="col-span-3">Customer</div>
              <div className="col-span-2 text-right">Assigned Cash</div>
              <div className="col-span-2 text-right">Available Cash</div>
              <div className="col-span-2 text-right">Invested</div>
              <div className="col-span-3 text-right">Add Cash</div>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="px-5 py-8 text-center text-[#636E72]">No customer accounts found.</div>
          ) : (
            <div className="divide-y divide-[#E8E8E6]">
              {accounts.map((acc) => {
                const isExpanded = expandedAccount === acc.id;
                const posData = accountPositions[acc.id];

                return (
                  <div key={acc.id}>
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-4 items-center">
                      {/* Customer name */}
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => toggleExpand(acc.id)}
                          className="text-[#636E72] hover:text-[#2D3436] transition-colors flex-shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="truncate">
                          <span className="font-medium text-[#2D3436]">{acc.owner_name || `User #${acc.owner_id}`}</span>
                          {acc.is_frozen && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">FROZEN</span>
                          )}
                          {!acc.is_active && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">inactive</span>
                          )}
                        </div>
                      </div>

                      {/* Assigned Cash */}
                      <div className="col-span-2 text-right font-medium text-[#2D3436] tabular-nums">
                        {fmt(acc.assigned_cash)}
                      </div>

                      {/* Available Cash */}
                      <div className="col-span-2 text-right text-[#636E72] tabular-nums">
                        {fmt(acc.available_cash)}
                      </div>

                      {/* Invested (portfolio value) */}
                      <div className="col-span-2 text-right text-[#6B7B8A] tabular-nums">
                        {fmt(acc.portfolio_value)}
                      </div>

                      {/* Actions: assign + remove */}
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={allocations[acc.id] ?? ''}
                          onChange={(e) => setAllocations(prev => ({ ...prev, [acc.id]: e.target.value }))}
                          className="w-24 px-2 py-1.5 border border-[#E8E8E6] rounded text-sm text-right focus:outline-none focus:border-[#7C9885]"
                          disabled={applying === acc.id || !acc.is_active || acc.is_frozen}
                          placeholder="Amount"
                        />
                        <button
                          onClick={() => handleAllocate(acc.id)}
                          disabled={applying === acc.id || !acc.is_active || acc.is_frozen}
                          className="p-1.5 bg-[#7C9885] text-white rounded hover:bg-[#6B8A74] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add cash to account"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRemoveModal({ accountId: acc.id, ownerName: acc.owner_name, available: acc.available_cash });
                            setRemoveAmount('');
                          }}
                          disabled={applying === acc.id || !acc.is_active || acc.is_frozen || acc.available_cash <= 0}
                          className="p-1.5 bg-[#C0736D] text-white rounded hover:bg-[#B06359] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove cash"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="sm:hidden px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleExpand(acc.id)}
                          className="text-[#636E72] hover:text-[#2D3436] transition-colors flex-shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span className="font-medium text-[#2D3436]">{acc.owner_name || `User #${acc.owner_id}`}</span>
                        {acc.is_frozen && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">FROZEN</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3 ml-6">
                        <div>
                          <div className="text-[#636E72]">Assigned</div>
                          <div className="font-medium text-[#2D3436]">{fmt(acc.assigned_cash)}</div>
                        </div>
                        <div>
                          <div className="text-[#636E72]">Available</div>
                          <div className="font-medium text-[#636E72]">{fmt(acc.available_cash)}</div>
                        </div>
                        <div>
                          <div className="text-[#636E72]">Invested</div>
                          <div className="font-medium text-[#6B7B8A]">{fmt(acc.portfolio_value)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={allocations[acc.id] ?? ''}
                          onChange={(e) => setAllocations(prev => ({ ...prev, [acc.id]: e.target.value }))}
                          className="flex-1 px-2 py-1.5 border border-[#E8E8E6] rounded text-sm text-right focus:outline-none focus:border-[#7C9885]"
                          disabled={applying === acc.id || !acc.is_active || acc.is_frozen}
                          placeholder="Amount"
                        />
                        <button
                          onClick={() => handleAllocate(acc.id)}
                          disabled={applying === acc.id || !acc.is_active || acc.is_frozen}
                          className="px-3 py-1.5 bg-[#7C9885] text-white text-sm rounded hover:bg-[#6B8A74] disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setRemoveModal({ accountId: acc.id, ownerName: acc.owner_name, available: acc.available_cash });
                            setRemoveAmount('');
                          }}
                          disabled={applying === acc.id || !acc.is_active || acc.is_frozen || acc.available_cash <= 0}
                          className="px-3 py-1.5 bg-[#C0736D] text-white text-sm rounded hover:bg-[#B06359] disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Expanded: Holdings table */}
                    {isExpanded && (
                      <div className="px-5 py-4 bg-[#F5F6F4] border-t border-[#E8E8E6]">
                        {posData?.loading ? (
                          <div className="text-sm text-[#636E72] text-center py-4">Loading positions...</div>
                        ) : posData?.error ? (
                          <div className="text-sm text-red-500 text-center py-4">{posData.error}</div>
                        ) : !posData?.positions?.length ? (
                          <div className="text-sm text-[#636E72] text-center py-4">No positions</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-[#636E72] border-b border-[#E8E8E6]">
                                  <th className="text-left py-2 pr-4">Symbol</th>
                                  <th className="text-right py-2 px-3">Qty</th>
                                  <th className="text-right py-2 px-3">Avg Cost</th>
                                  <th className="text-right py-2 px-3">Price</th>
                                  <th className="text-right py-2 px-3">Value</th>
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
                                  <td className="py-2 pr-4" colSpan={4}>Total</td>
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

      {/* Remove Cash Modal */}
      {removeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-[#2D3436] mb-2">Remove Cash</h3>
            <p className="text-sm text-[#636E72] mb-4">
              Remove cash from <strong>{removeModal.ownerName}</strong>.
              <br />Available: <strong>{fmt(removeModal.available)}</strong>
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              max={removeModal.available}
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
              placeholder="Amount to remove"
              className="w-full px-3 py-2 border border-[#E8E8E6] rounded-lg text-right mb-4 focus:outline-none focus:border-[#7C9885]"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRemoveModal(null); setRemoveAmount(''); }}
                className="flex-1 px-4 py-2 border border-[#E8E8E6] rounded-lg text-[#636E72] hover:bg-[#F5F6F4]"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveCash}
                disabled={!removeAmount || parseFloat(removeAmount) <= 0 || applying}
                className="flex-1 px-4 py-2 bg-[#C0736D] text-white rounded-lg hover:bg-[#B06359] disabled:opacity-50"
              >
                {applying ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
