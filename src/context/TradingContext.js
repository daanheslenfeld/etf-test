import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { isDemoMode, demoApi } from '../demo';

const TRADING_API_URL = 'http://localhost:8002';

// Check demo mode once at load time
const IS_DEMO = isDemoMode();
console.log('[TradingContext] Demo mode:', IS_DEMO);

// Cache keys for localStorage
const CACHE_KEYS = {
  MARKET_DATA: 'trading_cache_marketData',
  POSITIONS: 'trading_cache_positions',
  ACCOUNT_SUMMARY: 'trading_cache_accountSummary',
  TRADABILITY: 'trading_cache_tradability',
};

// Cache helper functions
const saveToCache = (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
};

const loadFromCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to load from cache:', e);
  }
  return null;
};

// Initial state
const initialState = {
  // Connection
  connected: false,
  accountId: null,
  tradingMode: 'PAPER',
  isLive: false,  // Critical: true means real money
  brokerLinked: false,  // Whether user has a linked broker account

  // Trading access (owner lock)
  canTrade: true,  // Default true, will be set to false for non-owners
  tradingAccessMessage: null,  // Message to show non-owners

  // Safety limits
  safetyLimits: {
    maxOrderSize: 100,
    maxOrderValue: 10000,
    maxDailyOrders: 50,
    maxDailyExposure: 50000,
    ordersRemaining: 50,
    exposureRemaining: 50000,
    largeOrderThreshold: 25,
    bulkOrderThreshold: 3,
  },

  // Portfolio data
  positions: [],
  cashBalance: 0,
  availableFunds: 0,
  portfolioValue: 0,
  totalValue: 0,
  unrealizedPnL: 0,
  unrealizedPnLPercent: 0,
  buyingPower: 0,

  // ETFs available for trading
  etfs: [],
  quotes: {},

  // Tradability data (which ETFs can be traded via LYNX)
  tradableETFs: {},  // { [isin]: { tradable_via_lynx, contract, ... } }
  tradabilityStats: { totalChecked: 0, totalTradable: 0, totalBlocked: 0, checkedAt: null },

  // Market data: { [symbol]: { bid, ask, last, spread, midPrice, delayed, timestamp } }
  marketData: {},
  marketDataLoading: false,

  // Orders
  orders: [],
  orderBasket: [],

  // UI state
  loading: true,
  error: null,
  isExecuting: false,
  executionResults: [],

  // Cache state
  isDataStale: false,
  lastMarketDataUpdate: null,
  lastPositionsUpdate: null,
};

// Action types
const ACTIONS = {
  SET_CONNECTION: 'SET_CONNECTION',
  SET_BROKER_LINKED: 'SET_BROKER_LINKED',
  SET_TRADING_MODE: 'SET_TRADING_MODE',
  SET_SAFETY_LIMITS: 'SET_SAFETY_LIMITS',
  SET_POSITIONS: 'SET_POSITIONS',
  SET_ETFS: 'SET_ETFS',
  SET_QUOTES: 'SET_QUOTES',
  SET_ORDERS: 'SET_ORDERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TO_BASKET: 'ADD_TO_BASKET',
  ADD_MULTIPLE_TO_BASKET: 'ADD_MULTIPLE_TO_BASKET',
  REMOVE_FROM_BASKET: 'REMOVE_FROM_BASKET',
  UPDATE_BASKET_ORDER: 'UPDATE_BASKET_ORDER',
  CLEAR_BASKET: 'CLEAR_BASKET',
  SET_EXECUTING: 'SET_EXECUTING',
  SET_EXECUTION_RESULTS: 'SET_EXECUTION_RESULTS',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  SET_ACCOUNT_SUMMARY: 'SET_ACCOUNT_SUMMARY',
  SET_MARKET_DATA: 'SET_MARKET_DATA',
  SET_MARKET_DATA_LOADING: 'SET_MARKET_DATA_LOADING',
  SET_DATA_STALE: 'SET_DATA_STALE',
  SET_LAST_MARKET_DATA_UPDATE: 'SET_LAST_MARKET_DATA_UPDATE',
  SET_LAST_POSITIONS_UPDATE: 'SET_LAST_POSITIONS_UPDATE',
  SET_TRADABILITY: 'SET_TRADABILITY',
  SET_TRADING_ACCESS: 'SET_TRADING_ACCESS',
};

// Reducer
function tradingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CONNECTION:
      return { ...state, connected: action.payload.connected, accountId: action.payload.accountId, tradingMode: action.payload.tradingMode || 'PAPER' };
    case ACTIONS.SET_BROKER_LINKED:
      return { ...state, brokerLinked: action.payload.linked, accountId: action.payload.accountId || state.accountId };
    case ACTIONS.SET_TRADING_MODE:
      return { ...state, tradingMode: action.payload.mode, isLive: action.payload.isLive };
    case ACTIONS.SET_SAFETY_LIMITS:
      return { ...state, safetyLimits: { ...state.safetyLimits, ...action.payload } };
    case ACTIONS.SET_POSITIONS:
      return { ...state, positions: action.payload };
    case ACTIONS.SET_ETFS:
      return { ...state, etfs: action.payload };
    case ACTIONS.SET_QUOTES:
      return { ...state, quotes: { ...state.quotes, ...action.payload } };
    case ACTIONS.SET_ORDERS:
      return { ...state, orders: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.ADD_TO_BASKET:
      return { ...state, orderBasket: [...state.orderBasket, { ...action.payload, id: Date.now() }] };
    case ACTIONS.ADD_MULTIPLE_TO_BASKET:
      // Add multiple orders at once with sequential IDs and bulk grouping
      const bulkOrders = action.payload.map((order, index) => ({
        ...order,
        id: Date.now() + index,
        bulkId: action.bulkId || Date.now()
      }));
      return { ...state, orderBasket: [...state.orderBasket, ...bulkOrders] };
    case ACTIONS.REMOVE_FROM_BASKET:
      return { ...state, orderBasket: state.orderBasket.filter(o => o.id !== action.payload) };
    case ACTIONS.UPDATE_BASKET_ORDER:
      return { ...state, orderBasket: state.orderBasket.map(o => o.id === action.payload.id ? { ...o, ...action.payload.updates } : o) };
    case ACTIONS.CLEAR_BASKET:
      return { ...state, orderBasket: [] };
    case ACTIONS.SET_EXECUTING:
      return { ...state, isExecuting: action.payload };
    case ACTIONS.SET_EXECUTION_RESULTS:
      return { ...state, executionResults: action.payload };
    case ACTIONS.UPDATE_ORDER_STATUS:
      return { ...state, executionResults: state.executionResults.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates } : r) };
    case ACTIONS.SET_ACCOUNT_SUMMARY:
      return {
        ...state,
        cashBalance: action.payload.cashBalance ?? state.cashBalance,
        availableFunds: action.payload.availableFunds ?? state.availableFunds,
        portfolioValue: action.payload.portfolioValue ?? state.portfolioValue,
        totalValue: action.payload.totalValue ?? state.totalValue,
        unrealizedPnL: action.payload.unrealizedPnL ?? state.unrealizedPnL,
        unrealizedPnLPercent: action.payload.unrealizedPnLPercent ?? state.unrealizedPnLPercent,
        buyingPower: action.payload.buyingPower ?? state.buyingPower,
      };
    case ACTIONS.SET_MARKET_DATA:
      return { ...state, marketData: action.payload };
    case ACTIONS.SET_MARKET_DATA_LOADING:
      return { ...state, marketDataLoading: action.payload };
    case ACTIONS.SET_DATA_STALE:
      return { ...state, isDataStale: action.payload };
    case ACTIONS.SET_LAST_MARKET_DATA_UPDATE:
      return { ...state, lastMarketDataUpdate: action.payload };
    case ACTIONS.SET_LAST_POSITIONS_UPDATE:
      return { ...state, lastPositionsUpdate: action.payload };
    case ACTIONS.SET_TRADABILITY:
      return {
        ...state,
        tradableETFs: action.payload.etfs,
        tradabilityStats: action.payload.stats,
      };
    case ACTIONS.SET_TRADING_ACCESS:
      return {
        ...state,
        canTrade: action.payload.canTrade,
        tradingAccessMessage: action.payload.message,
      };
    default:
      return state;
  }
}

// Context
const TradingContext = createContext(null);

// Provider
export function TradingProvider({ user, children }) {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // Create auth headers for API calls
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-Customer-ID': user?.id?.toString() || '0',
      'X-Customer-Email': user?.email || '',
    };
  }, [user]);

  // API: Check connection status
  const checkConnection = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const health = await demoApi.getHealth();
        dispatch({
          type: ACTIONS.SET_CONNECTION,
          payload: { connected: true, accountId: 'DEMO123456', tradingMode: 'DEMO' }
        });
        dispatch({
          type: ACTIONS.SET_TRADING_MODE,
          payload: { mode: 'DEMO', isLive: false }
        });
        return true;
      }

      const healthRes = await fetch(`${TRADING_API_URL}/health`);
      if (!healthRes.ok) throw new Error('API not available');

      const health = await healthRes.json();

      // Determine trading mode from account ID (DU/DF = paper, else = live)
      const accountId = health.ib_gateway?.account || '';
      const isPaperAccount = accountId.startsWith('DU') || accountId.startsWith('DF');

      // If account is real (not DU/DF), it's LIVE regardless of backend config
      const isLive = accountId && !isPaperAccount;
      const tradingMode = isLive ? 'LIVE' : 'PAPER';

      dispatch({
        type: ACTIONS.SET_CONNECTION,
        payload: {
          connected: health.ib_gateway?.connected || false,
          accountId: state.accountId,
          tradingMode: tradingMode
        }
      });

      dispatch({
        type: ACTIONS.SET_TRADING_MODE,
        payload: { mode: tradingMode, isLive }
      });

      return health.ib_gateway?.connected || false;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  }, [state.accountId]);

  // API: Fetch user's safety limits
  const fetchSafetyLimits = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getSafetyLimits();
        dispatch({
          type: ACTIONS.SET_SAFETY_LIMITS,
          payload: {
            maxOrderSize: data.max_order_size,
            maxOrderValue: data.max_order_value,
            maxDailyOrders: data.max_orders,
            maxDailyExposure: data.max_exposure,
            ordersRemaining: data.orders_remaining,
            exposureRemaining: data.exposure_remaining,
            orderCount: data.order_count,
            totalExposure: data.total_exposure,
          }
        });
        return;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/safety/limits`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({
          type: ACTIONS.SET_SAFETY_LIMITS,
          payload: {
            maxOrderSize: data.max_order_size,
            maxOrderValue: data.max_order_value,
            maxDailyOrders: data.max_orders,
            maxDailyExposure: data.max_exposure,
            ordersRemaining: data.orders_remaining,
            exposureRemaining: data.exposure_remaining,
            orderCount: data.order_count,
            totalExposure: data.total_exposure,
          }
        });
        // NOTE: Do NOT update trading mode here - it's derived from account ID in checkConnection
      }
    } catch (error) {
      console.error('Error fetching safety limits:', error);
    }
  }, [getAuthHeaders]);

  // API: Check trading access (owner lock)
  const checkTradingAccess = useCallback(async () => {
    try {
      // In demo mode, always allow trading
      if (IS_DEMO) {
        dispatch({
          type: ACTIONS.SET_TRADING_ACCESS,
          payload: { canTrade: true, message: null }
        });
        return { canTrade: true };
      }

      const res = await fetch(`${TRADING_API_URL}/trading/access`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({
          type: ACTIONS.SET_TRADING_ACCESS,
          payload: {
            canTrade: data.can_trade,
            message: data.can_trade ? null : data.message
          }
        });
        return { canTrade: data.can_trade, message: data.message };
      } else {
        // If endpoint fails, assume no trading access for safety
        dispatch({
          type: ACTIONS.SET_TRADING_ACCESS,
          payload: { canTrade: false, message: 'Trading disabled. Demo mode only.' }
        });
        return { canTrade: false, message: 'Trading disabled. Demo mode only.' };
      }
    } catch (error) {
      console.error('Error checking trading access:', error);
      // On error, default to no trading for safety
      dispatch({
        type: ACTIONS.SET_TRADING_ACCESS,
        payload: { canTrade: false, message: 'Trading disabled. Demo mode only.' }
      });
      return { canTrade: false, message: 'Trading disabled. Demo mode only.' };
    }
  }, [getAuthHeaders]);

  // API: Pre-check order safety
  const checkOrderSafety = useCallback(async (order) => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.checkOrderSafety(order);
        return {
          allowed: data.allowed,
          reason: data.reason,
          requiresConfirmation: data.requires_confirmation,
          confirmationType: data.confirmation_type,
          warnings: data.warnings || ['Demo mode - orders are simulated'],
          tradingMode: 'DEMO',
          isLive: false,
          availableFunds: data.available_funds,
          requiredFunds: data.required_funds,
          estimatedPrice: data.estimated_price
        };
      }

      const res = await fetch(`${TRADING_API_URL}/trading/safety/check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          symbol: order.symbol,
          conid: order.conid,
          side: order.side,
          quantity: parseInt(order.quantity),
          order_type: order.orderType || 'MKT',
          estimated_price: order.estimatedPrice || null
        })
      });
      const data = await res.json();
      return {
        allowed: data.allowed,
        reason: data.reason,
        requiresConfirmation: data.requires_confirmation,
        confirmationType: data.confirmation_type,
        warnings: data.warnings || [],
        tradingMode: (data.trading_mode || 'paper').toUpperCase(),
        isLive: data.is_live === true,
        availableFunds: data.available_funds,
        requiredFunds: data.required_funds,
        estimatedPrice: data.estimated_price
      };
    } catch (error) {
      return { allowed: false, reason: error.message, warnings: [] };
    }
  }, [getAuthHeaders]);

  // API: Check if user has linked broker account
  const checkBrokerLink = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getAccountInfo();
        dispatch({
          type: ACTIONS.SET_BROKER_LINKED,
          payload: { linked: true, accountId: 'DEMO123456' }
        });
        return true;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/account/info`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({
          type: ACTIONS.SET_BROKER_LINKED,
          payload: {
            linked: data.broker_account_linked || false,
            accountId: data.ib_account_id
          }
        });
        return data.broker_account_linked || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking broker link:', error);
      return false;
    }
  }, [getAuthHeaders]);

  // API: Link broker account
  const linkBrokerAccount = useCallback(async (accountId = null) => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.linkBroker();
        dispatch({
          type: ACTIONS.SET_BROKER_LINKED,
          payload: { linked: true, accountId: 'DEMO123456' }
        });
        return { success: true, accountId: 'DEMO123456', message: 'Demo account connected' };
      }

      const body = accountId ? { account_id: accountId } : null;
      const res = await fetch(`${TRADING_API_URL}/trading/broker/link`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });

      if (res.ok) {
        const data = await res.json();
        if (data.linked) {
          dispatch({
            type: ACTIONS.SET_BROKER_LINKED,
            payload: { linked: true, accountId: data.account_id }
          });
          return { success: true, accountId: data.account_id, message: data.message };
        }
      }

      const errorData = await res.json().catch(() => ({}));
      return { success: false, message: errorData.detail || 'Failed to link account' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [getAuthHeaders]);

  // API: Get available accounts
  const getAvailableAccounts = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getAvailableAccounts();
        return data.accounts || ['DEMO123456'];
      }

      const res = await fetch(`${TRADING_API_URL}/trading/account/available`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        return data.accounts || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting available accounts:', error);
      return [];
    }
  }, [getAuthHeaders]);

  // API: Fetch ETFs
  const fetchETFs = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getETFs();
        dispatch({ type: ACTIONS.SET_ETFS, payload: data.etfs || [] });
        return;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/etfs`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_ETFS, payload: data.etfs || [] });
      }
    } catch (error) {
      console.error('Error fetching ETFs:', error);
    }
  }, [getAuthHeaders]);

  // API: Fetch tradability data (which ETFs can be traded via LYNX)
  const fetchTradability = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getTradability();
        const etfsByIsin = {};
        (data.tradable_etfs || []).forEach(etf => {
          etfsByIsin[etf.isin] = etf;
        });
        const stats = {
          totalChecked: data.metadata?.total_checked || 0,
          totalTradable: data.metadata?.total_tradable || 0,
          totalBlocked: data.metadata?.total_blocked || 0,
          checkedAt: data.metadata?.checked_at || null,
        };
        dispatch({ type: ACTIONS.SET_TRADABILITY, payload: { etfs: etfsByIsin, stats } });
        return;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/tradability`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Convert array to object keyed by ISIN
        const etfsByIsin = {};
        (data.tradable_etfs || []).forEach(etf => {
          etfsByIsin[etf.isin] = etf;
        });
        const stats = {
          totalChecked: data.metadata?.total_checked || 0,
          totalTradable: data.metadata?.total_tradable || 0,
          totalBlocked: data.metadata?.total_blocked || 0,
          checkedAt: data.metadata?.checked_at || null,
        };
        dispatch({ type: ACTIONS.SET_TRADABILITY, payload: { etfs: etfsByIsin, stats } });
        saveToCache(CACHE_KEYS.TRADABILITY, { etfs: etfsByIsin, stats });
      }
    } catch (error) {
      console.error('Error fetching tradability:', error);
      // Load from cache on failure
      const cached = loadFromCache(CACHE_KEYS.TRADABILITY);
      if (cached?.data) {
        dispatch({ type: ACTIONS.SET_TRADABILITY, payload: cached.data });
      }
    }
  }, [getAuthHeaders]);

  // Check if an ETF is tradable by ISIN
  const isTradableByIsin = useCallback((isin) => {
    const etf = state.tradableETFs[isin];
    return etf?.tradable_via_lynx || false;
  }, [state.tradableETFs]);

  // Get contract info for a tradable ETF
  const getContractByIsin = useCallback((isin) => {
    const etf = state.tradableETFs[isin];
    if (etf?.tradable_via_lynx && etf?.contract) {
      return etf.contract;
    }
    return null;
  }, [state.tradableETFs]);

  // API: Fetch account summary
  const fetchAccountSummary = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getAccountSummary();
        const summary = {
          cashBalance: data.cash_balance || 0,
          availableFunds: data.available_funds || 0,
          portfolioValue: data.portfolio_value || 0,
          totalValue: data.total_value || 0,
          unrealizedPnL: data.unrealized_pnl || 0,
          unrealizedPnLPercent: data.unrealized_pnl_percent || 0,
          buyingPower: data.buying_power || 0,
        };
        dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: summary });
        return summary;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/account/summary`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const summary = {
          cashBalance: data.cash_balance || 0,
          availableFunds: data.available_funds || 0,
          portfolioValue: data.portfolio_value || 0,
          totalValue: data.total_value || 0,
          unrealizedPnL: data.unrealized_pnl || 0,
          unrealizedPnLPercent: data.unrealized_pnl_percent || 0,
          buyingPower: data.buying_power || 0,
        };
        dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: summary });
        saveToCache(CACHE_KEYS.ACCOUNT_SUMMARY, summary);
        return summary;
      }
    } catch (error) {
      console.error('Error fetching account summary:', error);
    }
    return null;
  }, [getAuthHeaders]);

  // API: Fetch positions with caching
  const fetchPositions = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const [posData, summaryData] = await Promise.all([
          demoApi.getPositions(),
          demoApi.getAccountSummary()
        ]);

        dispatch({ type: ACTIONS.SET_POSITIONS, payload: posData.positions || [] });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: false });
        dispatch({ type: ACTIONS.SET_LAST_POSITIONS_UPDATE, payload: Date.now() });

        const summary = {
          cashBalance: summaryData.cash_balance || 0,
          availableFunds: summaryData.available_funds || 0,
          portfolioValue: summaryData.portfolio_value || 0,
          totalValue: summaryData.total_value || 0,
          unrealizedPnL: summaryData.unrealized_pnl || 0,
          unrealizedPnLPercent: summaryData.unrealized_pnl_percent || 0,
          buyingPower: summaryData.buying_power || 0,
        };
        dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: summary });
        return;
      }

      // Fetch positions and account summary in parallel
      const [posRes, summaryRes] = await Promise.all([
        fetch(`${TRADING_API_URL}/trading/positions`, { headers: getAuthHeaders() }),
        fetch(`${TRADING_API_URL}/trading/account/summary`, { headers: getAuthHeaders() })
      ]);

      if (posRes.ok) {
        const data = await posRes.json();
        const positions = data.positions || [];

        dispatch({ type: ACTIONS.SET_POSITIONS, payload: positions });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: false });
        dispatch({ type: ACTIONS.SET_LAST_POSITIONS_UPDATE, payload: Date.now() });
        saveToCache(CACHE_KEYS.POSITIONS, positions);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        const summary = {
          cashBalance: data.cash_balance || 0,
          availableFunds: data.available_funds || 0,
          portfolioValue: data.portfolio_value || 0,
          totalValue: data.total_value || 0,
          unrealizedPnL: data.unrealized_pnl || 0,
          unrealizedPnLPercent: data.unrealized_pnl_percent || 0,
          buyingPower: data.buying_power || 0,
        };
        dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: summary });
        saveToCache(CACHE_KEYS.ACCOUNT_SUMMARY, summary);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Load from cache on failure
      const cachedPositions = loadFromCache(CACHE_KEYS.POSITIONS);
      const cachedSummary = loadFromCache(CACHE_KEYS.ACCOUNT_SUMMARY);

      if (cachedPositions?.data) {
        dispatch({ type: ACTIONS.SET_POSITIONS, payload: cachedPositions.data });
        dispatch({ type: ACTIONS.SET_LAST_POSITIONS_UPDATE, payload: cachedPositions.timestamp });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: true });
      }
      if (cachedSummary?.data) {
        dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: cachedSummary.data });
      }
    }
  }, [getAuthHeaders]);

  // API: Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getOrders();
        dispatch({ type: ACTIONS.SET_ORDERS, payload: data.orders || [] });
        return;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/orders`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_ORDERS, payload: data.orders || [] });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [getAuthHeaders]);

  // API: Subscribe to all market data
  const subscribeToMarketData = useCallback(async () => {
    try {
      // No-op in demo mode
      if (IS_DEMO) {
        await demoApi.subscribeMarketData();
        return;
      }

      await fetch(`${TRADING_API_URL}/trading/marketdata/subscribe/all`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error subscribing to market data:', error);
    }
  }, [getAuthHeaders]);

  // API: Fetch all market data with caching
  const fetchMarketData = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_MARKET_DATA_LOADING, payload: true });

      // Use demo API in demo mode
      if (IS_DEMO) {
        const data = await demoApi.getMarketData();
        const marketDataBySymbol = {};
        (data.data || []).forEach(item => {
          marketDataBySymbol[item.symbol] = {
            conid: item.conid,
            bid: item.bid,
            ask: item.ask,
            last: item.last,
            bidSize: item.bidSize,
            askSize: item.askSize,
            spread: item.spread,
            midPrice: item.midPrice,
            delayed: item.delayed,
            timestamp: item.timestamp,
          };
        });
        dispatch({ type: ACTIONS.SET_MARKET_DATA, payload: marketDataBySymbol });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: false });
        dispatch({ type: ACTIONS.SET_LAST_MARKET_DATA_UPDATE, payload: Date.now() });
        dispatch({ type: ACTIONS.SET_MARKET_DATA_LOADING, payload: false });
        return;
      }

      const res = await fetch(`${TRADING_API_URL}/trading/marketdata`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Convert array to object keyed by symbol
        const marketDataBySymbol = {};
        (data.data || []).forEach(item => {
          marketDataBySymbol[item.symbol] = {
            conid: item.conid,
            bid: item.bid,
            ask: item.ask,
            last: item.last,
            bidSize: item.bidSize,
            askSize: item.askSize,
            spread: item.spread,
            midPrice: item.midPrice,
            delayed: item.delayed,
            timestamp: item.timestamp,
          };
        });
        dispatch({ type: ACTIONS.SET_MARKET_DATA, payload: marketDataBySymbol });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: false });
        dispatch({ type: ACTIONS.SET_LAST_MARKET_DATA_UPDATE, payload: Date.now() });

        // Save to cache
        saveToCache(CACHE_KEYS.MARKET_DATA, marketDataBySymbol);
      } else {
        throw new Error('API returned error');
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Load from cache on failure
      const cachedMarketData = loadFromCache(CACHE_KEYS.MARKET_DATA);
      if (cachedMarketData?.data && Object.keys(cachedMarketData.data).length > 0) {
        dispatch({ type: ACTIONS.SET_MARKET_DATA, payload: cachedMarketData.data });
        dispatch({ type: ACTIONS.SET_LAST_MARKET_DATA_UPDATE, payload: cachedMarketData.timestamp });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: true });
      }
    } finally {
      dispatch({ type: ACTIONS.SET_MARKET_DATA_LOADING, payload: false });
    }
  }, [getAuthHeaders]);

  // Get market data for a specific symbol
  const getMarketDataForSymbol = useCallback((symbol) => {
    return state.marketData[symbol] || null;
  }, [state.marketData]);

  // Get position by symbol (for sell validation)
  const getPositionBySymbol = useCallback((symbol) => {
    return state.positions.find(p => p.symbol === symbol) || null;
  }, [state.positions]);

  // Validate sell order: check we have enough shares
  const validateSellOrder = useCallback((symbol, quantity) => {
    const position = state.positions.find(p => p.symbol === symbol);
    if (!position) {
      return { valid: false, reason: `No position found for ${symbol}`, maxQuantity: 0 };
    }
    const ownedQty = parseFloat(position.quantity) || 0;
    if (quantity > ownedQty) {
      return { valid: false, reason: `Cannot sell ${quantity} shares. You only own ${ownedQty}`, maxQuantity: ownedQty };
    }
    return { valid: true, maxQuantity: ownedQty };
  }, [state.positions]);

  // Validate buy order: check we have enough cash
  const validateBuyOrder = useCallback((estimatedCost) => {
    const available = state.availableFunds > 0 ? state.availableFunds : state.cashBalance;
    const requiredWithBuffer = estimatedCost * 1.01; // 1% buffer for fees
    if (requiredWithBuffer > available && available > 0) {
      return { valid: false, reason: `Insufficient funds. Need €${requiredWithBuffer.toFixed(2)}, have €${available.toFixed(2)}`, availableFunds: available };
    }
    return { valid: true, availableFunds: available };
  }, [state.availableFunds, state.cashBalance]);

  // API: Place single order (with optional confirmation)
  const placeOrder = useCallback(async (order, confirmed = false) => {
    try {
      // Use demo API in demo mode - NEVER execute real orders
      if (IS_DEMO) {
        const data = await demoApi.placeOrder(order);
        return {
          success: true,
          orderId: data.order_id,
          message: 'Demo: Order gesimuleerd (geen echte uitvoering)',
          details: data.details,
          isLive: false,
          tradingMode: 'DEMO',
          isDemo: true,
        };
      }

      const url = confirmed
        ? `${TRADING_API_URL}/trading/order?confirmed=true`
        : `${TRADING_API_URL}/trading/order`;

      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          symbol: order.symbol,
          conid: order.conid,
          side: order.side,
          quantity: parseInt(order.quantity),
          order_type: order.orderType,
          limit_price: order.limitPrice || null,
          stop_price: order.stopPrice || null,
        })
      });

      const data = await res.json();

      // Check if confirmation is required
      if (data.details?.error === 'CONFIRMATION_REQUIRED') {
        return {
          success: false,
          requiresConfirmation: true,
          confirmationType: data.details.confirmation_type,
          warnings: data.details.warnings || [],
          message: data.message,
          isLive: data.details.is_live === true,
          tradingMode: (data.details.trading_mode || 'paper').toUpperCase()
        };
      }

      // Check for safety limit exceeded
      if (data.details?.error === 'SAFETY_LIMIT_EXCEEDED') {
        return {
          success: false,
          safetyBlocked: true,
          message: data.message,
          isLive: data.details.is_live === true,
          tradingMode: (data.details.trading_mode || 'paper').toUpperCase()
        };
      }

      return {
        success: res.ok && data.success,
        orderId: data.order_id,
        message: data.message || (res.ok ? 'Order placed' : 'Order failed'),
        details: data.details,
        isLive: data.details?.is_live === true,
        tradingMode: (data.details?.trading_mode || 'paper').toUpperCase()
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [getAuthHeaders]);

  // Execute all orders in basket (with confirmation flag)
  const executeBasket = useCallback(async (confirmed = false) => {
    if (state.orderBasket.length === 0) return;

    dispatch({ type: ACTIONS.SET_EXECUTING, payload: true });

    // Initialize execution results
    const initialResults = state.orderBasket.map(order => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      status: 'pending',
      message: 'Submitting...',
      filledQty: 0
    }));
    dispatch({ type: ACTIONS.SET_EXECUTION_RESULTS, payload: initialResults });

    // Execute orders sequentially
    for (const order of state.orderBasket) {
      const result = await placeOrder(order, confirmed);

      // Handle confirmation required
      if (result.requiresConfirmation) {
        dispatch({
          type: ACTIONS.UPDATE_ORDER_STATUS,
          payload: {
            id: order.id,
            updates: {
              status: 'confirmation_required',
              message: result.message,
              warnings: result.warnings,
              confirmationType: result.confirmationType
            }
          }
        });
        // Stop execution if confirmation is needed
        dispatch({ type: ACTIONS.SET_EXECUTING, payload: false });
        return { requiresConfirmation: true, warnings: result.warnings, confirmationType: result.confirmationType };
      }

      // Handle safety blocked
      if (result.safetyBlocked) {
        dispatch({
          type: ACTIONS.UPDATE_ORDER_STATUS,
          payload: {
            id: order.id,
            updates: {
              status: 'blocked',
              message: result.message
            }
          }
        });
        continue; // Continue with other orders
      }

      dispatch({
        type: ACTIONS.UPDATE_ORDER_STATUS,
        payload: {
          id: order.id,
          updates: {
            status: result.success ? 'submitted' : 'rejected',
            message: result.message,
            orderId: result.orderId
          }
        }
      });

      // Small delay between orders
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    dispatch({ type: ACTIONS.SET_EXECUTING, payload: false });
    dispatch({ type: ACTIONS.CLEAR_BASKET });

    // Refresh data after execution (including safety limits)
    setTimeout(() => {
      fetchOrders();
      fetchPositions();
      fetchSafetyLimits();
    }, 1500);

    return { success: true };
  }, [state.orderBasket, placeOrder, fetchOrders, fetchPositions, fetchSafetyLimits]);

  // Basket operations
  const addToBasket = useCallback((order) => {
    dispatch({ type: ACTIONS.ADD_TO_BASKET, payload: order });
  }, []);

  const addMultipleToBasket = useCallback((orders, bulkId = Date.now()) => {
    if (!orders || orders.length === 0) return;
    dispatch({
      type: ACTIONS.ADD_MULTIPLE_TO_BASKET,
      payload: orders,
      bulkId
    });
  }, []);

  const removeFromBasket = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_FROM_BASKET, payload: id });
  }, []);

  const updateBasketOrder = useCallback((id, updates) => {
    dispatch({ type: ACTIONS.UPDATE_BASKET_ORDER, payload: { id, updates } });
  }, []);

  const clearBasket = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_BASKET });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
  }, []);

  const clearExecutionResults = useCallback(() => {
    dispatch({ type: ACTIONS.SET_EXECUTION_RESULTS, payload: [] });
  }, []);

  // Initial load - FAST: show UI immediately, load data in background
  useEffect(() => {
    const init = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      try {
        // Load cached data immediately for instant display
        const cachedMarketData = loadFromCache(CACHE_KEYS.MARKET_DATA);
        const cachedPositions = loadFromCache(CACHE_KEYS.POSITIONS);
        const cachedSummary = loadFromCache(CACHE_KEYS.ACCOUNT_SUMMARY);

        if (cachedMarketData?.data && Object.keys(cachedMarketData.data).length > 0) {
          dispatch({ type: ACTIONS.SET_MARKET_DATA, payload: cachedMarketData.data });
          dispatch({ type: ACTIONS.SET_LAST_MARKET_DATA_UPDATE, payload: cachedMarketData.timestamp });
        }
        if (cachedPositions?.data) {
          dispatch({ type: ACTIONS.SET_POSITIONS, payload: cachedPositions.data });
          dispatch({ type: ACTIONS.SET_LAST_POSITIONS_UPDATE, payload: cachedPositions.timestamp });
        }
        if (cachedSummary?.data) {
          dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: cachedSummary.data });
        }

        // Quick connection check with timeout
        const connectionPromise = Promise.race([
          checkConnection(),
          new Promise(resolve => setTimeout(() => resolve(false), 3000))
        ]);

        const brokerLinkPromise = Promise.race([
          checkBrokerLink(),
          new Promise(resolve => setTimeout(() => resolve(false), 3000))
        ]);

        const [connected, hasLinkedAccount] = await Promise.all([connectionPromise, brokerLinkPromise]);

        // Set loading false IMMEDIATELY after broker check - show UI now
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });

        // Load all other data in background (non-blocking)
        fetchTradability().catch(console.error);
        fetchETFs().catch(console.error);
        checkTradingAccess().catch(console.error);

        if (hasLinkedAccount) {
          fetchPositions().catch(console.error);
          fetchOrders().catch(console.error);
          fetchSafetyLimits().catch(console.error);
          subscribeToMarketData().catch(console.error);
          fetchMarketData().catch(console.error);
        }

        // Mark data as stale if we couldn't connect
        if (!connected && (cachedMarketData?.data || cachedPositions?.data)) {
          dispatch({ type: ACTIONS.SET_DATA_STALE, payload: true });
        }
      } catch (error) {
        console.error('Error during init:', error);
        // Always set loading false even on error
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling for updates (positions, orders, market data)
  // Continue polling even when disconnected to update cache and detect reconnection
  // Only poll if broker is linked
  useEffect(() => {
    if (!state.brokerLinked) return;

    const interval = setInterval(async () => {
      // Try to check connection periodically
      if (!state.connected) {
        await checkConnection();
      }
      fetchPositions();
      fetchOrders();
      fetchMarketData();
    }, 5000); // Poll every 5 seconds for market data

    return () => clearInterval(interval);
  }, [state.connected, state.brokerLinked, fetchPositions, fetchOrders, fetchMarketData, checkConnection]);

  const value = {
    ...state,
    isDemo: IS_DEMO,
    checkConnection,
    checkBrokerLink,
    linkBrokerAccount,
    getAvailableAccounts,
    fetchETFs,
    fetchPositions,
    fetchAccountSummary,
    fetchOrders,
    fetchMarketData,
    fetchSafetyLimits,
    checkOrderSafety,
    checkTradingAccess,
    subscribeToMarketData,
    getMarketDataForSymbol,
    placeOrder,
    executeBasket,
    addToBasket,
    addMultipleToBasket,
    removeFromBasket,
    updateBasketOrder,
    clearBasket,
    clearError,
    clearExecutionResults,
    // Tradability functions
    fetchTradability,
    isTradableByIsin,
    getContractByIsin,
    // Position helpers
    getPositionBySymbol,
    validateSellOrder,
    validateBuyOrder,
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

// Hook
export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
