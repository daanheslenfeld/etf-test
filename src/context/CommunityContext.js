/**
 * CommunityContext
 *
 * State management for Community features:
 * - Followed portfolios
 * - Leaderboards
 * - Trending portfolios
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// API base URL
const API_BASE = process.env.REACT_APP_TRADING_API_URL || 'http://37.97.173.109:8002';

// Initial state
const initialState = {
  // Followed portfolios
  followedPortfolios: [],
  followedIds: new Set(),

  // Leaderboard data
  leaderboard: {
    month: [],
    quarter: [],
    year: [],
    all_time: [],
  },
  leaderboardPeriod: 'year',

  // Trending portfolios
  trendingPortfolios: [],

  // Loading states
  loading: {
    follows: false,
    leaderboard: false,
    trending: false,
    followAction: false,
  },

  // Errors
  error: null,

  // User context
  userId: null,
  userEmail: null,
};

// Action types
const ACTIONS = {
  SET_USER: 'SET_USER',
  SET_FOLLOWED_PORTFOLIOS: 'SET_FOLLOWED_PORTFOLIOS',
  ADD_FOLLOW: 'ADD_FOLLOW',
  REMOVE_FOLLOW: 'REMOVE_FOLLOW',
  SET_LEADERBOARD: 'SET_LEADERBOARD',
  SET_LEADERBOARD_PERIOD: 'SET_LEADERBOARD_PERIOD',
  SET_TRENDING: 'SET_TRENDING',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function communityReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return {
        ...state,
        userId: action.payload.userId,
        userEmail: action.payload.userEmail,
      };

    case ACTIONS.SET_FOLLOWED_PORTFOLIOS:
      return {
        ...state,
        followedPortfolios: action.payload,
        followedIds: new Set(action.payload.map(f => f.portfolio?.id || f.portfolio_id)),
      };

    case ACTIONS.ADD_FOLLOW:
      if (state.followedIds.has(action.payload.portfolio_id)) {
        return state;
      }
      return {
        ...state,
        followedPortfolios: [action.payload, ...state.followedPortfolios],
        followedIds: new Set([...state.followedIds, action.payload.portfolio_id]),
      };

    case ACTIONS.REMOVE_FOLLOW:
      return {
        ...state,
        followedPortfolios: state.followedPortfolios.filter(
          f => (f.portfolio?.id || f.portfolio_id) !== action.payload
        ),
        followedIds: new Set(
          [...state.followedIds].filter(id => id !== action.payload)
        ),
      };

    case ACTIONS.SET_LEADERBOARD:
      return {
        ...state,
        leaderboard: {
          ...state.leaderboard,
          [action.payload.period]: action.payload.entries,
        },
      };

    case ACTIONS.SET_LEADERBOARD_PERIOD:
      return {
        ...state,
        leaderboardPeriod: action.payload,
      };

    case ACTIONS.SET_TRENDING:
      return {
        ...state,
        trendingPortfolios: action.payload,
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const CommunityContext = createContext(null);

// Provider component
export function CommunityProvider({ children, user }) {
  const [state, dispatch] = useReducer(communityReducer, {
    ...initialState,
    userId: user?.id || user?.customer_id || null,
    userEmail: user?.email || null,
  });

  // Update user when prop changes
  useEffect(() => {
    if (user) {
      dispatch({
        type: ACTIONS.SET_USER,
        payload: {
          userId: user.id || user.customer_id,
          userEmail: user.email,
        },
      });
    }
  }, [user]);

  // Load followed portfolios
  const loadFollowedPortfolios = useCallback(async () => {
    if (!state.userId) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'follows', value: true } });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    try {
      const response = await fetch(
        `${API_BASE}/community/follows?user_id=${state.userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Customer-ID': state.userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load followed portfolios');
      }

      const data = await response.json();
      // Handle new response format: { follows: [...], total: N }
      const follows = data.follows || data;
      dispatch({ type: ACTIONS.SET_FOLLOWED_PORTFOLIOS, payload: follows });
    } catch (error) {
      console.error('Error loading followed portfolios:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'follows', value: false } });
    }
  }, [state.userId]);

  // Follow a portfolio
  const followPortfolio = useCallback(async (portfolioId, portfolio = null) => {
    if (!state.userId) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Please log in to follow portfolios' });
      return false;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'followAction', value: true } });

    try {
      const response = await fetch(
        `${API_BASE}/community/follow/${portfolioId}?user_id=${state.userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Customer-ID': state.userId,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to follow portfolio');
      }

      const result = await response.json();

      // Add to local state
      if (result.is_following && portfolio) {
        dispatch({
          type: ACTIONS.ADD_FOLLOW,
          payload: {
            portfolio,
            portfolio_id: portfolioId,
            followed_at: new Date().toISOString(),
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Error following portfolio:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return false;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'followAction', value: false } });
    }
  }, [state.userId]);

  // Unfollow a portfolio
  const unfollowPortfolio = useCallback(async (portfolioId) => {
    if (!state.userId) return false;

    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'followAction', value: true } });

    try {
      const response = await fetch(
        `${API_BASE}/community/follow/${portfolioId}?user_id=${state.userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Customer-ID': state.userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to unfollow portfolio');
      }

      const result = await response.json();

      // Remove from local state
      if (!result.is_following) {
        dispatch({ type: ACTIONS.REMOVE_FOLLOW, payload: portfolioId });
      }

      return result;
    } catch (error) {
      console.error('Error unfollowing portfolio:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return false;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'followAction', value: false } });
    }
  }, [state.userId]);

  // Check if following a portfolio
  const isFollowing = useCallback((portfolioId) => {
    return state.followedIds.has(portfolioId);
  }, [state.followedIds]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async (period = 'year') => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'leaderboard', value: true } });

    try {
      // Try enhanced endpoint first, fall back to regular
      let response = await fetch(
        `${API_BASE}/portfolios/leaderboard/enhanced?period=${period}&limit=20`
      );

      if (!response.ok) {
        // Fall back to regular leaderboard
        response = await fetch(
          `${API_BASE}/portfolios/leaderboard?period=${period}&limit=20`
        );
      }

      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }

      const data = await response.json();
      dispatch({
        type: ACTIONS.SET_LEADERBOARD,
        payload: { period, entries: data },
      });
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'leaderboard', value: false } });
    }
  }, []);

  // Set leaderboard period
  const setLeaderboardPeriod = useCallback((period) => {
    dispatch({ type: ACTIONS.SET_LEADERBOARD_PERIOD, payload: period });
    loadLeaderboard(period);
  }, [loadLeaderboard]);

  // Load trending portfolios
  const loadTrending = useCallback(async (days = 7) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'trending', value: true } });

    try {
      const response = await fetch(
        `${API_BASE}/portfolios/trending?days=${days}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to load trending portfolios');
      }

      const data = await response.json();
      dispatch({ type: ACTIONS.SET_TRENDING, payload: data });
    } catch (error) {
      console.error('Error loading trending:', error);
      // Don't set error for trending - it's optional
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'trending', value: false } });
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  // Context value
  const value = {
    // State
    followedPortfolios: state.followedPortfolios,
    followedIds: state.followedIds,
    leaderboard: state.leaderboard,
    leaderboardPeriod: state.leaderboardPeriod,
    trendingPortfolios: state.trendingPortfolios,
    loading: state.loading,
    error: state.error,
    userId: state.userId,

    // Actions
    loadFollowedPortfolios,
    followPortfolio,
    unfollowPortfolio,
    isFollowing,
    loadLeaderboard,
    setLeaderboardPeriod,
    loadTrending,
    clearError,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

// Hook to use community context
export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}

export default CommunityContext;
