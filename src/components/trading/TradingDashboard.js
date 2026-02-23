import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import PortfolioOverview from './PortfolioOverview';
import OrderForm from './OrderForm';
import OrderBasket from './OrderBasket';
import OrderStatus from './OrderStatus';
import OrderHistory from './OrderHistory';
import ConfirmationModal from './ConfirmationModal';
import ETFBrowser from './ETFBrowser';
import MarketIndicesTicker from '../MarketIndicesTicker';
import { ArrowLeft, Wifi, WifiOff, AlertTriangle, RefreshCw, Clock, List, ShoppingCart } from 'lucide-react';

// Helper to format time ago
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

function TradingDashboardContent({ onBack }) {
  const {
    connected,
    accountId,
    tradingMode,
    isLive,
    safetyLimits,
    loading,
    error,
    clearError,
    orderBasket,
    executeBasket,
    isExecuting,
    checkConnection,
    fetchETFs,
    fetchPositions,
    fetchOrders,
    fetchSafetyLimits,
    isDataStale,
    lastMarketDataUpdate,
    subscribeToMarketData,
    fetchMarketData,
    positions,
    canTrade,
    tradingAccessMessage,
  } = useTrading();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [prefillOrder, setPrefillOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('etfs'); // 'etfs' or 'orders'

  // Handle prefill order from portfolio actions
  const handlePrefillOrder = (orderData) => {
    setPrefillOrder(orderData);
    // Scroll to order form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearPrefill = () => {
    setPrefillOrder(null);
  };

  const handleExecuteClick = () => {
    if (orderBasket.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmExecute = async () => {
    await executeBasket(true); // Pass confirmed=true to bypass confirmation requirement
    setShowConfirmModal(false);
    // Refresh safety limits after execution
    await fetchSafetyLimits();
  };

  const handleRetryConnection = async () => {
    await checkConnection();
    await Promise.all([fetchETFs(), fetchPositions(), fetchOrders()]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <MarketIndicesTicker />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C9885] mx-auto mb-4"></div>
            <div className="text-[#2D3436] text-xl">Verbinden met Trading API...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F4]">
      {/* Market Indices Ticker */}
      <MarketIndicesTicker />

      {/* Navigation */}
      <nav className="bg-[#FEFEFE] border-b border-[#E8E8E6] shadow-[0_1px_3px_rgba(45,52,54,0.04)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="text-[#7C9885] font-medium hover:text-[#6B8A74] flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Terug naar Dashboard
            </button>

            <h1 className="text-xl font-bold text-[#2D3436]">Handelsplatform</h1>

            <div className="flex items-center gap-4">
              {/* Trading Mode Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                tradingMode === 'LIVE'
                  ? 'bg-[#6B7B8A]/10 text-[#6B7B8A] border border-[#6B7B8A]/30'
                  : 'bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30'
              }`}>
                {tradingMode === 'LIVE' ? 'LIVE' : 'PAPER'}
              </div>

              {/* Stale Data Indicator */}
              {isDataStale && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full">
                  <Clock className="w-4 h-4 text-[#C9A962]" />
                  <span className="text-xs text-[#C9A962] hidden sm:inline">
                    Gecached {formatTimeAgo(lastMarketDataUpdate)}
                  </span>
                </div>
              )}

              {/* Connection Status */}
              {connected ? (
                <div className="flex items-center gap-2 text-[#7C9885]">
                  <Wifi className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">{accountId || 'Verbonden'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#C9A962]">
                  <WifiOff className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Niet Verbonden</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-xl p-4 mb-6 flex justify-between items-center">
            <p className="text-[#C0736D]">{error}</p>
            <button onClick={clearError} className="text-[#C0736D] hover:text-[#B06359]">
              Sluiten
            </button>
          </div>
        )}

        {/* Demo Mode Banner - Trading Disabled */}
        {!canTrade && (
          <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
              <p className="text-[#C9A962] font-medium">
                {tradingAccessMessage || 'Trading is uitgeschakeld. Alleen demo modus.'}
              </p>
            </div>
          </div>
        )}

        {/* Stale Data Banner - hidden, data staleness logged to console only */}
        {isDataStale && console.debug('[TradingDashboard] Data is stale, last update:', formatTimeAgo(lastMarketDataUpdate))}

        {/* Connection Warning */}
        {!connected && (
          <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-[#C9A962] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#C9A962] mb-2">IB Gateway Niet Verbonden</h2>
                <p className="text-[#636E72] mb-4">
                  {isDataStale ? 'Gecachte marktdata wordt getoond. ' : ''}Kan niet verbinden met IB Gateway. Zorg dat:
                </p>
                <ul className="text-[#636E72] text-sm list-disc list-inside space-y-1 mb-4">
                  <li>IB Gateway draait op localhost:4001</li>
                  <li>Je bent ingelogd bij LYNX Paper Trading</li>
                  <li>De Trading API draait op localhost:8002</li>
                </ul>
                <button
                  onClick={handleRetryConnection}
                  className="px-4 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#B89952] flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Opnieuw Verbinden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Execution Results */}
        <OrderStatus />

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 mb-4">
          <button
            onClick={() => setActiveTab('etfs')}
            className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors ${
              activeTab === 'etfs'
                ? 'bg-[#7C9885] text-white'
                : 'bg-[#FEFEFE] border border-[#E8E8E6] text-[#636E72] hover:bg-[#F5F6F4]'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">ETF Zoeken</span>
            <span className="sm:hidden">ETFs</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#7C9885] text-white'
                : 'bg-[#FEFEFE] border border-[#E8E8E6] text-[#636E72] hover:bg-[#F5F6F4]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Orders & Portefeuille</span>
            <span className="sm:hidden">Orders</span>
            {orderBasket.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#C0736D] text-white text-xs rounded-full">
                {orderBasket.length}
              </span>
            )}
          </button>
        </div>

        {/* ETF Browser Tab */}
        {activeTab === 'etfs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Form Sidebar - Appears first on mobile for quick access */}
            <div className="order-first lg:order-last space-y-6">
              <OrderForm
                prefillOrder={prefillOrder}
                onClearPrefill={handleClearPrefill}
              />
              <OrderBasket onExecute={handleExecuteClick} />
            </div>

            {/* ETF Browser - Full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-last lg:order-first">
              <ETFBrowser onAddToOrder={handlePrefillOrder} />
            </div>
          </div>
        )}

        {/* Orders & Portfolio Tab */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Form + Order Basket - Appears first on mobile for quick access */}
            <div className="order-first lg:order-none space-y-6">
              <OrderForm
                prefillOrder={prefillOrder}
                onClearPrefill={handleClearPrefill}
              />
              <OrderBasket onExecute={handleExecuteClick} />
            </div>

            {/* Portfolio + Order History */}
            <div className="lg:col-span-2 space-y-6">
              <PortfolioOverview onPrefillOrder={handlePrefillOrder} />
              <OrderHistory />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmExecute}
        orders={orderBasket}
        tradingMode={tradingMode}
        safetyLimits={safetyLimits}
        warnings={isLive ? ['LIVE HANDELEN: Echt geld wordt gebruikt'] : []}
      />
    </div>
  );
}

// Export content directly - TradingProvider is at app root
export default function TradingDashboard({ user, onBack }) {
  return (
    <TradingDashboardContent onBack={onBack} />
  );
}
