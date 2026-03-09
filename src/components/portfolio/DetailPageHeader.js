import React from 'react';
import { ArrowLeft, Wifi, WifiOff, Clock } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

// Shared ETF display info - single source of truth
// displayName: clear description of what you invest in
// provider: fund provider name
export const ETF_INFO = {
  // World / Global
  IWDA: { displayName: 'Wereld - Ontwikkelde Landen', provider: 'iShares (MSCI World)' },
  VWCE: { displayName: 'Wereld - Alle Landen', provider: 'Vanguard (FTSE All-World)' },
  VWRL: { displayName: 'Wereld - Alle Landen (Dividend)', provider: 'Vanguard (FTSE All-World)' },
  SWRD: { displayName: 'Wereld - Ontwikkelde Landen', provider: 'SPDR (MSCI World)' },
  // US
  VUAA: { displayName: 'Verenigde Staten - S&P 500', provider: 'Vanguard' },
  SXR8: { displayName: 'Verenigde Staten - S&P 500', provider: 'iShares' },
  CSPX: { displayName: 'Verenigde Staten - S&P 500', provider: 'iShares' },
  EQQQ: { displayName: 'Verenigde Staten - Nasdaq 100', provider: 'Invesco' },
  IUSN: { displayName: 'Verenigde Staten - Small Cap', provider: 'iShares (MSCI USA Small Cap)' },
  // Europe
  CEU2: { displayName: 'Europa - Aandelen', provider: 'Amundi (MSCI Europe)' },
  MEUD: { displayName: 'Europa - Aandelen', provider: 'Amundi (STOXX Europe 600)' },
  IEUR: { displayName: 'Europa - Aandelen', provider: 'iShares (MSCI Europe)' },
  // Emerging markets
  EMIM: { displayName: 'Opkomende Landen', provider: 'iShares (MSCI Emerging Markets)' },
  VFEM: { displayName: 'Opkomende Landen', provider: 'Vanguard (FTSE Emerging Markets)' },
  // Japan
  LCUJ: { displayName: 'Japan - Aandelen', provider: 'Amundi (MSCI Japan)' },
  IJPA: { displayName: 'Japan - Aandelen', provider: 'iShares (MSCI Japan)' },
  // Bonds
  EUNH: { displayName: 'Europese Staatsobligaties', provider: 'iShares' },
  IEAC: { displayName: 'Europese Bedrijfsobligaties', provider: 'iShares' },
  VAGE: { displayName: 'Wereldwijde Obligaties', provider: 'Vanguard' },
  AGGH: { displayName: 'Wereldwijde Obligaties (Hedged)', provider: 'iShares' },
  // Commodities
  SGLD: { displayName: 'Goud', provider: 'Invesco (Physical Gold)' },
  IGLN: { displayName: 'Goud', provider: 'iShares (Physical Gold)' },
  // Real estate
  IWDP: { displayName: 'Wereldwijd Vastgoed', provider: 'iShares' },
  // Money market
  XEON: { displayName: 'Geldmarkt (Euro)', provider: 'Xtrackers' },
  // Small cap
  ZPRV: { displayName: 'Verenigde Staten - Small Cap Value', provider: 'SPDR' },
  ZPRX: { displayName: 'Europa - Small Cap Value', provider: 'SPDR' },
  IUSN: { displayName: 'Verenigde Staten - Small Cap', provider: 'iShares' },
};

// Legacy lookup for backwards compatibility
export const ETF_NAMES = Object.fromEntries(
  Object.entries(ETF_INFO).map(([k, v]) => [k, v.displayName])
);

export const getETFDisplayName = (position) =>
  ETF_INFO[position.symbol]?.displayName || position.name || position.symbol;

export const getETFProvider = (position) =>
  ETF_INFO[position.symbol]?.provider || '';

export const getETFName = (position) =>
  ETF_INFO[position.symbol]?.displayName || position.name || ETF_NAMES[position.symbol] || position.symbol;

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Nooit';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s geleden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.floor(hours / 24)}d geleden`;
};

export default function DetailPageHeader({ title, onBack, children }) {
  const { connected, isDataStale, lastPositionsUpdate, brokerLinked } = useTrading();

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[#FEFEFE] border-b border-[#E8E8E6] shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#636E72] hover:text-[#2D3436] transition-colors -ml-2 px-2 py-1.5 rounded-lg hover:bg-[#F5F6F4]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Terug</span>
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-[#2D3436] absolute left-1/2 -translate-x-1/2">
              {title}
            </h1>
            <div className="flex items-center gap-2">
              {!brokerLinked ? (
                <span className="flex items-center gap-1 text-[#636E72] text-xs">
                  <WifiOff className="w-3.5 h-3.5" />
                </span>
              ) : connected ? (
                <span className="flex items-center gap-1 text-[#7C9885] text-xs font-medium">
                  <Wifi className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#C9A962] text-xs">
                  <WifiOff className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stale data banner */}
        {isDataStale && brokerLinked && (
          <div className="bg-[#C9A962]/10 border-t border-[#C9A962]/20 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-[#C9A962]">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Gecachte data &middot; {formatTimeAgo(lastPositionsUpdate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>
    </div>
  );
}
