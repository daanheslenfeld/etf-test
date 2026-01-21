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
    brokerLinked,
    linkBrokerAccount,
    getAvailableAccounts,
    subscribeToMarketData,
    fetchMarketData,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <MarketIndicesTicker />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28EBCF] mx-auto mb-4"></div>
            <div className="text-white text-xl">Connecting to Trading API...</div>
          </div>
        </div>
      </div>
    );
  }

  // Broker not linked - show connection flow
  if (!brokerLinked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <MarketIndicesTicker />
        <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={onBack}
                className="text-[#28EBCF] font-medium hover:text-[#20D4BA] flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-white">Connect LYNX Account</h1>
              <div className="w-32"></div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#28EBCF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-[#28EBCF]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your LYNX Account</h2>
              <p className="text-gray-400">
                Link your LYNX broker account to start trading ETFs directly from this portal.
              </p>
            </div>

            {linkError && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{linkError}</p>
              </div>
            )}

            {!connected ? (
              <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-orange-400 font-medium mb-2">IB Gateway Not Connected</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Please ensure IB Gateway is running and logged in before connecting your account.
                    </p>
                    <ul className="text-gray-400 text-sm list-disc list-inside space-y-1 mb-4">
                      <li>Start IB Gateway on localhost:4001</li>
                      <li>Log in with your LYNX credentials</li>
                      <li>Wait for connection to be established</li>
                    </ul>
                    <button
                      onClick={checkConnection}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Check Connection
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <Wifi className="w-5 h-5" />
                    <span>IB Gateway Connected</span>
                  </div>
                </div>

                {availableAccounts.length === 0 ? (
                  <button
                    onClick={loadAvailableAccounts}
                    className="w-full py-3 bg-[#28EBCF] text-gray-900 font-bold rounded-lg hover:bg-[#20D4BA] transition-colors"
                  >
                    Load Available Accounts
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Select the account to link:</p>
                    {availableAccounts.map((acct) => (
                      <button
                        key={acct}
                        onClick={() => handleLinkAccount(acct)}
                        disabled={linkingAccount}
                        className="w-full py-4 px-6 bg-gray-800 border border-gray-600 rounded-lg hover:border-[#28EBCF] hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">{acct}</div>
                            <div className="text-gray-400 text-sm">
                              {acct.startsWith('DU') || acct.startsWith('DF') ? 'Paper Trading' : 'Live Trading'}
                            </div>
                          </div>
                          {linkingAccount ? (
                            <div className="animate-spin h-5 w-5 border-2 border-[#28EBCF] border-t-transparent rounded-full" />
                          ) : (
                            <span className="text-[#28EBCF]">Connect</span>
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
                    className="w-full py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 mt-4"
                  >
                    {linkingAccount ? 'Connecting...' : 'Auto-Connect First Available Account'}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Market Indices Ticker */}
      <MarketIndicesTicker />

      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="text-[#28EBCF] font-medium hover:text-[#20D4BA] flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <h1 className="text-xl font-bold text-white">Trading Dashboard</h1>

            <div className="flex items-center gap-4">
              {/* Trading Mode Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                tradingMode === 'LIVE'
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-600'
                  : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
              }`}>
                {tradingMode === 'LIVE' ? 'LIVE' : 'PAPER'}
              </div>

              {/* Stale Data Indicator */}
              {isDataStale && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-600/20 border border-orange-600/50 rounded-full">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-orange-400 hidden sm:inline">
                    Cached {formatTimeAgo(lastMarketDataUpdate)}
                  </span>
                </div>
              )}

              {/* Connection Status */}
              {connected ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Wifi className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">{accountId || 'Connected'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400">
                  <WifiOff className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-xl p-4 mb-6 flex justify-between items-center">
            <p className="text-red-400">{error}</p>
            <button onClick={clearError} className="text-red-300 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Stale Data Banner */}
        {isDataStale && (
          <div className="bg-orange-900/20 border border-orange-600/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-400 font-medium">
                  Showing cached data from {formatTimeAgo(lastMarketDataUpdate)}
                </p>
                <p className="text-gray-400 text-sm">
                  Live data unavailable. Prices and positions may be outdated.
                </p>
              </div>
              <button
                onClick={handleRetryConnection}
                className="px-3 py-1.5 bg-orange-600/30 text-orange-400 rounded-lg hover:bg-orange-600/50 text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Connection Warning */}
        {!connected && (
          <div className="bg-orange-900/30 border border-orange-600 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-orange-400 mb-2">IB Gateway Not Connected</h2>
                <p className="text-gray-300 mb-4">
                  {isDataStale ? 'Displaying cached market data. ' : ''}Cannot connect to IB Gateway. Please ensure:
                </p>
                <ul className="text-gray-400 text-sm list-disc list-inside space-y-1 mb-4">
                  <li>IB Gateway is running on localhost:4001</li>
                  <li>You are logged into LYNX Paper Trading</li>
                  <li>The Trading API is running on localhost:8002</li>
                </ul>
                <button
                  onClick={handleRetryConnection}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
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
                ? 'bg-[#28EBCF] text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">ETF Browser</span>
            <span className="sm:hidden">ETFs</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#28EBCF] text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Orders & Portfolio</span>
            <span className="sm:hidden">Orders</span>
            {orderBasket.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
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
        warnings={isLive ? ['LIVE TRADING: Real money will be used'] : []}
      />
    </div>
  );
}

// Wrapper with Provider
export default function TradingDashboard({ user, onBack }) {
  return (
    <TradingProvider user={user}>
      <TradingDashboardContent onBack={onBack} />
    </TradingProvider>
  );
}
