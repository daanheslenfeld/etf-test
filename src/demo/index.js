/**
 * Demo Mode Configuration
 *
 * Automatically activates on Vercel (production) or when REACT_APP_DEMO_MODE=true
 * In demo mode, no real API calls are made - all data is mocked
 */

import {
  demoAccountInfo,
  demoAccountSummary,
  demoPositions,
  demoIndices,
  demoMarketData,
  demoTradability,
  demoSafetyLimits,
  demoETFs,
  demoOrders,
  demoHealth,
} from './demoData';

// Check if we're in demo mode
// Demo mode is active when:
// 1. Running on Vercel (REACT_APP_VERCEL is set by Vercel)
// 2. Explicitly set via REACT_APP_DEMO_MODE=true
// 3. Not running on localhost
export const isDemoMode = () => {
  // Check environment variables
  if (process.env.REACT_APP_DEMO_MODE === 'true') return true;
  if (process.env.REACT_APP_VERCEL === '1') return true;

  // Check if we're on a production domain (not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return true;
    }
  }

  return false;
};

// Demo API functions that mimic real API responses
export const demoApi = {
  // Health check
  getHealth: async () => {
    await simulateDelay(100);
    return demoHealth;
  },

  // Account info
  getAccountInfo: async () => {
    await simulateDelay(150);
    return demoAccountInfo;
  },

  // Account summary
  getAccountSummary: async () => {
    await simulateDelay(150);
    return demoAccountSummary;
  },

  // Positions
  getPositions: async () => {
    await simulateDelay(200);
    return { positions: demoPositions };
  },

  // Market indices
  getIndices: async () => {
    await simulateDelay(100);
    // Add slight random variation to make it feel live
    const indices = demoIndices.map(idx => ({
      ...idx,
      price: idx.price * (1 + (Math.random() - 0.5) * 0.001),
      change: idx.change + (Math.random() - 0.5) * 0.5,
      change_percent: idx.change_percent + (Math.random() - 0.5) * 0.05,
    }));
    return { indices };
  },

  // Market data
  getMarketData: async () => {
    await simulateDelay(150);
    // Add slight random variation
    const data = Object.entries(demoMarketData).map(([symbol, quote]) => ({
      symbol,
      ...quote,
      last: quote.last * (1 + (Math.random() - 0.5) * 0.002),
      timestamp: Date.now(),
    }));
    return { data };
  },

  // ETFs list
  getETFs: async () => {
    await simulateDelay(100);
    return { etfs: demoETFs };
  },

  // Tradability
  getTradability: async () => {
    await simulateDelay(150);
    return demoTradability;
  },

  // Safety limits
  getSafetyLimits: async () => {
    await simulateDelay(100);
    return demoSafetyLimits;
  },

  // Orders
  getOrders: async () => {
    await simulateDelay(100);
    return { orders: demoOrders };
  },

  // Available accounts
  getAvailableAccounts: async () => {
    await simulateDelay(100);
    return { accounts: ['DEMO123456'] };
  },

  // Link broker (simulated)
  linkBroker: async () => {
    await simulateDelay(300);
    return { linked: true, account_id: 'DEMO123456', message: 'Demo account linked' };
  },

  // Check order safety (always allowed in demo)
  checkOrderSafety: async (order) => {
    await simulateDelay(100);
    return {
      allowed: true,
      reason: null,
      requires_confirmation: false,
      confirmation_type: null,
      warnings: ['Demo mode - orders are simulated'],
      trading_mode: 'DEMO',
      is_live: false,
      available_funds: demoAccountSummary.available_funds,
      required_funds: order.quantity * (order.estimatedPrice || 100),
      estimated_price: order.estimatedPrice || 100,
    };
  },

  // Place order (simulated)
  placeOrder: async (order) => {
    await simulateDelay(500);
    return {
      success: true,
      order_id: `DEMO-${Date.now()}`,
      message: 'Demo order simulated - no real execution',
      details: {
        trading_mode: 'DEMO',
        is_live: false,
        is_demo: true,
      },
    };
  },

  // Subscribe to market data (no-op in demo)
  subscribeMarketData: async () => {
    await simulateDelay(50);
    return { success: true };
  },
};

// Helper to simulate network delay
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export everything
export {
  demoAccountInfo,
  demoAccountSummary,
  demoPositions,
  demoIndices,
  demoMarketData,
  demoTradability,
  demoSafetyLimits,
  demoETFs,
  demoOrders,
  demoHealth,
};
