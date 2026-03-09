import React, { useState } from 'react';
import { Settings, Eye, ArrowRight, Briefcase, Sparkles, ChevronDown } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import MarketIndicesTicker from '../MarketIndicesTicker';

/**
 * PortfolioChoicePage
 *
 * Standalone page shown when user HAS existing positions.
 * Two options: adjust portfolio or view portfolio.
 * "Adjust" expands to show: self-manage ETFs or switch to premade portfolio.
 */
export default function PortfolioChoicePage({ user, onNavigate, onLogout }) {
  const { portfolioValue, cashBalance } = useTrading();
  const [showAdjustOptions, setShowAdjustOptions] = useState(false);

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
            Welkom terug, {user?.name?.split(' ')[0]}
          </h1>

          <div className="flex items-center justify-center gap-3 mb-6">
            {portfolioValue > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B7B8A]/10 border border-[#6B7B8A]/20 rounded-full">
                <div className="w-2 h-2 bg-[#6B7B8A] rounded-full" />
                <span className="text-sm font-semibold text-[#6B7B8A]">
                  {formatCurrency(portfolioValue)} belegd
                </span>
              </div>
            )}
            {cashBalance > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C9885]/10 border border-[#7C9885]/20 rounded-full">
                <div className="w-2 h-2 bg-[#7C9885] rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-[#7C9885]">
                  {formatCurrency(cashBalance)} beschikbaar
                </span>
              </div>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3436] mb-3">
            Wat wil je doen?
          </h2>
          <p className="text-base sm:text-lg text-[#636E72] max-w-xl mx-auto">
            Bekijk je huidige portefeuille of pas je beleggingen aan.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Option 1: Adjust portfolio */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowAdjustOptions(!showAdjustOptions)}
              className={`bg-[#FEFEFE] border-2 rounded-2xl p-6 sm:p-8 text-left
                transition-all duration-300 group flex-1
                ${showAdjustOptions
                  ? 'border-[#7C9885] shadow-[0_8px_24px_rgba(124,152,133,0.12)]'
                  : 'border-[#E8E8E6] hover:border-[#7C9885] hover:shadow-[0_8px_24px_rgba(124,152,133,0.12)]'
                }
                active:scale-[0.98]`}
            >
              <div className="p-3 bg-[#7C9885]/10 rounded-xl w-fit mb-5 group-hover:bg-[#7C9885]/15 transition-colors">
                <Settings className="w-6 h-6 text-[#7C9885]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#2D3436] mb-2 group-hover:text-[#7C9885] transition-colors">
                Portefeuille aanpassen
              </h3>
              <p className="text-sm sm:text-base text-[#636E72] mb-4 leading-relaxed">
                Wijzig je beleggingen of kies een andere strategie.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#7C9885]">
                Bekijk opties
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAdjustOptions ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {/* Sub-options (expand on click) */}
            {showAdjustOptions && (
              <div className="flex flex-col gap-3 animate-in">
                <button
                  onClick={() => onNavigate?.('trading')}
                  className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5 text-left
                    hover:border-[#7C9885] hover:shadow-[0_4px_16px_rgba(124,152,133,0.1)]
                    active:scale-[0.98] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#7C9885]/10 rounded-lg group-hover:bg-[#7C9885]/15 transition-colors">
                      <Briefcase className="w-5 h-5 text-[#7C9885]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#2D3436] mb-0.5 group-hover:text-[#7C9885] transition-colors">
                        Zelf ETF's toevoegen of verkopen
                      </h4>
                      <p className="text-xs sm:text-sm text-[#636E72]">
                        Beheer je posities en plaats orders via LYNX.
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#B2BEC3] group-hover:text-[#7C9885] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                <button
                  onClick={() => onNavigate?.('modelPortfolios')}
                  className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 sm:p-5 text-left
                    hover:border-[#C9A962] hover:shadow-[0_4px_16px_rgba(201,169,98,0.1)]
                    active:scale-[0.98] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#C9A962]/10 rounded-lg group-hover:bg-[#C9A962]/15 transition-colors">
                      <Sparkles className="w-5 h-5 text-[#C9A962]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#2D3436] mb-0.5 group-hover:text-[#C9A962] transition-colors">
                        Samengestelde portefeuille kiezen
                      </h4>
                      <p className="text-xs sm:text-sm text-[#636E72]">
                        Stap over naar een kant-en-klare portefeuille.
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#B2BEC3] group-hover:text-[#C9A962] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Option 2: View portfolio */}
          <button
            onClick={() => onNavigate?.('mainDashboard')}
            className="bg-[#FEFEFE] border-2 border-[#E8E8E6] rounded-2xl p-6 sm:p-8 text-left
              hover:border-[#6B7B8A] hover:shadow-[0_8px_24px_rgba(107,123,138,0.12)]
              active:scale-[0.98] transition-all duration-300 group self-start"
          >
            <div className="p-3 bg-[#6B7B8A]/10 rounded-xl w-fit mb-5 group-hover:bg-[#6B7B8A]/15 transition-colors">
              <Eye className="w-6 h-6 text-[#6B7B8A]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2D3436] mb-2 group-hover:text-[#6B7B8A] transition-colors">
              Portefeuille bekijken
            </h3>
            <p className="text-sm sm:text-base text-[#636E72] mb-6 leading-relaxed">
              Bekijk je huidige posities, rendement en portefeuille overzicht.
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6B7B8A] text-white font-medium rounded-2xl text-sm
              group-hover:bg-[#5A6B7A] transition-colors">
              Bekijk portefeuille
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
