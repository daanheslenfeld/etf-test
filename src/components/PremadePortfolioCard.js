import React from 'react';
import { TrendingUp, Shield, Zap, Target, ChevronRight, Percent, ShoppingCart } from 'lucide-react';

// Map portfolio keys to icons
const portfolioIcons = {
  'bonds100': Shield,
  'defensive': Shield,
  'neutral': Target,
  'offensive': TrendingUp,
  'veryOffensive': Zap,
  'stocks100': Zap,
  'free': Target
};

// Risk level colors - Premium banking palette
const riskColors = {
  'bonds100': 'text-[#5B8A9A]',
  'defensive': 'text-[#7C9885]',
  'neutral': 'text-[#C9A962]',
  'offensive': 'text-[#B8956B]',
  'veryOffensive': 'text-[#C0736D]',
  'stocks100': 'text-[#C0736D]',
  'free': 'text-[#8B7B9A]'
};

// Risk level background colors
const riskBgColors = {
  'bonds100': 'bg-[#5B8A9A]/10',
  'defensive': 'bg-[#7C9885]/10',
  'neutral': 'bg-[#C9A962]/10',
  'offensive': 'bg-[#B8956B]/10',
  'veryOffensive': 'bg-[#C0736D]/10',
  'stocks100': 'bg-[#C0736D]/10',
  'free': 'bg-[#8B7B9A]/10'
};

// Risk level descriptions
const riskDescriptions = {
  'bonds100': 'Zeer laag risico - Focus op kapitaalbehoud',
  'defensive': 'Laag risico - Stabiele groei met bescherming',
  'neutral': 'Gemiddeld risico - Gebalanceerde aanpak',
  'offensive': 'Verhoogd risico - Actieve groei focus',
  'veryOffensive': 'Hoog risico - Maximale groei potentieel',
  'stocks100': 'Zeer hoog risico - 100% marktblootstelling',
  'free': 'Variabel - Je bepaalt zelf de samenstelling'
};

export default function PremadePortfolioCard({ portfolioKey, config, onSelect, onBuyNow, isTradable = true }) {
  const Icon = portfolioIcons[portfolioKey] || Target;
  const riskColor = riskColors[portfolioKey] || 'text-[#636E72]';
  const riskBgColor = riskBgColors[portfolioKey] || 'bg-[#636E72]/10';
  const riskDescription = riskDescriptions[portfolioKey] || '';

  return (
    <button
      onClick={() => onSelect(portfolioKey)}
      className="bg-[#FEFEFE] rounded-2xl shadow-[0_2px_8px_rgba(45,52,54,0.06)] p-6 hover:shadow-[0_4px_20px_rgba(45,52,54,0.12)] transition-all text-left border border-[#E8E8E6] hover:border-[#7C9885] group relative overflow-hidden min-h-[280px] flex flex-col"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7C9885]/0 to-[#7C9885]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${riskBgColor} ${riskColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[#7C9885] font-bold text-lg">
            <Percent className="w-4 h-4" />
            {(config.expectedReturn * 100).toFixed(1)}
          </div>
          <div className="text-xs text-[#B2BEC3]">verwacht rendement</div>
        </div>
      </div>

      {/* Title and description */}
      <h4 className="font-bold text-xl mb-2 text-[#2D3436] group-hover:text-[#7C9885] transition-colors relative z-10">
        {config.name}
      </h4>
      <p className="text-sm text-[#636E72] mb-4 relative z-10 leading-relaxed">
        {riskDescription}
      </p>

      {/* Allocation breakdown */}
      <div className="space-y-1.5 mb-4 relative z-10 flex-grow">
        {Object.entries(config.allocation).length > 0 ? (
          Object.entries(config.allocation).map(([cat, pct]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-[#636E72]">{cat}</span>
              <span className="text-[#2D3436] font-medium">{pct}%</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#B2BEC3] italic">
            Geen vaste allocatie - Vrije keuze
          </div>
        )}
      </div>

      {/* Risk indicator bar */}
      <div className="mb-4 relative z-10">
        <div className="flex justify-between text-xs text-[#B2BEC3] mb-1">
          <span>Risico</span>
          <span>{(config.stdDev * 100).toFixed(1)}% volatiliteit</span>
        </div>
        <div className="h-2 bg-[#ECEEED] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              config.stdDev <= 0.06 ? 'bg-[#7C9885]' :
              config.stdDev <= 0.10 ? 'bg-[#C9A962]' :
              config.stdDev <= 0.14 ? 'bg-[#B8956B]' : 'bg-[#C0736D]'
            }`}
            style={{ width: `${Math.min(config.stdDev * 500, 100)}%` }}
          />
        </div>
      </div>

      {/* Tradability badge */}
      {!isTradable && (
        <div className="mb-3 relative z-10">
          <span className="text-xs px-2 py-1 bg-[#C9A962]/20 text-[#C9A962] rounded-full">
            Niet volledig handelbaar via LYNX
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="pt-4 border-t border-[#E8E8E6] relative z-10 mt-auto space-y-3">
        {/* Buy button - only show if onBuyNow provided and tradable */}
        {onBuyNow && isTradable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(portfolioKey);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7C9885] text-white font-bold rounded-lg hover:bg-[#6B8A74] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Koop dit portfolio
          </button>
        )}
        {/* View details link */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#7C9885] font-medium group-hover:underline">
            Bekijk portefeuille
          </span>
          <ChevronRight className="w-5 h-5 text-[#7C9885] group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}
