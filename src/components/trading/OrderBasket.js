import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { Trash2, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const ORDER_TYPE_LABELS = {
  'MKT': 'Market',
  'LMT': 'Limit',
  'STP': 'Stop',
  'STP_LMT': 'Stop Limit',
};

export default function OrderBasket({ onExecute }) {
  const { orderBasket, removeFromBasket, clearBasket, isExecuting, marketData, safetyLimits, isLive, tradingMode } = useTrading();

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);
  };

  // Get estimated price for an order (use limit price, or market price)
  const getEstimatedPrice = (order) => {
    if (order.limitPrice) return order.limitPrice;
    const md = marketData[order.symbol];
    if (!md) return null;
    // For market orders, use ask for buy, bid for sell
    return order.side === 'BUY' ? md.ask : md.bid;
  };

  // Calculate estimated cash impact
  const calculateCashImpact = () => {
    let totalBuy = 0;
    let totalSell = 0;

    orderBasket.forEach(order => {
      const price = getEstimatedPrice(order);
      if (price) {
        const value = price * order.quantity;
        if (order.side === 'BUY') {
          totalBuy += value;
        } else {
          totalSell += value;
        }
      }
    });

    return { totalBuy, totalSell, net: totalSell - totalBuy };
  };

  // Calculate basket summary
  const buyOrders = orderBasket.filter(o => o.side === 'BUY');
  const sellOrders = orderBasket.filter(o => o.side === 'SELL');
  const cashImpact = calculateCashImpact();

  // Check for bulk order
  const isBulkOrder = orderBasket.length >= (safetyLimits?.bulkOrderThreshold || 3);
  // Check for large orders in basket
  const hasLargeOrder = orderBasket.some(o => o.quantity >= (safetyLimits?.largeOrderThreshold || 25));

  return (
    <div className={`bg-[#1A1B1F] border rounded-xl overflow-hidden ${isLive ? 'border-red-600/50' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#28EBCF]" />
          Order Basket
          {orderBasket.length > 0 && (
            <span className="bg-[#28EBCF] text-gray-900 text-sm px-2 py-0.5 rounded-full font-bold">
              {orderBasket.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isLive
              ? 'bg-red-600/30 text-red-400 border border-red-600'
              : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
          }`}>
            {tradingMode}
          </div>
          {orderBasket.length > 0 && (
            <button
              onClick={clearBasket}
              disabled={isExecuting}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {orderBasket.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No orders in basket</p>
          <p className="text-sm mt-1">Add orders using the form above</p>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
            {orderBasket.map((order) => {
              const md = marketData[order.symbol];
              const estimatedPrice = getEstimatedPrice(order);
              const estimatedValue = estimatedPrice ? estimatedPrice * order.quantity : null;

              return (
                <div key={order.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          order.side === 'BUY' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                        }`}>
                          {order.side}
                        </span>
                        <span className="font-medium text-white">{order.symbol}</span>
                        <span className="text-gray-400">x{order.quantity}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {ORDER_TYPE_LABELS[order.orderType] || order.orderType}
                        {order.limitPrice && ` @ ${formatPrice(order.limitPrice)}`}
                        {order.stopPrice && ` (Stop: ${formatPrice(order.stopPrice)})`}
                      </div>
                      {/* Market data for this symbol */}
                      {md && order.orderType === 'MKT' && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-green-400">Bid: {formatPrice(md.bid)}</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-red-400">Ask: {formatPrice(md.ask)}</span>
                          {md.spread && (
                            <>
                              <span className="text-gray-500">|</span>
                              <span className="text-gray-400">Spread: {formatPrice(md.spread)}</span>
                            </>
                          )}
                        </div>
                      )}
                      {/* Estimated value */}
                      {estimatedValue && (
                        <div className="mt-1 text-xs text-gray-400">
                          Est. value: <span className={order.side === 'BUY' ? 'text-red-400' : 'text-green-400'}>
                            {order.side === 'BUY' ? '-' : '+'}{formatPrice(estimatedValue)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromBasket(order.id)}
                      disabled={isExecuting}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-400">Buy Orders:</span>
                <span className="text-green-400 font-medium ml-2">{buyOrders.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Sell Orders:</span>
                <span className="text-red-400 font-medium ml-2">{sellOrders.length}</span>
              </div>
            </div>

            {/* Cash Impact */}
            {(cashImpact.totalBuy > 0 || cashImpact.totalSell > 0) && (
              <div className="bg-gray-900/50 rounded-lg p-3 mb-4 text-sm">
                <div className="text-gray-400 mb-2">Estimated Cash Impact</div>
                <div className="grid grid-cols-2 gap-2">
                  {cashImpact.totalBuy > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">-{formatPrice(cashImpact.totalBuy)}</span>
                    </div>
                  )}
                  {cashImpact.totalSell > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">+{formatPrice(cashImpact.totalSell)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Net:</span>
                  <span className={`ml-2 font-medium ${cashImpact.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {cashImpact.net >= 0 ? '+' : ''}{formatPrice(cashImpact.net)}
                  </span>
                </div>
              </div>
            )}

            {/* Safety Warnings */}
            {(isBulkOrder || hasLargeOrder || isLive) && orderBasket.length > 0 && (
              <div className={`mb-3 p-2 rounded text-xs ${isLive ? 'bg-red-900/30 border border-red-600/50' : 'bg-orange-900/30 border border-orange-600/50'}`}>
                <div className={`flex items-center gap-1 font-medium ${isLive ? 'text-red-400' : 'text-orange-400'}`}>
                  <AlertTriangle className="w-3 h-3" />
                  Confirmation Required:
                </div>
                <ul className={`mt-1 space-y-0.5 ${isLive ? 'text-red-300' : 'text-orange-300'}`}>
                  {isLive && <li>• Live trading - real money</li>}
                  {isBulkOrder && <li>• Bulk order ({orderBasket.length} orders)</li>}
                  {hasLargeOrder && <li>• Large order in basket</li>}
                </ul>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={onExecute}
              disabled={isExecuting || orderBasket.length === 0}
              className={`w-full py-3 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#28EBCF] hover:bg-[#20D4BA] text-gray-900'
              }`}
            >
              {isExecuting ? (
                <>
                  <div className={`animate-spin h-5 w-5 border-2 border-t-transparent rounded-full ${isLive ? 'border-white' : 'border-gray-900'}`} />
                  Executing...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  {isLive ? `Execute (LIVE) - ${orderBasket.length} Orders` : `Execute All Orders (${orderBasket.length})`}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
