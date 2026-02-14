/**
 * PerformanceChart Component
 *
 * Displays performance history for a portfolio using snapshots.
 * Shows either a simple line chart or a table view.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  BarChart3,
  Table,
  Loader2,
} from 'lucide-react';

// API base URL
const API_BASE = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Period labels
const PERIOD_LABELS = {
  daily: 'Dagelijks',
  monthly: 'Maandelijks',
  quarterly: 'Kwartaal',
};

export default function PerformanceChart({ portfolioId, showTitle = true }) {
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(null); // null = all
  const [viewMode, setViewMode] = useState('chart'); // chart or table

  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (period) {
        params.append('period', period);
      }
      const response = await fetch(
        `${API_BASE}/community/portfolio/${portfolioId}/snapshots?${params}`
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Performance data is only available for public portfolios');
        }
        throw new Error('Failed to load performance data');
      }
      const data = await response.json();
      setSnapshots(data.snapshots || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, period]);

  useEffect(() => {
    if (portfolioId) {
      fetchSnapshots();
    }
  }, [portfolioId, fetchSnapshots]);

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!snapshots.length) return { points: [], min: 0, max: 0 };

    // Sort by timestamp ascending for chart
    const sorted = [...snapshots].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    const values = sorted.map(s => s.total_value);
    const min = Math.min(...values) * 0.98;
    const max = Math.max(...values) * 1.02;

    return {
      points: sorted.map((s, i) => ({
        x: i,
        value: s.total_value,
        returnPct: s.cumulative_return_pct,
        date: new Date(s.timestamp).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'short',
        }),
        fullDate: new Date(s.timestamp).toLocaleDateString('nl-NL'),
      })),
      min,
      max,
    };
  }, [snapshots]);

  // Get latest stats
  const latestSnapshot = snapshots[0];
  const isPositive = latestSnapshot?.cumulative_return_pct >= 0;

  if (isLoading) {
    return (
      <div className="bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#636E72] animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <p className="text-[#636E72] text-center">{error}</p>
      </div>
    );
  }

  if (!snapshots.length) {
    return (
      <div className="bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="text-center py-8">
          <BarChart3 className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
          <p className="text-[#636E72]">Nog geen performance data beschikbaar</p>
          <p className="text-[#B2BEC3] text-sm mt-1">
            Snapshots worden dagelijks gegenereerd
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FEFEFE] rounded-xl border border-[#E8E8E6] overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Header */}
      {showTitle && (
        <div className="p-4 border-b border-[#E8E8E6]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#7C9885]" />
              Performance
            </h3>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-[#F5F6F4] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'chart'
                      ? 'bg-[#7C9885] text-white'
                      : 'text-[#636E72] hover:text-[#2D3436]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#7C9885] text-white'
                      : 'text-[#636E72] hover:text-[#2D3436]'
                  }`}
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>
              {/* Refresh */}
              <button
                onClick={fetchSnapshots}
                className="p-1.5 rounded-lg text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setPeriod(null)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                period === null
                  ? 'bg-[#7C9885] text-white'
                  : 'bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              Alle
            </button>
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  period === key
                    ? 'bg-[#7C9885] text-white'
                    : 'bg-[#F5F6F4] text-[#636E72] hover:text-[#2D3436]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {latestSnapshot && (
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#E8E8E6]">
          <div>
            <div className="text-xs text-[#B2BEC3] mb-1">Totale waarde</div>
            <div className="text-lg font-bold text-[#2D3436]">
              €{latestSnapshot.total_value.toLocaleString('nl-NL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] mb-1">Totaal rendement</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${
              isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {isPositive ? '+' : ''}{latestSnapshot.cumulative_return_pct.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] mb-1">Laatste update</div>
            <div className="text-sm text-[#636E72] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(latestSnapshot.timestamp).toLocaleDateString('nl-NL')}
            </div>
          </div>
        </div>
      )}

      {/* Chart or Table view */}
      {viewMode === 'chart' ? (
        <div className="p-4">
          {/* Simple SVG line chart */}
          <div className="h-48 relative">
            {chartData.points.length > 1 ? (
              <svg
                viewBox={`0 0 ${chartData.points.length * 30} 100`}
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2={chartData.points.length * 30}
                    y2={y}
                    stroke="#E8E8E6"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Line path */}
                <path
                  d={chartData.points
                    .map((p, i) => {
                      const x = i * 30 + 15;
                      const y = 100 - ((p.value - chartData.min) / (chartData.max - chartData.min)) * 100;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={isPositive ? '#7C9885' : '#C0736D'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Area fill */}
                <path
                  d={`
                    ${chartData.points
                      .map((p, i) => {
                        const x = i * 30 + 15;
                        const y = 100 - ((p.value - chartData.min) / (chartData.max - chartData.min)) * 100;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    L ${(chartData.points.length - 1) * 30 + 15} 100
                    L 15 100
                    Z
                  `}
                  fill={isPositive ? 'rgba(124, 152, 133, 0.1)' : 'rgba(192, 115, 109, 0.1)'}
                />

                {/* Data points */}
                {chartData.points.map((p, i) => {
                  const x = i * 30 + 15;
                  const y = 100 - ((p.value - chartData.min) / (chartData.max - chartData.min)) * 100;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={isPositive ? '#7C9885' : '#C0736D'}
                      className="opacity-0 hover:opacity-100 transition-opacity"
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-[#B2BEC3]">
                Meer data nodig voor grafiek
              </div>
            )}
          </div>

          {/* X-axis labels */}
          {chartData.points.length > 1 && (
            <div className="flex justify-between mt-2 text-xs text-[#B2BEC3]">
              <span>{chartData.points[0]?.date}</span>
              <span>{chartData.points[chartData.points.length - 1]?.date}</span>
            </div>
          )}
        </div>
      ) : (
        // Table view
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#FEFEFE]">
              <tr className="text-xs text-[#B2BEC3] border-b border-[#E8E8E6]">
                <th className="text-left p-3">Datum</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Waarde</th>
                <th className="text-right p-3">Rendement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E6]">
              {snapshots.map(snap => {
                const isPos = snap.return_pct >= 0;
                return (
                  <tr key={snap.id} className="text-sm hover:bg-[#F5F6F4]">
                    <td className="p-3 text-[#636E72]">
                      {new Date(snap.timestamp).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        snap.period_type === 'daily'
                          ? 'bg-[#5B8A9A]/20 text-[#5B8A9A]'
                          : snap.period_type === 'monthly'
                          ? 'bg-[#8B7B9A]/20 text-[#8B7B9A]'
                          : 'bg-[#C9A962]/20 text-[#C9A962]'
                      }`}>
                        {PERIOD_LABELS[snap.period_type] || snap.period_type}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[#2D3436] font-medium">
                      €{snap.total_value.toLocaleString('nl-NL', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className={`p-3 text-right font-medium ${
                      isPos ? 'text-[#7C9885]' : 'text-[#C0736D]'
                    }`}>
                      {isPos ? '+' : ''}{snap.return_pct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
