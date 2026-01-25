/**
 * FollowButton Component
 *
 * Reusable follow/unfollow button for portfolios.
 * Handles follow state and loading states.
 */

import React, { useCallback } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowPortfolio } from '../../hooks/useCommunity';

export default function FollowButton({
  portfolioId,
  portfolio = null,
  size = 'default', // 'small', 'default', 'large'
  variant = 'default', // 'default', 'outline', 'ghost'
  showLabel = true,
  onFollowChange = null,
  className = '',
}) {
  const { toggleFollow, isFollowing, isLoading } = useFollowPortfolio();

  const following = isFollowing(portfolioId);

  const handleClick = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const result = await toggleFollow(portfolioId, portfolio);

    if (result && onFollowChange) {
      onFollowChange(!following, result);
    }
  }, [toggleFollow, portfolioId, portfolio, following, onFollowChange]);

  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs gap-1',
    default: 'px-3 py-1.5 text-sm gap-1.5',
    large: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  // Variant classes - Premium banking palette
  const getVariantClasses = () => {
    if (following) {
      switch (variant) {
        case 'outline':
          return 'border border-[#E8E8E6] text-[#636E72] hover:border-[#C0736D] hover:text-[#C0736D] hover:bg-[#C0736D]/10';
        case 'ghost':
          return 'text-[#636E72] hover:text-[#C0736D] hover:bg-[#C0736D]/10';
        default:
          return 'bg-[#ECEEED] text-[#636E72] hover:bg-[#C0736D]/10 hover:text-[#C0736D]';
      }
    } else {
      switch (variant) {
        case 'outline':
          return 'border border-[#7C9885] text-[#7C9885] hover:bg-[#7C9885] hover:text-white';
        case 'ghost':
          return 'text-[#7C9885] hover:bg-[#7C9885]/10';
        default:
          return 'bg-[#7C9885] text-white hover:bg-[#6B8A74]';
      }
    }
  };

  const Icon = following ? UserMinus : UserPlus;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
      title={following ? 'Ontvolgen' : 'Volgen'}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Icon className={iconSizes[size]} />
      )}
      {showLabel && (
        <span>{following ? 'Volgend' : 'Volgen'}</span>
      )}
    </button>
  );
}

/**
 * Compact follow button (icon only)
 */
export function FollowButtonCompact({ portfolioId, portfolio, onFollowChange }) {
  return (
    <FollowButton
      portfolioId={portfolioId}
      portfolio={portfolio}
      size="small"
      variant="ghost"
      showLabel={false}
      onFollowChange={onFollowChange}
    />
  );
}
