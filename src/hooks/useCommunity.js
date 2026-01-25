/**
 * useCommunity Hook
 *
 * Custom hook for community features.
 * Provides convenient access to CommunityContext with additional utilities.
 */

import { useCallback, useEffect } from 'react';
import { useCommunity as useCommunityContext } from '../context/CommunityContext';

// API base URL
const API_BASE = 'http://localhost:8002';

/**
 * Hook for community portfolio features
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoLoadFollows - Auto-load follows on mount
 * @param {boolean} options.autoLoadLeaderboard - Auto-load leaderboard on mount
 * @param {boolean} options.autoLoadTrending - Auto-load trending on mount
 */
export function useCommunityFeatures(options = {}) {
  const {
    autoLoadFollows = false,
    autoLoadLeaderboard = false,
    autoLoadTrending = false,
  } = options;

  const context = useCommunityContext();

  // Auto-load data on mount if options are set
  useEffect(() => {
    if (autoLoadFollows && context.userId) {
      context.loadFollowedPortfolios();
    }
  }, [autoLoadFollows, context.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoLoadLeaderboard) {
      context.loadLeaderboard(context.leaderboardPeriod);
    }
  }, [autoLoadLeaderboard]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoLoadTrending) {
      context.loadTrending();
    }
  }, [autoLoadTrending]); // eslint-disable-line react-hooks/exhaustive-deps

  return context;
}

/**
 * Hook specifically for follow functionality
 */
export function useFollowPortfolio() {
  const {
    followPortfolio,
    unfollowPortfolio,
    isFollowing,
    loading,
    error,
  } = useCommunityContext();

  const toggleFollow = useCallback(async (portfolioId, portfolio = null) => {
    if (isFollowing(portfolioId)) {
      return unfollowPortfolio(portfolioId);
    } else {
      return followPortfolio(portfolioId, portfolio);
    }
  }, [isFollowing, followPortfolio, unfollowPortfolio]);

  return {
    followPortfolio,
    unfollowPortfolio,
    toggleFollow,
    isFollowing,
    isLoading: loading.followAction,
    error,
  };
}

/**
 * Hook for leaderboard functionality
 */
export function useLeaderboard() {
  const {
    leaderboard,
    leaderboardPeriod,
    loading,
    loadLeaderboard,
    setLeaderboardPeriod,
  } = useCommunityContext();

  const currentLeaderboard = leaderboard[leaderboardPeriod] || [];

  return {
    entries: currentLeaderboard,
    period: leaderboardPeriod,
    isLoading: loading.leaderboard,
    loadLeaderboard,
    setLeaderboardPeriod,
    allLeaderboards: leaderboard,
  };
}

/**
 * Hook for trending portfolios
 */
export function useTrending() {
  const {
    trendingPortfolios,
    loading,
    loadTrending,
  } = useCommunityContext();

  return {
    portfolios: trendingPortfolios,
    isLoading: loading.trending,
    loadTrending,
  };
}

/**
 * Hook for followed portfolios
 */
export function useFollowedPortfolios() {
  const {
    followedPortfolios,
    followedIds,
    loading,
    loadFollowedPortfolios,
    isFollowing,
  } = useCommunityContext();

  return {
    portfolios: followedPortfolios,
    followedIds,
    isLoading: loading.follows,
    loadFollowedPortfolios,
    isFollowing,
    count: followedPortfolios.length,
  };
}

/**
 * Utility function to fetch public portfolios directly
 * (doesn't require context)
 */
export async function fetchPublicPortfolios(options = {}) {
  const {
    search = '',
    sortBy = 'performance',
    limit = 50,
    offset = 0,
  } = options;

  try {
    const params = new URLSearchParams({
      visibility: 'public',
      sort_by: sortBy,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE}/portfolios/?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch portfolios');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching public portfolios:', error);
    throw error;
  }
}

/**
 * Utility function to fetch a single portfolio
 */
export async function fetchPortfolio(portfolioId) {
  try {
    const response = await fetch(`${API_BASE}/portfolios/${portfolioId}`);

    if (!response.ok) {
      throw new Error('Portfolio not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
}

/**
 * Utility function to fetch portfolio snapshots
 */
export async function fetchPortfolioSnapshots(portfolioId, type = null, limit = 12) {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) {
      params.append('snapshot_type', type);
    }

    const response = await fetch(
      `${API_BASE}/portfolios/${portfolioId}/snapshots?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch snapshots');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    throw error;
  }
}

export default useCommunityFeatures;
