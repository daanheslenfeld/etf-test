/**
 * BulkBuyModal Component
 *
 * Modal for reviewing and confirming bulk portfolio purchases.
 * Shows calculated orders, skipped ETFs, and total costs.
 * After adding to basket, offers option to publish to community.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Users,
  Globe
} from 'lucide-react';
import { formatCurrency, formatPercentage, groupOrdersByCategory, calculateMinimumInvestment } from '../../utils/portfolioUtils';
import { useTrading } from '../../context/TradingContext';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Investment amount presets
const AMOUNT_PRESETS = [250, 500, 1000, 2500, 5000, 10000, 25000];

export default function BulkBuyModal({
  isOpen,
  onClose,
  portfolio,
  calculation,
  calculationSummary,
  isCalculating,
  error,
  availableCash,
  canExecute,
  hasMarketData,
  onCalculate,
  onAddToBasket,
  onNavigateToTrading,
  user
}) {
  const { marketData } = useTrading();
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [showSkipped, setShowSkipped] = useState(false);
  const [addedToBasket, setAddedToBasket] = useState(false);

  // Community publish state
  const [showCommunityStep, setShowCommunityStep] = useState(false);
  const [publishToCommunity, setPublishToCommunity] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState(null);

  // Calculate minimum investment for this portfolio
  const minimumInvestment = portfolio?.key
    ? calculateMinimumInvestment(portfolio.key, marketData || {})
    : { minimum: 0, holdings: [] };
  const isBelowMinimum = minimumInvestment.minimum > 0 && investmentAmount < minimumInvestment.minimum;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAddedToBasket(false);
      setShowCommunityStep(false);
      setPublishToCommunity(false);
      setCommunityName('');
      setIsPublishing(false);
      setPublished(false);
      setPublishError(null);
      // Auto-calculate with default amount when modal opens
      if (portfolio && !calculation) {
        onCalculate(portfolio.key || portfolio, investmentAmount);
      }
    }
  }, [isOpen, portfolio, calculation, investmentAmount, onCalculate]);

  // Recalculate when amount changes
  const handleAmountChange = (amount) => {
    setInvestmentAmount(amount);
    setCustomAmount('');
    if (portfolio) {
      onCalculate(portfolio.key || portfolio, amount);
    }
  };

  // Handle custom amount input
  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    if (value && parseInt(value) > 0) {
      const amount = parseInt(value);
      setInvestmentAmount(amount);
      if (portfolio) {
        onCalculate(portfolio.key || portfolio, amount);
      }
    }
  };

  // Handle add to basket — immediately navigate to order basket
  const handleAddToBasket = () => {
    const success = onAddToBasket();
    if (success) {
      // Send transaction email (fire-and-forget)
      if (user?.id && calculation?.orders?.length) {
        const emailOrders = calculation.orders.map(o => ({
          symbol: o.symbol,
          name: o.name || o.symbol,
          quantity: o.quantity,
          estimatedPrice: o.price || o.estimatedPrice || 0,
          estimatedValue: o.totalCost || (o.quantity * (o.price || o.estimatedPrice || 0)),
        }));
        fetch('/api/notify-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: user.id,
            orders: emailOrders,
            portfolioName: portfolio?.name || null,
            totalAmount: calculation.totalCost || 0,
          }),
        }).catch(() => {}); // silent fail
      }

      // Close modal and go straight to order basket
      onClose();
      if (onNavigateToTrading) {
        setTimeout(() => onNavigateToTrading(), 200);
      }
    }
  };

  // Handle community publish
  const handlePublish = async () => {
    if (!communityName.trim() || communityName.trim().length < 3) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const holdings = (portfolio.holdings || []).map(h => ({
        isin: h.isin,
        name: h.name,
        weight: h.weight,
        category: h.category || null,
      }));

      const params = new URLSearchParams({
        creator_id: String(user?.id || 'anonymous'),
        creator_name: communityName.trim(),
      });

      const response = await fetch(`${TRADING_API_URL}/portfolios/?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          name: portfolio.name || 'Mijn Portfolio',
          description: portfolio.description || null,
          visibility: 'public',
          holdings,
          risk_level: portfolio.riskLevel || 3,
          tags: portfolio.tags || [],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Publiceren mislukt');
      }

      setPublished(true);
      setTimeout(() => {
        onClose();
        if (onNavigateToTrading) {
          setTimeout(() => onNavigateToTrading(), 300);
        }
      }, 2000);
    } catch (err) {
      setPublishError(err.message || 'Er ging iets mis bij het publiceren');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle skip community step — close and navigate to basket
  const handleSkipCommunity = () => {
    onClose();
    if (onNavigateToTrading) {
      setTimeout(() => onNavigateToTrading(), 300);
    }
  };

  if (!isOpen) return null;

  const orders = calculation?.orders || [];
  const skippedETFs = calculation?.skippedETFs || [];
  const groupedOrders = groupOrdersByCategory(orders);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3436]/60 backdrop-blur-sm"
        onClick={showCommunityStep ? handleSkipCommunity : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#FEFEFE] rounded-2xl shadow-[0_8px_32px_rgba(45,52,54,0.12)] border border-[#E8E8E6]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E6]">
          <div>
            <h2 className="text-xl font-bold text-[#2D3436]">
              {showCommunityStep ? 'Delen in community' : `${portfolio?.name || 'Portfolio'} kopen`}
            </h2>
            <p className="text-sm text-[#636E72] mt-1">
              {showCommunityStep
                ? 'Deel je portfoliokeuze anoniem met andere beleggers'
                : (portfolio?.description || 'Kies je investeringsbedrag')
              }
            </p>
          </div>
          <button
            onClick={showCommunityStep ? handleSkipCommunity : onClose}
            className="p-2 rounded-lg hover:bg-[#F5F6F4] transition-colors"
          >
            <X className="w-5 h-5 text-[#636E72]" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* === COMMUNITY PUBLISH STEP === */}
          {showCommunityStep ? (
            <div className="space-y-6">
              {/* Success message */}
              <div className="flex items-center gap-3 p-4 bg-[#7C9885]/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#7C9885] flex-shrink-0" />
                <div>
                  <p className="text-[#7C9885] font-medium">Toegevoegd aan basket!</p>
                  <p className="text-[#7C9885]/70 text-sm mt-0.5">
                    {portfolio?.name} — {formatCurrency(calculation?.totalCost || 0)}
                  </p>
                </div>
              </div>

              {published ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#7C9885]/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-[#7C9885]" />
                  </div>
                  <p className="text-lg font-bold text-[#2D3436]">Gepubliceerd in community!</p>
                  <p className="text-sm text-[#636E72]">Andere beleggers kunnen je portfolio nu zien</p>
                </div>
              ) : (
                <>
                  {/* Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#F5F6F4] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#636E72]" />
                      <div>
                        <p className="font-medium text-[#2D3436]">Deel in community</p>
                        <p className="text-xs text-[#636E72]">
                          Laat anderen zien welk model je hebt gekozen
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPublishToCommunity(!publishToCommunity)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        publishToCommunity ? 'bg-[#7C9885]' : 'bg-[#E8E8E6]'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        publishToCommunity ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Community name input */}
                  {publishToCommunity && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[#636E72] mb-2">
                          Kies een naam voor de community
                        </label>
                        <input
                          type="text"
                          value={communityName}
                          onChange={(e) => setCommunityName(e.target.value)}
                          placeholder="bijv. SlimmeBelegger, InvestPro, ..."
                          maxLength={30}
                          className="w-full px-4 py-3 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885]"
                        />
                        <p className="text-xs text-[#B2BEC3] mt-1">
                          Deze naam is zichtbaar voor andere gebruikers (min. 3 tekens)
                        </p>
                      </div>

                      {publishError && (
                        <div className="flex items-center gap-2 p-3 bg-[#C0736D]/10 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-[#C0736D] flex-shrink-0" />
                          <p className="text-sm text-[#C0736D]">{publishError}</p>
                        </div>
                      )}

                      <div className="bg-[#F5F6F4] rounded-lg p-3">
                        <p className="text-xs text-[#636E72]">
                          <strong>Privacy:</strong> Je echte naam wordt niet getoond.
                          Alleen je gekozen communitynaam en het portfoliomodel zijn zichtbaar.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* === ORIGINAL BUY STEP === */}
              {/* Connection status */}
              <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
                canExecute ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C9A962]/10 text-[#C9A962]'
              }`}>
                {canExecute ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm">Verbonden - Orders kunnen worden uitgevoerd</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">Offline - Orders kunnen alleen aan basket worden toegevoegd</span>
                  </>
                )}
              </div>

              {/* Investment Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#636E72] mb-3">
                  Investeringsbedrag
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {AMOUNT_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountChange(amount)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        investmentAmount === amount && !customAmount
                          ? 'bg-[#7C9885] text-white'
                          : 'bg-[#F5F6F4] text-[#636E72] hover:bg-[#ECEEED]'
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#636E72]">of:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636E72]">€</span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="Ander bedrag"
                      className="w-full pl-8 pr-4 py-2 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none focus:border-[#7C9885]"
                    />
                  </div>
                </div>
                {availableCash > 0 && (
                  <p className="text-xs text-[#B2BEC3] mt-2">
                    Beschikbaar saldo: {formatCurrency(availableCash)}
                  </p>
                )}
                {minimumInvestment.minimum > 0 && (
                  <p className={`text-xs mt-1 ${isBelowMinimum ? 'text-[#C0736D] font-medium' : 'text-[#B2BEC3]'}`}>
                    Minimaal benodigd voor alle ETFs: {formatCurrency(minimumInvestment.minimum)}
                    {isBelowMinimum && ' — sommige ETFs worden overgeslagen'}
                  </p>
                )}
              </div>

              {/* Loading state */}
              {isCalculating && (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-[#7C9885] animate-spin" />
                  <span className="ml-3 text-[#636E72]">Berekenen...</span>
                </div>
              )}

              {/* Error state */}
              {error && !isCalculating && (
                <div className="flex items-start gap-3 p-4 bg-[#C0736D]/10 rounded-lg mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#C0736D] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#C0736D] font-medium">Fout bij berekening</p>
                    <p className="text-[#C0736D]/80 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Calculation results */}
              {!isCalculating && calculation && !error && (
                <>
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#F5F6F4] rounded-lg p-4">
                      <div className="text-sm text-[#636E72] mb-1">Totale kosten</div>
                      <div className="text-xl font-bold text-[#2D3436]">
                        {formatCurrency(calculation.totalCost)}
                      </div>
                    </div>
                    <div className="bg-[#F5F6F4] rounded-lg p-4">
                      <div className="text-sm text-[#636E72] mb-1">Aantal ETFs</div>
                      <div className="text-xl font-bold text-[#2D3436]">
                        {orders.length} <span className="text-sm font-normal text-[#636E72]">van {orders.length + skippedETFs.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scaled down warning */}
                  {calculation.scaledDown && (
                    <div className="flex items-start gap-3 p-4 bg-[#C9A962]/10 rounded-lg mb-4">
                      <AlertTriangle className="w-5 h-5 text-[#C9A962] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[#C9A962] font-medium">Orders aangepast</p>
                        <p className="text-[#C9A962]/80 text-sm mt-1">
                          Vanwege onvoldoende saldo zijn de orders geschaald naar {formatPercentage(calculation.scaleFactor * 100)} van het origineel.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No market data warning */}
                  {!hasMarketData && (
                    <div className="flex items-start gap-3 p-4 bg-[#6B7B8A]/10 rounded-lg mb-4">
                      <Info className="w-5 h-5 text-[#6B7B8A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[#6B7B8A] font-medium">Gecachete prijzen</p>
                        <p className="text-[#6B7B8A]/80 text-sm mt-1">
                          Prijzen zijn gebaseerd op gecachete data. Verbind met de broker voor actuele koersen.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Orders by category */}
                  {Object.entries(groupedOrders).map(([category, categoryOrders]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium text-[#636E72] mb-2 flex items-center gap-2">
                        <span>{category}</span>
                        <span className="text-xs text-[#B2BEC3]">
                          ({categoryOrders.length} ETF{categoryOrders.length !== 1 ? 's' : ''})
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {categoryOrders.map((order) => (
                          <div
                            key={order.isin}
                            className="flex items-center justify-between p-3 bg-[#F5F6F4] rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#2D3436]">{order.symbol}</span>
                                <span className="text-xs text-[#B2BEC3]">{formatPercentage(order.actualWeight)}</span>
                              </div>
                              <div className="text-xs text-[#636E72] truncate">
                                {order.name}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-medium text-[#2D3436]">
                                {order.units} x {formatCurrency(order.price)}
                              </div>
                              <div className="text-xs text-[#636E72]">
                                {formatCurrency(order.actualCost)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Skipped ETFs */}
                  {skippedETFs.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowSkipped(!showSkipped)}
                        className="flex items-center gap-2 text-sm text-[#636E72] hover:text-[#2D3436]"
                      >
                        {showSkipped ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {skippedETFs.length} ETF{skippedETFs.length !== 1 ? 's' : ''} overgeslagen
                      </button>
                      {showSkipped && (
                        <div className="mt-2 space-y-2">
                          {skippedETFs.map((etf) => (
                            <div
                              key={etf.isin}
                              className="flex items-center justify-between p-3 bg-[#F5F6F4]/50 rounded-lg text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-[#636E72]">{etf.symbol || etf.name}</span>
                              </div>
                              <div className="text-xs text-[#B2BEC3]">
                                {etf.reason === 'ZERO_UNITS' && `Minimaal ${formatCurrency(etf.minRequired)} nodig`}
                                {etf.reason === 'NO_PRICE_DATA' && 'Geen koersdata'}
                                {etf.reason === 'NOT_TRADABLE' && 'Niet verhandelbaar'}
                                {etf.reason === 'INSUFFICIENT_FUNDS' && 'Onvoldoende saldo'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E8E6] bg-[#FEFEFE]">
          {showCommunityStep ? (
            // Community step footer
            published ? null : (
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkipCommunity}
                  className="text-sm text-[#636E72] hover:text-[#2D3436] underline underline-offset-2"
                >
                  Overslaan
                </button>
                {publishToCommunity && (
                  <button
                    onClick={handlePublish}
                    disabled={!communityName.trim() || communityName.trim().length < 3 || isPublishing}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-[#7C9885] text-white hover:bg-[#6B8A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPublishing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Publiceren...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Publiceren
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          ) : (
            // Buy step footer
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#636E72]">Totaal</div>
                <div className="text-xl font-bold text-[#2D3436]">
                  {formatCurrency(calculation?.totalCost || 0)}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-medium bg-[#ECEEED] text-[#636E72] hover:bg-[#E8E8E6] transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddToBasket}
                  disabled={!calculation || orders.length === 0 || isCalculating}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-[#7C9885] text-white hover:bg-[#6B8A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Toevoegen aan basket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
