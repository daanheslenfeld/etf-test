import React from 'react';
import { Briefcase, Sparkles, ArrowRight } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

/**
 * InvestmentChoiceBanner
 *
 * Shown when user has uninvested cash (cashBalance > 0, no positions).
 * Presents two clear paths: build your own portfolio or pick a premade one.
 */
export default function InvestmentChoiceBanner({ onNavigate }) {
  const { cashBalance, portfolioValue, positions, loading } = useTrading();

  // Only show when there's uninvested cash and no existing positions
  const hasUninvestedCash = cashBalance > 0 && (portfolioValue === 0 || (positions || []).length === 0);

  if (loading || !hasUninvestedCash) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7C9885]/10 border border-[#7C9885]/20 rounded-full mb-4">
          <div className="w-2 h-2 bg-[#7C9885] rounded-full animate-pulse" />
          <span className="text-sm font-medium text-[#7C9885]">
            {formatCurrency(cashBalance)} beschikbaar
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3436] mb-2">
          Wat wil je doen met je beschikbare saldo?
        </h2>
        <p className="text-base text-[#636E72] max-w-2xl">
          Je kunt zelf je beleggingen kiezen of starten met een vooraf samengestelde portefeuille.
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Option 1: Build your own */}
        <button
          onClick={() => onNavigate?.('trading')}
          className="bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-2xl p-6 sm:p-8 text-left
            hover:border-[#7C9885] hover:shadow-[0_8px_24px_rgba(124,152,133,0.12)]
            active:scale-[0.98] transition-all duration-300 group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="p-3 bg-[#7C9885]/10 rounded-xl w-fit mb-5 group-hover:bg-[#7C9885]/15 transition-colors">
              <Briefcase className="w-6 h-6 text-[#7C9885]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2D3436] mb-2 group-hover:text-[#7C9885] transition-colors">
              Zelf een portefeuille samenstellen
            </h3>
            <p className="text-sm sm:text-base text-[#636E72] mb-6 leading-relaxed">
              Kies zelf je beleggingen en stel je eigen portefeuille samen.
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C9885] text-white font-medium rounded-2xl text-sm
              group-hover:bg-[#6B8A74] transition-colors">
              Zelf beleggen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </button>

        {/* Option 2: Premade portfolios */}
        <button
          onClick={() => onNavigate?.('modelPortfolios')}
          className="bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-2xl p-6 sm:p-8 text-left
            hover:border-[#7C9885] hover:shadow-[0_8px_24px_rgba(124,152,133,0.12)]
            active:scale-[0.98] transition-all duration-300 group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="p-3 bg-[#C9A962]/10 rounded-xl w-fit mb-5 group-hover:bg-[#C9A962]/15 transition-colors">
              <Sparkles className="w-6 h-6 text-[#C9A962]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2D3436] mb-2 group-hover:text-[#7C9885] transition-colors">
              Voor jou samengestelde portefeuilles
            </h3>
            <p className="text-sm sm:text-base text-[#636E72] mb-6 leading-relaxed">
              Kies uit vooraf samengestelde portefeuilles die aansluiten op jouw wensen.
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FEFEFE] text-[#2D3436] font-medium rounded-2xl text-sm
              border border-[#E8E8E6] group-hover:border-[#7C9885] group-hover:text-[#7C9885] transition-colors">
              Bekijk portefeuilles
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
