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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#1A1B1F] rounded-2xl shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              {portfolio?.name || 'Portfolio'} kopen
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {portfolio?.description || 'Kies je investeringsbedrag'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          {/* Connection status */}
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            canExecute ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
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
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Investeringsbedrag
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {AMOUNT_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountChange(amount)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    investmentAmount === amount && !customAmount
                      ? 'bg-[#28EBCF] text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">of:</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Ander bedrag"
                  className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]"
                />
              </div>
            </div>
            {availableCash > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Beschikbaar saldo: {formatCurrency(availableCash)}
              </p>
            )}
          </div>

          {/* Loading state */}
          {isCalculating && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-[#28EBCF] animate-spin" />
              <span className="ml-3 text-gray-400">Berekenen...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isCalculating && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Fout bij berekening</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Calculation results */}
          {!isCalculating && calculation && !error && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Totale kosten</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(calculation.totalCost)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Aantal ETFs</div>
                  <div className="text-xl font-bold text-white">
                    {orders.length} <span className="text-sm font-normal text-gray-400">van {orders.length + skippedETFs.length}</span>
                  </div>
                </div>
              </div>

              {/* Scaled down warning */}
              {calculation.scaledDown && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Orders aangepast</p>
                    <p className="text-yellow-300 text-sm mt-1">
                      Vanwege onvoldoende saldo zijn de orders geschaald naar {formatPercentage(calculation.scaleFactor * 100)} van het origineel.
                    </p>
                  </div>
                </div>
              )}

              {/* No market data warning */}
              {!hasMarketData && (
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg mb-4">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Gecachete prijzen</p>
                    <p className="text-blue-300 text-sm mt-1">
                      Prijzen zijn gebaseerd op gecachete data. Verbind met de broker voor actuele koersen.
                    </p>
                  </div>
                </div>
              )}

              {/* Orders by category */}
              {Object.entries(groupedOrders).map(([category, categoryOrders]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>{category}</span>
                    <span className="text-xs text-gray-500">
                      ({categoryOrders.length} ETF{categoryOrders.length !== 1 ? 's' : ''})
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {categoryOrders.map((order) => (
                      <div
                        key={order.isin}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{order.symbol}</span>
                            <span className="text-xs text-gray-500">{formatPercentage(order.actualWeight)}</span>
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {order.name}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-medium text-white">
                            {order.units} x {formatCurrency(order.price)}
                          </div>
                          <div className="text-xs text-gray-400">
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
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
                  >
                    {showSkipped ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {skippedETFs.length} ETF{skippedETFs.length !== 1 ? 's' : ''} overgeslagen
                  </button>
                  {showSkipped && (
                    <div className="mt-2 space-y-2">
                      {skippedETFs.map((etf) => (
                        <div
                          key={etf.isin}
                          className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-400">{etf.symbol || etf.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
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
        <div className="p-6 border-t border-gray-800 bg-[#1A1B1F]">
          {addedToBasket ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Toegevoegd aan basket!</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Totaal</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(calculation?.totalCost || 0)}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddToBasket}
                  disabled={!calculation || orders.length === 0 || isCalculating}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-[#28EBCF] text-gray-900 hover:bg-[#20d4ba] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
