import React from 'react';
import { Briefcase, Sparkles, ArrowRight } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import MarketIndicesTicker from '../MarketIndicesTicker';

/**
 * InvestmentChoicePage
 *
 * Standalone page shown when user has cash but no positions.
 * Presents two clear paths: build your own portfolio or pick a premade one.
 */
export default function InvestmentChoicePage({ user, onNavigate, onLogout }) {
  const { cashBalance } = useTrading();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      <MarketIndicesTicker />

      {/* Navigation */}
      <nav className="bg-[#FEFEFE] border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
                <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#7C9885"/>
                <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>
                <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>
                <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>
                <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
              </svg>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D3436]">PIGG</div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-sm text-[#636E72] hidden sm:block">
                {user?.name?.split(' ')[0]}
              </div>
              <button
                onClick={onLogout}
                className="text-[#636E72] hover:text-[#2D3436] transition-colors font-medium text-sm sm:text-base"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Welcome */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light italic mb-3 sm:mb-4 text-[#636E72]">
            Welkom, {user?.name?.split(' ')[0]}
          </h1>

          {cashBalance > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C9885]/10 border border-[#7C9885]/20 rounded-full mb-6">
              <div className="w-2 h-2 bg-[#7C9885] rounded-full animate-pulse" />
              <span className="text-base font-semibold text-[#7C9885]">
                {formatCurrency(cashBalance)} beschikbaar
              </span>
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3436] mb-3">
            Wat wil je doen met je beschikbare saldo?
          </h2>
          <p className="text-base sm:text-lg text-[#636E72] max-w-xl mx-auto">
            Je kunt zelf je beleggingen kiezen of starten met een vooraf samengestelde portefeuille.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Option 1: Build your own */}
          <button
            onClick={() => onNavigate?.('trading')}
            className="bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-2xl p-6 sm:p-8 text-left
              hover:border-[#7C9885] hover:shadow-[0_8px_24px_rgba(124,152,133,0.12)]
              active:scale-[0.98] transition-all duration-300 group"
          >
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
          </button>

          {/* Option 2: Premade portfolios */}
          <button
            onClick={() => onNavigate?.('modelPortfolios')}
            className="bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-2xl p-6 sm:p-8 text-left
              hover:border-[#7C9885] hover:shadow-[0_8px_24px_rgba(124,152,133,0.12)]
              active:scale-[0.98] transition-all duration-300 group"
          >
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
          </button>
        </div>
      </div>
    </div>
  );
}
