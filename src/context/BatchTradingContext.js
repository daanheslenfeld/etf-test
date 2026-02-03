import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

const TRADING_API_URL = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Base cache keys for localStorage (will be made user-specific)
const CACHE_KEYS = {
  VIRTUAL_PORTFOLIO: 'batch_cache_virtualPortfolio',
  INTENTIONS: 'batch_cache_intentions',
};

// Get user-specific cache key to prevent data leakage between users
const getUserCacheKey = (baseKey, userId) => {
  if (!userId || userId === 0) return null;
  return `${baseKey}_user_${userId}`;
};

// Cache helper functions
const saveToCache = (key, data) => {
  if (!key) return;
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
  if (!key) return null;
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
  // Virtual Portfolio
  cashBalance: 0,
  reservedBalance: 0,
  availableBalance: 0,
  totalDeposited: 0,
  totalWithdrawn: 0,
  holdings: [],

  // Order Intentions
  intentions: [],
  pendingCount: 0,

  // Batch Info
  nextBatchAt: null,
  cancellationCutoff: null,
  ordersLocked: false,

  // UI state
  loading: true,
  error: null,
  submitting: false,

  // Transactions
  transactions: [],
  transactionsLoading: false,
};

// Action types
const ACTIONS = {
  SET_PORTFOLIO: 'SET_PORTFOLIO',
  SET_HOLDINGS: 'SET_HOLDINGS',
  SET_INTENTIONS: 'SET_INTENTIONS',
  ADD_INTENTION: 'ADD_INTENTION',
  REMOVE_INTENTION: 'REMOVE_INTENTION',
  SET_BATCH_INFO: 'SET_BATCH_INFO',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SUBMITTING: 'SET_SUBMITTING',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  SET_TRANSACTIONS_LOADING: 'SET_TRANSACTIONS_LOADING',
  RESET_STATE: 'RESET_STATE',
};

// Reducer
function batchTradingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PORTFOLIO:
      return {
        ...state,
        cashBalance: action.payload.cash_balance ?? state.cashBalance,
        reservedBalance: action.payload.reserved_balance ?? state.reservedBalance,
        availableBalance: action.payload.available_balance ?? state.availableBalance,
        totalDeposited: action.payload.total_deposited ?? state.totalDeposited,
        totalWithdrawn: action.payload.total_withdrawn ?? state.totalWithdrawn,
        holdings: action.payload.holdings ?? state.holdings,
      };
    case ACTIONS.SET_HOLDINGS:
      return { ...state, holdings: action.payload };
    case ACTIONS.SET_INTENTIONS:
      return {
        ...state,
        intentions: action.payload.intentions,
        pendingCount: action.payload.pending_count ?? action.payload.intentions.filter(i => i.status === 'pending').length,
      };
    case ACTIONS.ADD_INTENTION:
      return {
        ...state,
        intentions: [action.payload, ...state.intentions],
        pendingCount: state.pendingCount + 1,
      };
    case ACTIONS.REMOVE_INTENTION:
      return {
        ...state,
        intentions: state.intentions.filter(i => i.id !== action.payload),
        pendingCount: Math.max(0, state.pendingCount - 1),
      };
    case ACTIONS.SET_BATCH_INFO:
      return {
        ...state,
        nextBatchAt: action.payload.next_batch_at,
        cancellationCutoff: action.payload.cancellation_cutoff,
        ordersLocked: action.payload.orders_locked,
      };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    case ACTIONS.SET_TRANSACTIONS:
      return { ...state, transactions: action.payload };
    case ACTIONS.SET_TRANSACTIONS_LOADING:
      return { ...state, transactionsLoading: action.payload };
    case ACTIONS.RESET_STATE:
      return {
        ...initialState,
        loading: false,
      };
    default:
      return state;
  }
}

// Context
const BatchTradingContext = createContext(null);

// Provider
export function BatchTradingProvider({ user, children }) {
  const [state, dispatch] = useReducer(batchTradingReducer, initialState);

  // Track previous user ID to detect user changes
  const prevUserIdRef = useRef(user?.id);

  // Reset state when user changes (prevents data leakage between users)
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    const currentUserId = user?.id;

    if (prevUserId !== undefined && prevUserId !== currentUserId) {
      console.log('[BatchTradingContext] User changed - resetting state');
      dispatch({ type: ACTIONS.RESET_STATE });
    }

    prevUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Create auth headers for API calls
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-Customer-ID': user?.id?.toString() || '0',
      'X-Customer-Email': user?.email || '',
    };
  }, [user]);

  // API: Fetch virtual portfolio
  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/virtual/portfolio`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_PORTFOLIO, payload: data });

        // Cache portfolio data
        const cacheKey = getUserCacheKey(CACHE_KEYS.VIRTUAL_PORTFOLIO, user?.id);
        saveToCache(cacheKey, data);

        return data;
      } else if (res.status === 404) {
        // No portfolio yet - show empty state
        dispatch({ type: ACTIONS.SET_PORTFOLIO, payload: {
          cash_balance: 0,
          reserved_balance: 0,
          available_balance: 0,
          total_deposited: 0,
          total_withdrawn: 0,
          holdings: [],
        }});
      }
    } catch (error) {
      console.error('Error fetching virtual portfolio:', error);

      // Load from cache on failure
      const cacheKey = getUserCacheKey(CACHE_KEYS.VIRTUAL_PORTFOLIO, user?.id);
      const cached = loadFromCache(cacheKey);
      if (cached?.data) {
        dispatch({ type: ACTIONS.SET_PORTFOLIO, payload: cached.data });
      }
    }
    return null;
  }, [getAuthHeaders, user?.id]);

  // API: Fetch holdings only
  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/virtual/portfolio/holdings`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_HOLDINGS, payload: data });
        return data;
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    }
    return [];
  }, [getAuthHeaders]);

  // API: Fetch available balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/virtual/portfolio/balance`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        return data.available_balance || 0;
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
    return state.availableBalance;
  }, [getAuthHeaders, state.availableBalance]);

  // API: Fetch order intentions
  const fetchIntentions = useCallback(async (status = null) => {
    try {
      let url = `${TRADING_API_URL}/intentions`;
      if (status) {
        url += `?status=${status}`;
      }

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_INTENTIONS, payload: data });

        // Cache intentions
        const cacheKey = getUserCacheKey(CACHE_KEYS.INTENTIONS, user?.id);
        saveToCache(cacheKey, data);

        return data;
      }
    } catch (error) {
      console.error('Error fetching intentions:', error);

      // Load from cache on failure
      const cacheKey = getUserCacheKey(CACHE_KEYS.INTENTIONS, user?.id);
      const cached = loadFromCache(cacheKey);
      if (cached?.data) {
        dispatch({ type: ACTIONS.SET_INTENTIONS, payload: cached.data });
      }
    }
    return null;
  }, [getAuthHeaders, user?.id]);

  // API: Fetch pending intentions only
  const fetchPendingIntentions = useCallback(async () => {
    return fetchIntentions('pending');
  }, [fetchIntentions]);

  // API: Create order intention
  const createIntention = useCallback(async (intention) => {
    dispatch({ type: ACTIONS.SET_SUBMITTING, payload: true });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    try {
      const res = await fetch(`${TRADING_API_URL}/intentions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          symbol: intention.symbol,
          conid: intention.conid,
          side: intention.side,
          quantity: parseInt(intention.quantity),
          order_type: intention.orderType || 'MKT',
          limit_price: intention.limitPrice || null,
          estimated_price: intention.estimatedPrice || null,
          isin: intention.isin || null,
          name: intention.name || null,
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        dispatch({ type: ACTIONS.ADD_INTENTION, payload: data.intention });
        // Refresh portfolio to show updated reserved balance
        await fetchPortfolio();
        return { success: true, intention: data.intention, message: data.message };
      } else {
        const errorMessage = data.detail?.message || data.message || 'Failed to create order';
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, message: errorMessage, code: data.detail?.code };
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [getAuthHeaders, fetchPortfolio]);

  // API: Cancel order intention
  const cancelIntention = useCallback(async (intentionId) => {
    dispatch({ type: ACTIONS.SET_SUBMITTING, payload: true });

    try {
      const res = await fetch(`${TRADING_API_URL}/intentions/${intentionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json();

      if (res.ok && data.success) {
        dispatch({ type: ACTIONS.REMOVE_INTENTION, payload: intentionId });
        // Refresh portfolio to show released cash
        await fetchPortfolio();
        return { success: true, message: data.message, releasedAmount: data.released_amount };
      } else {
        const errorMessage = data.detail?.message || data.message || 'Failed to cancel order';
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Network error' };
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [getAuthHeaders, fetchPortfolio]);

  // API: Fetch batch info (next batch timing)
  const fetchBatchInfo = useCallback(async () => {
    try {
      const res = await fetch(`${TRADING_API_URL}/intentions/info/next-batch`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_BATCH_INFO, payload: data });
        return data;
      }
    } catch (error) {
      console.error('Error fetching batch info:', error);
    }
    return null;
  }, [getAuthHeaders]);

  // API: Fetch transactions
  const fetchTransactions = useCallback(async (limit = 50, offset = 0, typeFilter = null) => {
    dispatch({ type: ACTIONS.SET_TRANSACTIONS_LOADING, payload: true });

    try {
      let url = `${TRADING_API_URL}/virtual/portfolio/transactions?limit=${limit}&offset=${offset}`;
      if (typeFilter) {
        url += `&type=${typeFilter}`;
      }

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: ACTIONS.SET_TRANSACTIONS, payload: data.transactions || [] });
        return data;
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      dispatch({ type: ACTIONS.SET_TRANSACTIONS_LOADING, payload: false });
    }
    return null;
  }, [getAuthHeaders]);

  // Get holding by symbol
  const getHoldingBySymbol = useCallback((symbol) => {
    return state.holdings.find(h => h.symbol === symbol) || null;
  }, [state.holdings]);

  // Validate sell order: check we have enough shares
  const validateSellOrder = useCallback((symbol, quantity) => {
    const holding = state.holdings.find(h => h.symbol === symbol);
    if (!holding) {
      return { valid: false, reason: `No holding found for ${symbol}`, maxQuantity: 0 };
    }
    const ownedQty = parseFloat(holding.quantity) || 0;
    if (quantity > ownedQty) {
      return { valid: false, reason: `Cannot sell ${quantity} shares. You only own ${ownedQty}`, maxQuantity: ownedQty };
    }
    return { valid: true, maxQuantity: ownedQty };
  }, [state.holdings]);

  // Validate buy order: check we have enough available cash
  const validateBuyOrder = useCallback((estimatedCost) => {
    const available = state.availableBalance;
    const requiredWithBuffer = estimatedCost * 1.02; // 2% buffer for price movement
    if (requiredWithBuffer > available && available > 0) {
      return {
        valid: false,
        reason: `Insufficient funds. Need ~€${requiredWithBuffer.toFixed(2)}, have €${available.toFixed(2)}`,
        availableFunds: available
      };
    }
    return { valid: true, availableFunds: available };
  }, [state.availableBalance]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (!user?.id) {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        return;
      }

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      try {
        // Load from cache first for fast initial render
        const portfolioCacheKey = getUserCacheKey(CACHE_KEYS.VIRTUAL_PORTFOLIO, user.id);
        const intentionsCacheKey = getUserCacheKey(CACHE_KEYS.INTENTIONS, user.id);

        const cachedPortfolio = loadFromCache(portfolioCacheKey);
        const cachedIntentions = loadFromCache(intentionsCacheKey);

        if (cachedPortfolio?.data) {
          dispatch({ type: ACTIONS.SET_PORTFOLIO, payload: cachedPortfolio.data });
        }
        if (cachedIntentions?.data) {
          dispatch({ type: ACTIONS.SET_INTENTIONS, payload: cachedIntentions.data });
        }

        // Fetch fresh data in parallel
        await Promise.all([
          fetchPortfolio(),
          fetchIntentions(),
          fetchBatchInfo(),
        ]);
      } catch (error) {
        console.error('Error during init:', error);
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Polling for updates (every 30 seconds for batch trading)
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchIntentions();
      fetchBatchInfo();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, fetchIntentions, fetchBatchInfo]);

  const value = {
    ...state,
    fetchPortfolio,
    fetchHoldings,
    fetchBalance,
    fetchIntentions,
    fetchPendingIntentions,
    createIntention,
    cancelIntention,
    fetchBatchInfo,
    fetchTransactions,
    getHoldingBySymbol,
    validateSellOrder,
    validateBuyOrder,
    clearError,
  };

  return (
    <BatchTradingContext.Provider value={value}>
      {children}
    </BatchTradingContext.Provider>
  );
}

// Hook
export function useBatchTrading() {
  const context = useContext(BatchTradingContext);
  if (!context) {
    throw new Error('useBatchTrading must be used within a BatchTradingProvider');
  }
  return context;
}
