import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { Trash2, ShoppingCart, AlertTriangle } from 'lucide-react';

const ORDER_TYPE_LABELS = {
  'MKT': 'Market',
  'LMT': 'Limit',
  'STP': 'Stop',
  'STP_LMT': 'Stop Limit',
};

export default function OrderBasket({ onExecute }) {
  const { orderBasket, removeFromBasket, clearBasket, isExecuting } = useTrading();

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);
  };

  // Calculate basket summary
  const buyOrders = orderBasket.filter(o => o.side === 'BUY');
  const sellOrders = orderBasket.filter(o => o.side === 'SELL');

  return (
    <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl overflow-hidden">
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
            {orderBasket.map((order) => (
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
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-400">Buy Orders:</span>
                <span className="text-green-400 font-medium ml-2">{buyOrders.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Sell Orders:</span>
                <span className="text-red-400 font-medium ml-2">{sellOrders.length}</span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={onExecute}
              disabled={isExecuting || orderBasket.length === 0}
              className="w-full py-3 bg-[#28EBCF] text-gray-900 font-bold rounded-lg hover:bg-[#20D4BA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                  Executing...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Execute All Orders ({orderBasket.length})
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
