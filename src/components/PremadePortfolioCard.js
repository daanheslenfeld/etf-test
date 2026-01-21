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

// Risk level colors
const riskColors = {
  'bonds100': 'text-blue-400',
  'defensive': 'text-green-400',
  'neutral': 'text-yellow-400',
  'offensive': 'text-orange-400',
  'veryOffensive': 'text-red-400',
  'stocks100': 'text-red-400',
  'free': 'text-purple-400'
};

// Risk level background colors
const riskBgColors = {
  'bonds100': 'bg-blue-400/10',
  'defensive': 'bg-green-400/10',
  'neutral': 'bg-yellow-400/10',
  'offensive': 'bg-orange-400/10',
  'veryOffensive': 'bg-red-400/10',
  'stocks100': 'bg-red-400/10',
  'free': 'bg-purple-400/10'
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
  const riskColor = riskColors[portfolioKey] || 'text-gray-400';
  const riskBgColor = riskBgColors[portfolioKey] || 'bg-gray-400/10';
  const riskDescription = riskDescriptions[portfolioKey] || '';

  return (
    <button
      onClick={() => onSelect(portfolioKey)}
      className="bg-[#1A1B1F] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left border border-gray-800 hover:border-[#28EBCF] group relative overflow-hidden min-h-[280px] flex flex-col"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#28EBCF]/0 to-[#28EBCF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${riskBgColor} ${riskColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[#28EBCF] font-bold text-lg">
            <Percent className="w-4 h-4" />
            {(config.expectedReturn * 100).toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">verwacht rendement</div>
        </div>
      </div>

      {/* Title and description */}
      <h4 className="font-bold text-xl mb-2 text-white group-hover:text-[#28EBCF] transition-colors relative z-10">
        {config.name}
      </h4>
      <p className="text-sm text-gray-400 mb-4 relative z-10 leading-relaxed">
        {riskDescription}
      </p>

      {/* Allocation breakdown */}
      <div className="space-y-1.5 mb-4 relative z-10 flex-grow">
        {Object.entries(config.allocation).length > 0 ? (
          Object.entries(config.allocation).map(([cat, pct]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-gray-400">{cat}</span>
              <span className="text-gray-300 font-medium">{pct}%</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 italic">
            Geen vaste allocatie - Vrije keuze
          </div>
        )}
      </div>

      {/* Risk indicator bar */}
      <div className="mb-4 relative z-10">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Risico</span>
          <span>{(config.stdDev * 100).toFixed(1)}% volatiliteit</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              config.stdDev <= 0.06 ? 'bg-green-500' :
              config.stdDev <= 0.10 ? 'bg-yellow-500' :
              config.stdDev <= 0.14 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(config.stdDev * 500, 100)}%` }}
          />
        </div>
      </div>

      {/* Tradability badge */}
      {!isTradable && (
        <div className="mb-3 relative z-10">
          <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
            Niet volledig handelbaar via LYNX
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="pt-4 border-t border-gray-800 relative z-10 mt-auto space-y-3">
        {/* Buy button - only show if onBuyNow provided and tradable */}
        {onBuyNow && isTradable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(portfolioKey);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#28EBCF] text-gray-900 font-bold rounded-lg hover:bg-[#20d4ba] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Koop dit portfolio
          </button>
        )}
        {/* View details link */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#28EBCF] font-medium group-hover:underline">
            Bekijk portefeuille
          </span>
          <ChevronRight className="w-5 h-5 text-[#28EBCF] group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}
