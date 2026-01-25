/**
 * BadgeDisplay Component
 *
 * Displays badges earned by a portfolio.
 * Supports competition winner badges (gold, silver, bronze)
 * and other achievement badges.
 */

import React, { useState } from 'react';
import {
  Crown,
  Medal,
  Award,
  Star,
  TrendingUp,
  Users,
  Sparkles,
} from 'lucide-react';

// Badge type configurations
const BADGE_CONFIGS = {
  competition_winner_gold: {
    icon: Crown,
    color: 'text-[#C9A962]',
    bg: 'bg-[#C9A962]/10',
    border: 'border-[#C9A962]/30',
    label: '1e Plaats',
    emoji: '🥇',
  },
  competition_winner_silver: {
    icon: Medal,
    color: 'text-[#6B7B8A]',
    bg: 'bg-[#6B7B8A]/10',
    border: 'border-[#6B7B8A]/30',
    label: '2e Plaats',
    emoji: '🥈',
  },
  competition_winner_bronze: {
    icon: Award,
    color: 'text-[#B8956B]',
    bg: 'bg-[#B8956B]/10',
    border: 'border-[#B8956B]/30',
    label: '3e Plaats',
    emoji: '🥉',
  },
  top_performer: {
    icon: TrendingUp,
    color: 'text-[#7C9885]',
    bg: 'bg-[#7C9885]/10',
    border: 'border-[#7C9885]/30',
    label: 'Top Performer',
    emoji: '📈',
  },
  trending: {
    icon: Sparkles,
    color: 'text-[#8B7B9A]',
    bg: 'bg-[#8B7B9A]/10',
    border: 'border-[#8B7B9A]/30',
    label: 'Trending',
    emoji: '🔥',
  },
  popular: {
    icon: Users,
    color: 'text-[#C0736D]',
    bg: 'bg-[#C0736D]/10',
    border: 'border-[#C0736D]/30',
    label: 'Populair',
    emoji: '❤️',
  },
};

function formatBadgeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
}

function BadgeTooltip({ badge, config }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#2D3436] text-white rounded-xl shadow-lg whitespace-nowrap z-50 min-w-[160px]">
      <div className="flex items-center gap-2 mb-1">
        <span>{config.emoji}</span>
        <span className="font-semibold">{config.label}</span>
      </div>
      {badge.competition_name && (
        <p className="text-xs text-white/70">{badge.competition_name}</p>
      )}
      {badge.awarded_at && (
        <p className="text-xs text-white/50 mt-1">
          {formatBadgeDate(badge.awarded_at)}
        </p>
      )}
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#2D3436]" />
    </div>
  );
}

function SingleBadge({ badge, size = 'medium', showTooltip = true }) {
  const [isHovered, setIsHovered] = useState(false);

  const config = BADGE_CONFIGS[badge.type] || BADGE_CONFIGS.top_performer;
  const Icon = config.icon;

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          ${config.bg} border ${config.border}
          transition-transform hover:scale-110 cursor-pointer
        `}
      >
        <Icon className={`${iconSizes[size]} ${config.color}`} />
      </div>
      {showTooltip && isHovered && (
        <BadgeTooltip badge={badge} config={config} />
      )}
    </div>
  );
}

/**
 * BadgeDisplay - Shows a list of badges
 */
export default function BadgeDisplay({
  badges = [],
  maxDisplay = 3,
  size = 'medium',
  showTooltips = true,
}) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const displayedBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      {displayedBadges.map((badge, index) => (
        <SingleBadge
          key={badge.id || index}
          badge={badge}
          size={size}
          showTooltip={showTooltips}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${size === 'small' ? 'w-6 h-6 text-xs' : size === 'large' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'}
            rounded-full bg-[#ECEEED] border border-[#E8E8E6] flex items-center justify-center
            text-[#636E72] font-medium
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

/**
 * BadgeList - Shows all badges in a full list format
 */
export function BadgeList({ badges = [] }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="w-10 h-10 text-[#B2BEC3] mx-auto mb-3" />
        <p className="text-[#636E72]">Nog geen badges behaald</p>
        <p className="text-xs text-[#B2BEC3] mt-1">
          Neem deel aan competities om badges te verdienen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {badges.map((badge, index) => {
        const config = BADGE_CONFIGS[badge.type] || BADGE_CONFIGS.top_performer;
        const Icon = config.icon;

        return (
          <div
            key={badge.id || index}
            className={`flex items-center gap-3 p-3 rounded-xl ${config.bg} border ${config.border}`}
          >
            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${config.color}`}>
                  {config.label}
                </span>
                <span>{config.emoji}</span>
              </div>
              {badge.competition_name && (
                <p className="text-sm text-[#636E72]">{badge.competition_name}</p>
              )}
            </div>
            {badge.awarded_at && (
              <div className="text-xs text-[#B2BEC3]">
                {formatBadgeDate(badge.awarded_at)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * CompactBadgeRow - Single line badge display with emoji
 */
export function CompactBadgeRow({ badges = [] }) {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5">
      {badges.slice(0, 3).map((badge, index) => {
        const config = BADGE_CONFIGS[badge.type] || BADGE_CONFIGS.top_performer;
        return (
          <span key={badge.id || index} title={config.label}>
            {config.emoji}
          </span>
        );
      })}
      {badges.length > 3 && (
        <span className="text-xs text-[#B2BEC3] ml-1">+{badges.length - 3}</span>
      )}
    </div>
  );
}
