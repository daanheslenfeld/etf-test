import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { History, RefreshCw, XCircle } from 'lucide-react';
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
  'Submitted': 'text-[#6B7B8A] bg-[#6B7B8A]/10',
  'Filled': 'text-[#7C9885] bg-[#7C9885]/10',
  'PartiallyFilled': 'text-[#C9A962] bg-[#C9A962]/10',
  'Cancelled': 'text-[#636E72] bg-[#ECEEED]',
  'Rejected': 'text-[#C0736D] bg-[#C0736D]/10',
  'PendingSubmit': 'text-[#C9A962] bg-[#C9A962]/10',
  'PreSubmitted': 'text-[#C9A962] bg-[#C9A962]/10',
};

const CANCELLABLE_STATUSES = ['PendingSubmit', 'PreSubmitted', 'Submitted'];

export default function OrderHistory() {
  const { orders, fetchOrders, cancelOrder, loading } = useTrading();
  const [cancellingId, setCancellingId] = useState(null);
  const isMobile = useIsMobile();

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'text-[#636E72] bg-[#ECEEED]';
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Weet je zeker dat je deze order wilt annuleren?')) return;
    setCancellingId(orderId);
    await cancelOrder(orderId);
    setCancellingId(null);
  };

  const isCancellable = (status) => CANCELLABLE_STATUSES.includes(status);

  return (
    <div className="bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(45,52,54,0.06)]">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8E6] flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
          <History className="w-5 h-5 text-[#7C9885]" />
          Order History
        </h3>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors"
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
                          isBuy ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
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
                    {isCancellable(order.status) && (
                      <div className="pt-2 mt-2 border-t border-[#E8E8E6]">
                        <button
                          onClick={() => handleCancel(order.order_id)}
                          disabled={cancellingId === order.order_id}
                          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#C0736D] bg-[#C0736D]/10 rounded-lg hover:bg-[#C0736D]/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {cancellingId === order.order_id ? 'Annuleren...' : 'Annuleer Order'}
                        </button>
                      </div>
                    )}
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
            <thead className="bg-[#F5F6F4]">
              <tr>
                <th className="text-left text-[#636E72] text-sm font-medium px-4 py-3">Order ID</th>
                <th className="text-left text-[#636E72] text-sm font-medium px-4 py-3">Symbol</th>
                <th className="text-left text-[#636E72] text-sm font-medium px-4 py-3">Side</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Qty</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Filled</th>
                <th className="text-right text-[#636E72] text-sm font-medium px-4 py-3">Avg Price</th>
                <th className="text-center text-[#636E72] text-sm font-medium px-4 py-3">Status</th>
                <th className="text-center text-[#636E72] text-sm font-medium px-4 py-3">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E6]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[#B2BEC3] py-8">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F6F4] transition-colors">
                    <td className="px-4 py-3 text-[#636E72] text-sm font-mono">
                      {order.order_id?.substring(0, 8) || '-'}
                    </td>
                    <td className="px-4 py-3 text-[#2D3436] font-medium">
                      {order.symbol}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        order.side === 'BUY' ? 'bg-[#7C9885]/10 text-[#7C9885]' : 'bg-[#C0736D]/10 text-[#C0736D]'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#636E72]">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-[#636E72]">
                      {order.filled_quantity || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-[#636E72]">
                      {formatPrice(order.avg_fill_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isCancellable(order.status) ? (
                        <button
                          onClick={() => handleCancel(order.order_id)}
                          disabled={cancellingId === order.order_id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#C0736D] bg-[#C0736D]/10 rounded-lg hover:bg-[#C0736D]/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {cancellingId === order.order_id ? '...' : 'Annuleer'}
                        </button>
                      ) : (
                        <span className="text-[#B2BEC3] text-xs">-</span>
                      )}
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
