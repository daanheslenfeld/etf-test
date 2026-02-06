import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Globe, Check, Loader2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import DetailPageHeader, { getETFName } from './DetailPageHeader';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

const SYMBOL_ISIN_MAP = {
  IWDA: 'IE00B4L5Y983',
  VWCE: 'IE00BK5BQT80',
  EMIM: 'IE00BKM4GZ66',
  VUAA: 'IE00BFMXXD54',
  SXR8: 'IE00B5BMR087',
  CAC: 'LU1681048804',
  IWDP: 'IE00B1FZS350',
  SXRS: 'IE00B4PY7Y77',
  VFEM: 'IE00B3VVMM84',
  IMEU: 'IE00B4L5YV67',
  EUNH: 'IE00B4WXJJ64',
  IEAC: 'IE00B3F81R35',
  VAGE: 'IE00BG47KH54',
  SGLD: 'IE00B4ND3602',
  XEON: 'LU0290358497',
};

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
};

const formatPercent = (value) => {
  const num = parseFloat(value) || 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export default function BelegdVermogenDetail({ onBack, user }) {
  const { positions, portfolioValue, unrealizedPnL, unrealizedPnLPercent } = useTrading();
  const [showPublish, setShowPublish] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    if (!communityName.trim() || communityName.trim().length < 3) return;
    setIsPublishing(true);
    setPublishError(null);

    try {
      const totalValue = positions.reduce((sum, p) => sum + (parseFloat(p.market_value) || 0), 0);
      const holdings = positions.map(p => ({
        isin: p.isin || SYMBOL_ISIN_MAP[p.symbol] || p.symbol,
        name: getETFName(p),
        weight: totalValue > 0 ? Math.round((parseFloat(p.market_value) || 0) / totalValue * 100) : 0,
        category: null,
      }));

      const params = new URLSearchParams({
        creator_id: String(user?.id || 'anonymous'),
        creator_name: communityName.trim(),
      });

      const response = await fetch(`${TRADING_API_URL}/portfolios/?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          name: `${communityName.trim()}'s Portfolio`,
          description: null,
          visibility: 'public',
          holdings,
          risk_level: 3,
          tags: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Publiceren mislukt');
      }
      setPublished(true);
    } catch (err) {
      setPublishError(err.message || 'Er ging iets mis bij het publiceren');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <DetailPageHeader title="Belegd Vermogen" onBack={onBack}>
      {/* Summary Card */}
      <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[#B2BEC3] font-medium mb-1">Totaal Belegd</div>
            <div className="text-lg sm:text-xl font-bold text-[#2D3436] tabular-nums">
              {formatCurrency(portfolioValue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] font-medium mb-1">Posities</div>
            <div className="text-lg sm:text-xl font-bold text-[#2D3436]">
              {positions.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#B2BEC3] font-medium mb-1">Rendement</div>
            <div className={`text-lg sm:text-xl font-bold tabular-nums ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
              {formatPercent(unrealizedPnLPercent)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {positions.map((pos, idx) => {
          const qty = parseFloat(pos.quantity) || 0;
          const avgCost = parseFloat(pos.avg_cost) || 0;
          const lastPrice = parseFloat(pos.last_price) || avgCost;
          const marketValue = parseFloat(pos.market_value) || 0;
          const pnl = parseFloat(pos.unrealized_pnl) || 0;
          const pnlPct = parseFloat(pos.unrealized_pnl_pct) || 0;
          const isPositive = pnl >= 0;

          return (
            <div key={idx} className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-medium text-[#2D3436] text-sm truncate">{getETFName(pos)}</div>
                  <div className="text-xs text-[#B2BEC3]">{pos.symbol}</div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span className="tabular-nums">{formatPercent(pnlPct)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#B2BEC3]">Aantal</span>
                  <div className="font-medium text-[#2D3436] tabular-nums">{qty.toFixed(0)}</div>
                </div>
                <div>
                  <span className="text-[#B2BEC3]">Gem. Koers</span>
                  <div className="font-medium text-[#636E72] tabular-nums">{formatCurrency(avgCost)}</div>
                </div>
                <div>
                  <span className="text-[#B2BEC3]">Huidige Koers</span>
                  <div className="font-medium text-[#2D3436] tabular-nums">{formatCurrency(lastPrice)}</div>
                </div>
                <div>
                  <span className="text-[#B2BEC3]">Waarde</span>
                  <div className="font-semibold text-[#2D3436] tabular-nums">{formatCurrency(marketValue)}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#E8E8E6] flex justify-between items-center text-xs">
                <span className="text-[#B2BEC3]">W/V</span>
                <span className={`font-medium tabular-nums ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                  {formatCurrency(pnl)} ({formatPercent(pnlPct)})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <table className="w-full">
          <thead className="bg-[#F5F6F4]">
            <tr>
              <th className="text-left text-[#636E72] text-xs font-medium px-5 py-3">ETF</th>
              <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Aantal</th>
              <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Gem. Koers</th>
              <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Huidige Koers</th>
              <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">Waarde</th>
              <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">W/V</th>
              <th className="text-right text-[#636E72] text-xs font-medium px-5 py-3">W/V %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E6]">
            {positions.map((pos, idx) => {
              const qty = parseFloat(pos.quantity) || 0;
              const avgCost = parseFloat(pos.avg_cost) || 0;
              const lastPrice = parseFloat(pos.last_price) || avgCost;
              const marketValue = parseFloat(pos.market_value) || 0;
              const pnl = parseFloat(pos.unrealized_pnl) || 0;
              const pnlPct = parseFloat(pos.unrealized_pnl_pct) || 0;
              const isPositive = pnl >= 0;

              return (
                <tr key={idx} className="hover:bg-[#F5F6F4] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#2D3436] text-sm truncate max-w-[220px]" title={getETFName(pos)}>
                      {getETFName(pos)}
                    </div>
                    <div className="text-xs text-[#B2BEC3]">{pos.symbol}</div>
                  </td>
                  <td className="px-5 py-4 text-right text-[#2D3436] text-sm tabular-nums">{qty.toFixed(0)}</td>
                  <td className="px-5 py-4 text-right text-[#636E72] text-sm tabular-nums">{formatCurrency(avgCost)}</td>
                  <td className="px-5 py-4 text-right text-[#2D3436] text-sm tabular-nums">{formatCurrency(lastPrice)}</td>
                  <td className="px-5 py-4 text-right text-[#2D3436] font-medium text-sm tabular-nums">{formatCurrency(marketValue)}</td>
                  <td className={`px-5 py-4 text-right font-medium text-sm tabular-nums ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {formatCurrency(pnl)}
                  </td>
                  <td className={`px-5 py-4 text-right font-medium text-sm ${isPositive ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    <div className="flex items-center justify-end gap-1 tabular-nums">
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatPercent(pnlPct)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals Row */}
          <tfoot className="bg-[#F5F6F4] border-t-2 border-[#E8E8E6]">
            <tr>
              <td className="px-5 py-3 font-semibold text-sm text-[#2D3436]">Totaal</td>
              <td className="px-5 py-3 text-right text-sm text-[#636E72] tabular-nums">
                {positions.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toFixed(0)}
              </td>
              <td className="px-5 py-3"></td>
              <td className="px-5 py-3"></td>
              <td className="px-5 py-3 text-right font-semibold text-sm text-[#2D3436] tabular-nums">
                {formatCurrency(portfolioValue)}
              </td>
              <td className={`px-5 py-3 text-right font-semibold text-sm tabular-nums ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                {formatCurrency(unrealizedPnL)}
              </td>
              <td className={`px-5 py-3 text-right font-semibold text-sm tabular-nums ${unrealizedPnL >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                {formatPercent(unrealizedPnLPercent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Publish to Community */}
      {positions.length > 0 && (
        <div className="mt-6">
          {published ? (
            <div className="bg-[#FEFEFE] border border-[#7C9885] rounded-2xl p-5 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7C9885]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#7C9885]" />
                </div>
                <div>
                  <div className="font-medium text-[#2D3436]">Portfolio gepubliceerd!</div>
                  <div className="text-xs text-[#636E72]">Je portfolio is zichtbaar in de community</div>
                </div>
              </div>
            </div>
          ) : !showPublish ? (
            <button
              onClick={() => setShowPublish(true)}
              className="w-full bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 shadow-[0_2px_8px_rgba(45,52,54,0.06)] hover:border-[#7C9885] transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-[#7C9885]/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#7C9885]" />
              </div>
              <div className="text-left">
                <div className="font-medium text-[#2D3436] text-sm">Publiceer in community</div>
                <div className="text-xs text-[#636E72]">Deel je portfolio met andere beleggers</div>
              </div>
            </button>
          ) : (
            <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-5 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#7C9885]/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#7C9885]" />
                </div>
                <div>
                  <div className="font-medium text-[#2D3436] text-sm">Publiceer in community</div>
                  <div className="text-xs text-[#636E72]">Kies een naam voor je community profiel</div>
                </div>
              </div>
              <input
                type="text"
                value={communityName}
                onChange={e => setCommunityName(e.target.value)}
                placeholder="Jouw community naam..."
                className="w-full px-4 py-2.5 bg-[#F5F6F4] border border-[#E8E8E6] rounded-xl text-sm text-[#2D3436] placeholder:text-[#B2BEC3] focus:outline-none focus:ring-2 focus:ring-[#7C9885]/30 focus:border-[#7C9885] mb-3"
              />
              {publishError && (
                <div className="text-xs text-[#C0736D] mb-3">{publishError}</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPublish(false); setPublishError(null); }}
                  className="flex-1 px-4 py-2.5 text-sm text-[#636E72] bg-[#F5F6F4] rounded-xl hover:bg-[#E8E8E6] transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || communityName.trim().length < 3}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-[#7C9885] rounded-xl hover:bg-[#6B8574] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Publiceren...</>
                  ) : (
                    <><Globe className="w-4 h-4" /> Publiceren</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {positions.length === 0 && (
        <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-10 text-center shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
          <BarChart3 className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
          <p className="text-[#636E72]">Geen posities gevonden</p>
        </div>
      )}
    </DetailPageHeader>
  );
}
