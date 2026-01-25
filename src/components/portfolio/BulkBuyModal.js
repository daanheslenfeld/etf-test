/**
 * BulkBuyModal Component
 *
 * Modal for reviewing and confirming bulk portfolio purchases.
 * Shows calculated orders, skipped ETFs, and total costs.
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
  WifiOff
} from 'lucide-react';
import { formatCurrency, formatPercentage, groupOrdersByCategory } from '../../utils/portfolioUtils';

// Investment amount presets
const AMOUNT_PRESETS = [1000, 2500, 5000, 10000, 25000];

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
  onAddToBasket
}) {
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [showSkipped, setShowSkipped] = useState(false);
  const [addedToBasket, setAddedToBasket] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAddedToBasket(false);
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

  // Handle add to basket
  const handleAddToBasket = () => {
    const success = onAddToBasket();
    if (success) {
      setAddedToBasket(true);
      // Close modal after short delay to show success
      setTimeout(() => {
        onClose();
      }, 1500);
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
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#FEFEFE] rounded-2xl shadow-[0_8px_32px_rgba(45,52,54,0.12)] border border-[#E8E8E6]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E6]">
          <div>
            <h2 className="text-xl font-bold text-[#2D3436]">
              {portfolio?.name || 'Portfolio'} kopen
            </h2>
            <p className="text-sm text-[#636E72] mt-1">
              {portfolio?.description || 'Kies je investeringsbedrag'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F5F6F4] transition-colors"
          >
            <X className="w-5 h-5 text-[#636E72]" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E8E6] bg-[#FEFEFE]">
          {addedToBasket ? (
            <div className="flex items-center justify-center gap-2 text-[#7C9885]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Toegevoegd aan basket!</span>
            </div>
          ) : (
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
