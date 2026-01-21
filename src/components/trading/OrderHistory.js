import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { History, RefreshCw } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import {
  DataCard,
  DataCardHeader,
  DataCardTitle,
  DataCardRow,
  DataCardList,
  DataCardEmpty,
} from '../common/DataCard';

const STATUS_COLORS = {
  'Submitted': 'text-blue-400 bg-blue-900/20',
  'Filled': 'text-green-400 bg-green-900/20',
  'PartiallyFilled': 'text-orange-400 bg-orange-900/20',
  'Cancelled': 'text-gray-400 bg-gray-900/20',
  'Rejected': 'text-red-400 bg-red-900/20',
  'PendingSubmit': 'text-yellow-400 bg-yellow-900/20',
  'PreSubmitted': 'text-yellow-400 bg-yellow-900/20',
};

export default function OrderHistory() {
  const { orders, fetchOrders, loading } = useTrading();
  const isMobile = useIsMobile();

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'text-gray-400 bg-gray-900/20';
  };

  return (
    <div className="bg-[#1A1B1F] border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-[#28EBCF]" />
          Order History
        </h3>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Orders - Mobile Card View */}
      {isMobile ? (
        <div className="p-4">
          {orders.length === 0 ? (
            <DataCardEmpty
              icon={History}
              title="No orders found"
              description="Your order history will appear here"
            />
          ) : (
            <DataCardList>
              {orders.map((order, idx) => {
                const isBuy = order.side === 'BUY';
                return (
                  <DataCard key={idx}>
                    <DataCardHeader>
                      <DataCardTitle
                        title={order.symbol}
                        subtitle={`#${order.order_id?.substring(0, 8) || '-'}`}
                        badge={order.status}
                        badgeVariant={
                          order.status === 'Filled' ? 'success' :
                          order.status === 'Rejected' || order.status === 'Cancelled' ? 'danger' :
                          order.status === 'PartiallyFilled' ? 'warning' :
                          'info'
                        }
                      />
                    </DataCardHeader>
                    <DataCardRow
                      label="Side"
                      value={
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isBuy ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                        }`}>
                          {order.side}
                        </span>
                      }
                    />
                    <DataCardRow
                      label="Quantity"
                      value={order.quantity}
                      mono
                    />
                    <DataCardRow
                      label="Filled"
                      value={`${order.filled_quantity || 0} / ${order.quantity}`}
                      valueColor={order.filled_quantity === order.quantity ? 'success' : 'muted'}
                      mono
                    />
                    <DataCardRow
                      label="Avg Price"
                      value={formatPrice(order.avg_fill_price)}
                      mono
                    />
                  </DataCard>
                );
              })}
            </DataCardList>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Order ID</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Symbol</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Side</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Qty</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Filled</th>
                <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Avg Price</th>
                <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                      {order.order_id?.substring(0, 8) || '-'}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {order.symbol}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        order.side === 'BUY' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {order.filled_quantity || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatPrice(order.avg_fill_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
