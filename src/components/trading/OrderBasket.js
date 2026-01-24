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
    <div className={`bg-[#FEFEFE] border rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${isLive ? 'border-[#6B7B8A]/30' : 'border-[#E8E8E6]'}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8E6] flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#7C9885]" />
          Order Basket
          {orderBasket.length > 0 && (
            <span className="bg-[#7C9885] text-white text-sm px-2 py-0.5 rounded-full font-bold">
              {orderBasket.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isLive
              ? 'bg-[#6B7B8A]/10 text-[#6B7B8A] border border-[#6B7B8A]/30'
              : 'bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/30'
          }`}>
            {tradingMode}
          </div>
          {orderBasket.length > 0 && (
            <button
              onClick={clearBasket}
              disabled={isExecuting}
              className="text-sm text-[#636E72] hover:text-[#C0736D] transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {orderBasket.length === 0 ? (
        <div className="p-8 text-center text-[#B2BEC3]">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No orders in basket</p>
          <p className="text-sm mt-1">Add orders using the form above</p>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto divide-y divide-[#E8E8E6]">
            {orderBasket.map((order) => {
              const md = marketData[order.symbol];
              const estimatedPrice = getEstimatedPrice(order);
              const estimatedValue = estimatedPrice ? estimatedPrice * order.quantity : null;

              return (
                <div key={order.id} className="p-4 hover:bg-[#F5F6F4] transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          order.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                        }`}>
                          {order.side}
                        </span>
                        <span className="font-medium text-[#2D3436]">{order.symbol}</span>
                        <span className="text-[#636E72]">x{order.quantity}</span>
                      </div>
                      <div className="text-sm text-[#B2BEC3] mt-1">
                        {ORDER_TYPE_LABELS[order.orderType] || order.orderType}
                        {order.limitPrice && ` @ ${formatPrice(order.limitPrice)}`}
                        {order.stopPrice && ` (Stop: ${formatPrice(order.stopPrice)})`}
                      </div>
                      {/* Market data for this symbol */}
                      {md && order.orderType === 'MKT' && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-[#7C9885]">Bid: {formatPrice(md.bid)}</span>
                          <span className="text-[#B2BEC3]">|</span>
                          <span className="text-[#C0736D]">Ask: {formatPrice(md.ask)}</span>
                          {md.spread && (
                            <>
                              <span className="text-[#B2BEC3]">|</span>
                              <span className="text-[#636E72]">Spread: {formatPrice(md.spread)}</span>
                            </>
                          )}
                        </div>
                      )}
                      {/* Estimated value */}
                      {estimatedValue && (
                        <div className="mt-1 text-xs text-[#636E72]">
                          Est. value: <span className={order.side === 'BUY' ? 'text-[#C0736D]' : 'text-[#7C9885]'}>
                            {order.side === 'BUY' ? '-' : '+'}{formatPrice(estimatedValue)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromBasket(order.id)}
                      disabled={isExecuting}
                      className="p-2 text-[#B2BEC3] hover:text-[#C0736D] hover:bg-[#C0736D]/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-[#E8E8E6] bg-[#F5F6F4]">
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-[#636E72]">Buy Orders:</span>
                <span className="text-[#7C9885] font-medium ml-2">{buyOrders.length}</span>
              </div>
              <div>
                <span className="text-[#636E72]">Sell Orders:</span>
                <span className="text-[#C0736D] font-medium ml-2">{sellOrders.length}</span>
              </div>
            </div>

            {/* Cash Impact */}
            {(cashImpact.totalBuy > 0 || cashImpact.totalSell > 0) && (
              <div className="bg-[#FEFEFE] rounded-lg p-3 mb-4 text-sm border border-[#E8E8E6]">
                <div className="text-[#636E72] mb-2">Estimated Cash Impact</div>
                <div className="grid grid-cols-2 gap-2">
                  {cashImpact.totalBuy > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-[#C0736D]" />
                      <span className="text-[#C0736D]">-{formatPrice(cashImpact.totalBuy)}</span>
                    </div>
                  )}
                  {cashImpact.totalSell > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#7C9885]" />
                      <span className="text-[#7C9885]">+{formatPrice(cashImpact.totalSell)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-[#E8E8E6]">
                  <span className="text-[#636E72]">Net:</span>
                  <span className={`ml-2 font-medium ${cashImpact.net >= 0 ? 'text-[#7C9885]' : 'text-[#C0736D]'}`}>
                    {cashImpact.net >= 0 ? '+' : ''}{formatPrice(cashImpact.net)}
                  </span>
                </div>
              </div>
            )}

            {/* Safety Warnings */}
            {(isBulkOrder || hasLargeOrder || isLive) && orderBasket.length > 0 && (
              <div className={`mb-3 p-2 rounded text-xs ${isLive ? 'bg-[#6B7B8A]/10 border border-[#6B7B8A]/30' : 'bg-[#C9A962]/10 border border-[#C9A962]/30'}`}>
                <div className={`flex items-center gap-1 font-medium ${isLive ? 'text-[#6B7B8A]' : 'text-[#C9A962]'}`}>
                  <AlertTriangle className="w-3 h-3" />
                  Confirmation Required:
                </div>
                <ul className={`mt-1 space-y-0.5 ${isLive ? 'text-[#6B7B8A]' : 'text-[#C9A962]'}`}>
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
                  ? 'bg-[#6B7B8A] hover:bg-[#5A6A79] text-white'
                  : 'bg-[#7C9885] hover:bg-[#6B8A74] text-white'
              }`}
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
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
