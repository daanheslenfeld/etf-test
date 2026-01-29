import React from 'react';
import { BatchTradingProvider, useBatchTrading } from '../../context/BatchTradingContext';
import BatchStatusBanner from './BatchStatusBanner';
import VirtualPortfolioCard from './VirtualPortfolioCard';
import OrderIntentionForm from './OrderIntentionForm';
import PendingIntentionsList from './PendingIntentionsList';
import { AlertTriangle, Info } from 'lucide-react';

function BatchTradingContent() {
  const { loading, error } = useBatchTrading();

  return (
    <div className="space-y-6">
      {/* Batch Status Banner */}
      <BatchStatusBanner />

      {/* Info Banner */}
      <div className="bg-[#6B7B8A]/10 border border-[#6B7B8A]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#6B7B8A] mt-0.5" />
          <div>
            <h4 className="font-bold text-[#2D3436] mb-1">How Batch Trading Works</h4>
            <ul className="text-sm text-[#636E72] space-y-1">
              <li>1. Submit your buy/sell orders anytime before 13:55 CET</li>
              <li>2. Your cash is reserved for BUY orders (released if cancelled)</li>
              <li>3. At 14:00 CET, all orders are aggregated and executed</li>
              <li>4. Shares are allocated proportionally to all participants</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <div className="bg-[#C0736D]/10 border border-[#C0736D]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#C0736D]" />
          <span className="text-[#C0736D]">{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Portfolio & Form */}
        <div className="lg:col-span-1 space-y-6">
          <VirtualPortfolioCard />
          <OrderIntentionForm />
        </div>

        {/* Right Column - Pending Orders */}
        <div className="lg:col-span-2">
          <PendingIntentionsList />
        </div>
      </div>
    </div>
  );
}

// Wrapper component that provides the context
export default function BatchTradingDashboard({ user }) {
  return (
    <BatchTradingProvider user={user}>
      <BatchTradingContent />
    </BatchTradingProvider>
  );
}
