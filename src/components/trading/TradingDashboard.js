import React, { useState } from 'react';
import { TradingProvider, useTrading } from '../../context/TradingContext';
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

function TradingDashboardContent({ onBack, onNavigateToBroker }) {
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
    brokerLinked,
    linkBrokerAccount,
    getAvailableAccounts,
    subscribeToMarketData,
    fetchMarketData,
    canTrade,
    tradingAccessMessage,
    needsBrokerLink,
  } = useTrading();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [linkingAccount, setLinkingAccount] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [linkError, setLinkError] = useState(null);
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

  // Load available accounts when not linked
  const loadAvailableAccounts = async () => {
    const accounts = await getAvailableAccounts();
    setAvailableAccounts(accounts);
  };

  // Handle linking broker account
  const handleLinkAccount = async (accountId = null) => {
    setLinkingAccount(true);
    setLinkError(null);

    const result = await linkBrokerAccount(accountId);

    if (result.success) {
      // Refresh data after linking
      await Promise.all([fetchPositions(), fetchOrders()]);
      await subscribeToMarketData();
      await fetchMarketData();
    } else {
      setLinkError(result.message);
    }

    setLinkingAccount(false);
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

  // Broker not linked - show connection flow
  if (!brokerLinked) {
    return (
      <div className="min-h-screen bg-[#F5F6F4]">
        <MarketIndicesTicker />
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
              <h1 className="text-xl font-bold text-[#2D3436]">LYNX Account Koppelen</h1>
              <div className="w-32"></div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-8 shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#7C9885]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-[#7C9885]" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D3436] mb-2">Koppel je LYNX Account</h2>
              <p className="text-[#636E72]">
                Koppel je LYNX broker account om direct ETF's te verhandelen via dit portaal.
              </p>
            </div>

            {linkError && (
              <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-lg p-4 mb-6">
                <p className="text-[#C0736D] text-sm">{linkError}</p>
              </div>
            )}

            {!connected ? (
              <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-[#C9A962] flex-shrink-0" />
                  <div>
                    <h3 className="text-[#C9A962] font-medium mb-2">IB Gateway Niet Verbonden</h3>
                    <p className="text-[#636E72] text-sm mb-4">
                      Zorg ervoor dat IB Gateway draait en ingelogd is voordat je je account koppelt.
                    </p>
                    <ul className="text-[#636E72] text-sm list-disc list-inside space-y-1 mb-4">
                      <li>Start IB Gateway op localhost:4001</li>
                      <li>Log in met je LYNX inloggegevens</li>
                      <li>Wacht tot de verbinding tot stand is gebracht</li>
                    </ul>
                    <button
                      onClick={checkConnection}
                      className="px-4 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#B89952] flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Verbinding Controleren
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-[#7C9885]/10 border border-[#7C9885]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#7C9885]">
                    <Wifi className="w-5 h-5" />
                    <span>IB Gateway Verbonden</span>
                  </div>
                </div>

                {availableAccounts.length === 0 ? (
                  <button
                    onClick={loadAvailableAccounts}
                    className="w-full py-3 bg-[#7C9885] text-white font-bold rounded-lg hover:bg-[#6B8A74] transition-colors"
                  >
                    Beschikbare Accounts Laden
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[#636E72] text-sm">Selecteer het account om te koppelen:</p>
                    {availableAccounts.map((acct) => (
                      <button
                        key={acct}
                        onClick={() => handleLinkAccount(acct)}
                        disabled={linkingAccount}
                        className="w-full py-4 px-6 bg-[#FEFEFE] border border-[#E8E8E6] rounded-lg hover:border-[#7C9885] hover:bg-[#F5F6F4] transition-colors text-left disabled:opacity-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-[#2D3436] font-medium">{acct}</div>
                            <div className="text-[#636E72] text-sm">
                              {acct.startsWith('DU') || acct.startsWith('DF') ? 'Papier Handelen' : 'Live Handelen'}
                            </div>
                          </div>
                          {linkingAccount ? (
                            <div className="animate-spin h-5 w-5 border-2 border-[#7C9885] border-t-transparent rounded-full" />
                          ) : (
                            <span className="text-[#7C9885]">Koppelen</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {availableAccounts.length === 0 && (
                  <button
                    onClick={() => handleLinkAccount()}
                    disabled={linkingAccount}
                    className="w-full py-3 bg-[#ECEEED] text-[#2D3436] font-medium rounded-lg hover:bg-[#E8E8E6] transition-colors disabled:opacity-50 mt-4"
                  >
                    {linkingAccount ? 'Verbinden...' : 'Automatisch Eerste Beschikbare Account Koppelen'}
                  </button>
                )}
              </div>
            )}
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
            {needsBrokerLink && onNavigateToBroker && (
              <button
                onClick={onNavigateToBroker}
                className="px-4 py-2 bg-[#C9A962] text-white font-medium rounded-lg hover:bg-[#B89952] transition-colors whitespace-nowrap"
              >
                LYNX Koppelen
              </button>
            )}
          </div>
        )}

        {/* Stale Data Banner */}
        {isDataStale && (
          <div className="bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#C9A962] font-medium">
                  Gecachte data van {formatTimeAgo(lastMarketDataUpdate)} wordt getoond
                </p>
                <p className="text-[#636E72] text-sm">
                  Live data niet beschikbaar. Prijzen en posities kunnen verouderd zijn.
                </p>
              </div>
              <button
                onClick={handleRetryConnection}
                className="px-3 py-1.5 bg-[#C9A962]/20 text-[#C9A962] rounded-lg hover:bg-[#C9A962]/30 text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Vernieuwen
              </button>
            </div>
          </div>
        )}

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

// Wrapper with Provider
export default function TradingDashboard({ user, onBack, onNavigateToBroker }) {
  return (
    <TradingProvider user={user}>
      <TradingDashboardContent onBack={onBack} onNavigateToBroker={onNavigateToBroker} />
    </TradingProvider>
  );
}
