import React, { useState } from 'react';
import { TradingProvider, useTrading } from '../../context/TradingContext';
import PortfolioOverview from './PortfolioOverview';
import OrderForm from './OrderForm';
import OrderBasket from './OrderBasket';
import OrderStatus from './OrderStatus';
import OrderHistory from './OrderHistory';
import ConfirmationModal from './ConfirmationModal';
import { ArrowLeft, Wifi, WifiOff, AlertTriangle, RefreshCw, Clock } from 'lucide-react';

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
    isDataStale,
    lastMarketDataUpdate,
  } = useTrading();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleExecuteClick = () => {
    if (orderBasket.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmExecute = async () => {
    await executeBasket();
    setShowConfirmModal(false);
  };

  const handleRetryConnection = async () => {
    await checkConnection();
    await Promise.all([fetchETFs(), fetchPositions(), fetchOrders()]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28EBCF] mx-auto mb-4"></div>
          <div className="text-white text-xl">Connecting to Trading API...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
                  ? 'bg-red-600/30 text-red-400 border border-red-600'
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column: Order Form + Order Basket */}
          <div className="space-y-6">
            <OrderForm />
            <OrderBasket onExecute={handleExecuteClick} />
          </div>

          {/* Right Column: Portfolio + Order History */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioOverview />
            <OrderHistory />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmExecute}
        orders={orderBasket}
        tradingMode={tradingMode}
      />
    </div>
  );
}

// Wrapper with Provider
export default function TradingDashboard({ onBack }) {
  return (
    <TradingProvider>
      <TradingDashboardContent onBack={onBack} />
    </TradingProvider>
  );
}
