import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

const TRADING_API_URL = 'http://localhost:8002';

// Cache keys for localStorage
const CACHE_KEYS = {
  MARKET_DATA: 'trading_cache_marketData',
  POSITIONS: 'trading_cache_positions',
  ACCOUNT_SUMMARY: 'trading_cache_accountSummary',
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
  brokerLinked: false,  // Whether user has a linked broker account

  // Portfolio data
  positions: [],
  cashBalance: 0,
  portfolioValue: 0,
  todayPnL: 0,

  // ETFs available for trading
  etfs: [],
  quotes: {},

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
  SET_POSITIONS: 'SET_POSITIONS',
  SET_ETFS: 'SET_ETFS',
  SET_QUOTES: 'SET_QUOTES',
  SET_ORDERS: 'SET_ORDERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TO_BASKET: 'ADD_TO_BASKET',
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
};

// Reducer
function tradingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CONNECTION:
      return { ...state, connected: action.payload.connected, accountId: action.payload.accountId, tradingMode: action.payload.tradingMode || 'PAPER' };
    case ACTIONS.SET_BROKER_LINKED:
      return { ...state, brokerLinked: action.payload.linked, accountId: action.payload.accountId || state.accountId };
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
      return { ...state, cashBalance: action.payload.cashBalance, portfolioValue: action.payload.portfolioValue, todayPnL: action.payload.todayPnL };
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
      const healthRes = await fetch(`${TRADING_API_URL}/health`);
      if (!healthRes.ok) throw new Error('API not available');

      const health = await healthRes.json();

      dispatch({
        type: ACTIONS.SET_CONNECTION,
        payload: {
          connected: health.ib_gateway?.connected || false,
          accountId: state.accountId,
          tradingMode: health.trading_mode || 'PAPER'
        }
      });

      return health.ib_gateway?.connected || false;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  }, [state.accountId]);

  // API: Check if user has linked broker account
  const checkBrokerLink = useCallback(async () => {
    try {
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

  // API: Fetch positions with caching
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/positions`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const positions = data.positions || [];

        dispatch({ type: ACTIONS.SET_POSITIONS, payload: positions });
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: false });
        dispatch({ type: ACTIONS.SET_LAST_POSITIONS_UPDATE, payload: Date.now() });

        // Calculate totals
        const totalValue = positions.reduce((sum, p) => sum + (parseFloat(p.market_value) || 0), 0);
        const totalPnL = positions.reduce((sum, p) => sum + (parseFloat(p.unrealized_pnl) || 0), 0);
        const accountSummary = { portfolioValue: totalValue, todayPnL: totalPnL, cashBalance: 0 };

        dispatch({ type: ACTIONS.SET_ACCOUNT_SUMMARY, payload: accountSummary });

        // Save to cache
        saveToCache(CACHE_KEYS.POSITIONS, positions);
        saveToCache(CACHE_KEYS.ACCOUNT_SUMMARY, accountSummary);
      } else {
        throw new Error('API returned error');
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

  // API: Place single order
  const placeOrder = useCallback(async (order) => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/order`, {
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
      return {
        success: res.ok && data.success,
        orderId: data.order_id,
        message: data.message || (res.ok ? 'Order placed' : 'Order failed'),
        details: data.details
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [getAuthHeaders]);

  // Execute all orders in basket
  const executeBasket = useCallback(async () => {
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
      const result = await placeOrder(order);

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

    // Refresh data after execution
    setTimeout(() => {
      fetchOrders();
      fetchPositions();
    }, 1500);
  }, [state.orderBasket, placeOrder, fetchOrders, fetchPositions]);

  // Basket operations
  const addToBasket = useCallback((order) => {
    dispatch({ type: ACTIONS.ADD_TO_BASKET, payload: order });
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

  // Initial load - load cache first, then fetch fresh data
  useEffect(() => {
    const init = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

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

      // Check connection and broker link status
      const connected = await checkConnection();
      const hasLinkedAccount = await checkBrokerLink();

      // Only fetch trading data if user has linked account
      if (hasLinkedAccount) {
        await Promise.all([fetchETFs(), fetchPositions(), fetchOrders()]);
        // Subscribe to market data after connection
        await subscribeToMarketData();
        await fetchMarketData();
      } else {
        // Still fetch ETFs for display
        await fetchETFs();
      }

      // If we loaded cache but couldn't connect, mark as stale
      if (!connected && (cachedMarketData?.data || cachedPositions?.data)) {
        dispatch({ type: ACTIONS.SET_DATA_STALE, payload: true });
      }

      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    };
    init();
  }, [checkConnection, checkBrokerLink, fetchETFs, fetchPositions, fetchOrders, subscribeToMarketData, fetchMarketData]);

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
    checkConnection,
    checkBrokerLink,
    linkBrokerAccount,
    getAvailableAccounts,
    fetchETFs,
    fetchPositions,
    fetchOrders,
    fetchMarketData,
    subscribeToMarketData,
    getMarketDataForSymbol,
    placeOrder,
    executeBasket,
    addToBasket,
    removeFromBasket,
    updateBasketOrder,
    clearBasket,
    clearError,
    clearExecutionResults,
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
