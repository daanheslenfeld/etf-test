import React from 'react';
import {
  TrendingUp,
  Building,
  Gem,
  Home,
  Wallet,
  Bitcoin,
  Layers,
} from 'lucide-react';

/**
 * CategoryTabs Component - Pastel Design System
 *
 * Visual category selection with icons and counts
 * Supports different layouts: tabs, cards, pills
 */

// Pastel category configuration with soft muted colors
const DEFAULT_CATEGORIES = {
  equity: {
    icon: TrendingUp,
    label: 'Aandelen',
    color: '#8AB4A0',
    gradient: 'from-[#8AB4A0]/20 to-[#8AB4A0]/5',
  },
  bonds: {
    icon: Building,
    label: 'Obligaties',
    color: '#A8B8D0',
    gradient: 'from-[#A8B8D0]/20 to-[#A8B8D0]/5',
  },
  commodities: {
    icon: Gem,
    label: 'Commodities',
    color: '#D4C39A',
    gradient: 'from-[#D4C39A]/20 to-[#D4C39A]/5',
  },
  realEstate: {
    icon: Home,
    label: 'Vastgoed',
    color: '#B8A8C8',
    gradient: 'from-[#B8A8C8]/20 to-[#B8A8C8]/5',
  },
  moneyMarket: {
    icon: Wallet,
    label: 'Money Market',
    color: '#A8B8D0',
    gradient: 'from-[#A8B8D0]/20 to-[#A8B8D0]/5',
  },
  crypto: {
    icon: Bitcoin,
    label: 'Crypto',
    color: '#D4C39A',
    gradient: 'from-[#D4C39A]/20 to-[#D4C39A]/5',
  },
  mixed: {
    icon: Layers,
    label: 'Mixed',
    color: '#95A39A',
    gradient: 'from-[#95A39A]/20 to-[#95A39A]/5',
  },
};

export function CategoryTabs({
  categories = [],
  active,
  onChange,
  counts = {},
  variant = 'cards',
  showCounts = true,
  showIcons = true,
  categoryConfig = DEFAULT_CATEGORIES,
  className = '',
}) {
  const variants = {
    // Card style (default)
    cards: {
      container: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3',
      item: (isActive, config) => `
        group relative flex flex-col items-center p-3.5 rounded-2xl transition-all duration-300
        ${isActive
          ? `bg-gradient-to-br ${config?.gradient || 'from-[#F0F2EE] to-[#FAFBF9]'} border-2 shadow-[0_2px_8px_rgba(45,62,54,0.08)]`
          : 'bg-white border border-[#E4E8E5] hover:bg-[#FAFBF9] hover:border-[#C8D0CA] hover:shadow-[0_2px_8px_rgba(45,62,54,0.05)]'
        }
      `,
      icon: 'p-2 rounded-xl mb-1.5 transition-colors',
      label: 'text-xs font-medium transition-colors',
      count: 'text-[10px] mt-0.5 transition-colors',
    },
    // Pill/tag style
    pills: {
      container: 'flex flex-wrap gap-2',
      item: (isActive, config) => `
        flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200
        ${isActive
          ? 'bg-[#8AB4A0] text-white font-medium shadow-[0_2px_8px_rgba(138,180,160,0.25)]'
          : 'bg-white border border-[#E4E8E5] text-[#5F7066] hover:bg-[#FAFBF9] hover:text-[#2D3E36] hover:border-[#C8D0CA]'
        }
      `,
      icon: '',
      label: 'text-sm',
      count: 'text-xs opacity-70',
    },
    // Tab style (horizontal line)
    tabs: {
      container: 'flex border-b border-[#E4E8E5]',
      item: (isActive, config) => `
        flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200
        ${isActive
          ? 'border-[#8AB4A0] text-[#2D3E36]'
          : 'border-transparent text-[#5F7066] hover:text-[#2D3E36] hover:border-[#C8D0CA]'
        }
      `,
      icon: '',
      label: 'text-sm font-medium',
      count: 'text-xs text-[#95A39A]',
    },
    // Compact button style
    compact: {
      container: 'flex flex-wrap gap-2',
      item: (isActive, config) => `
        flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl transition-all duration-200
        ${isActive
          ? 'bg-[#8AB4A0] text-white font-medium shadow-[0_2px_8px_rgba(138,180,160,0.25)]'
          : 'bg-white border border-[#E4E8E5] text-[#5F7066] hover:bg-[#FAFBF9] hover:text-[#2D3E36]'
        }
      `,
      icon: '',
      label: '',
      count: 'text-xs',
    },
  };

  const style = variants[variant] || variants.cards;

  return (
    <div className={`${style.container} ${className}`}>
      {categories.map((category) => {
        const value = typeof category === 'string' ? category : category.value;
        const label = typeof category === 'string' ? category : category.label;
        const config = categoryConfig[value] || {};
        const Icon = config.icon || TrendingUp;
        const isActive = active === value;
        const count = counts[value] || 0;

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={style.item(isActive, config)}
            style={{
              borderColor: isActive && variant === 'cards' ? `${config.color}40` : undefined,
            }}
          >
            {/* Active indicator (cards variant) */}
            {variant === 'cards' && isActive && (
              <div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
            )}

            {/* Icon */}
            {showIcons && (
              <div className={`${style.icon} ${
                variant === 'cards'
                  ? isActive ? 'bg-white/60' : 'bg-[#F0F2EE] group-hover:bg-[#E4E8E5]'
                  : ''
              }`}>
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{
                    color: variant === 'cards'
                      ? isActive ? config.color : '#5F7066'
                      : undefined
                  }}
                />
              </div>
            )}

            {/* Label */}
            <span className={`${style.label} ${
              variant === 'cards'
                ? isActive ? 'text-[#2D3E36]' : 'text-[#5F7066] group-hover:text-[#2D3E36]'
                : ''
            }`}>
              {config.label || label}
            </span>

            {/* Count */}
            {showCounts && (
              <span className={`${style.count} ${
                variant === 'cards'
                  ? isActive ? 'text-[#5F7066]' : 'text-[#95A39A]'
                  : variant === 'compact'
                    ? isActive ? 'text-white/80' : 'text-[#95A39A]'
                    : ''
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryTabs;
