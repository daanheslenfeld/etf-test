// Hooks - Barrel Export

// Media query hooks for responsive design
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmallMobile,
  useIsTouchDevice,
  usePrefersReducedMotion,
} from './useMediaQuery';

// ETF filter hooks
export { useETFFilters } from './useETFFilters';

// Community hooks (follow, leaderboard, trending)
export {
  default as useCommunityFeatures,
  useFollowPortfolio,
  useLeaderboard,
  useTrending,
  useFollowedPortfolios,
  fetchPublicPortfolios,
  fetchPortfolio,
  fetchPortfolioSnapshots,
} from './useCommunity';
