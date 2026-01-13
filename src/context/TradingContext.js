import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

const TRADING_API_URL = 'http://localhost:8002';

// Initial state
const initialState = {
  // Connection
  connected: false,
  accountId: null,
  tradingMode: 'PAPER',

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
};

// Action types
const ACTIONS = {
  SET_CONNECTION: 'SET_CONNECTION',
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
};

// Reducer
function tradingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CONNECTION:
      return { ...state, connected: action.payload.connected, accountId: action.payload.accountId, tradingMode: action.payload.tradingMode || 'PAPER' };
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
    default:
      return state;
  }
}

// Context
const TradingContext = createContext(null);

// Provider
export function TradingProvider({ children }) {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // API: Check connection and link broker
  const checkConnection = useCallback(async () => {
    try {
      const healthRes = await fetch(`${TRADING_API_URL}/health`);
      if (!healthRes.ok) throw new Error('API not available');

      const health = await healthRes.json();

      if (health.ib_gateway?.connected) {
        // Try to link account
        const linkRes = await fetch(`${TRADING_API_URL}/trading/broker/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (linkRes.ok) {
          const linkData = await linkRes.json();
          if (linkData.linked) {
            dispatch({
              type: ACTIONS.SET_CONNECTION,
              payload: {
                connected: true,
                accountId: linkData.account_id,
                tradingMode: health.trading_mode || 'PAPER'
              }
            });
            return true;
          }
        }
      }

      dispatch({
        type: ACTIONS.SET_CONNECTION,
        payload: { connected: false, accountId: null, tradingMode: health.trading_mode || 'PAPER' }
      });
      return false;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  }, []);

  // API: Fetch ETFs
  const fetchETFs = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/etfs`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_ETFS, payload: data.etfs || [] });
      }
    } catch (error) {
      console.error('Error fetching ETFs:', error);
    }
  }, []);

  // API: Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/positions`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_POSITIONS, payload: data.positions || [] });

        // Calculate totals
        const positions = data.positions || [];
        const totalValue = positions.reduce((sum, p) => sum + (parseFloat(p.market_value) || 0), 0);
        const totalPnL = positions.reduce((sum, p) => sum + (parseFloat(p.unrealized_pnl) || 0), 0);

        dispatch({
          type: ACTIONS.SET_ACCOUNT_SUMMARY,
          payload: { portfolioValue: totalValue, todayPnL: totalPnL, cashBalance: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  }, []);

  // API: Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/orders`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_ORDERS, payload: data.orders || [] });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  // API: Subscribe to all market data
  const subscribeToMarketData = useCallback(async () => {
    try {
      await fetch(`${TRADING_API_URL}/trading/marketdata/subscribe/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error subscribing to market data:', error);
    }
  }, []);

  // API: Fetch all market data
  const fetchMarketData = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_MARKET_DATA_LOADING, payload: true });
      const res = await fetch(`${TRADING_API_URL}/trading/marketdata`);
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
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      dispatch({ type: ACTIONS.SET_MARKET_DATA_LOADING, payload: false });
    }
  }, []);

  // Get market data for a specific symbol
  const getMarketDataForSymbol = useCallback((symbol) => {
    return state.marketData[symbol] || null;
  }, [state.marketData]);

  // API: Place single order
  const placeOrder = useCallback(async (order) => {
    try {
      const res = await fetch(`${TRADING_API_URL}/trading/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  }, []);

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

  // Initial load
  useEffect(() => {
    const init = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      await checkConnection();
      await Promise.all([fetchETFs(), fetchPositions(), fetchOrders()]);
      // Subscribe to market data after connection
      await subscribeToMarketData();
      await fetchMarketData();
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    };
    init();
  }, [checkConnection, fetchETFs, fetchPositions, fetchOrders, subscribeToMarketData, fetchMarketData]);

  // Polling for updates (positions, orders, market data)
  useEffect(() => {
    if (!state.connected) return;

    const interval = setInterval(() => {
      fetchPositions();
      fetchOrders();
      fetchMarketData();
    }, 5000); // Poll every 5 seconds for market data

    return () => clearInterval(interval);
  }, [state.connected, fetchPositions, fetchOrders, fetchMarketData]);

  const value = {
    ...state,
    checkConnection,
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
