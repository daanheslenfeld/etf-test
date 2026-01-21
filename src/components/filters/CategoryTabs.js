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
 * CategoryTabs Component
 *
 * Visual category selection with icons and counts
 * Supports different layouts: tabs, cards, pills
 */

// Default category configuration
const DEFAULT_CATEGORIES = {
  equity: {
    icon: TrendingUp,
    label: 'Aandelen',
    color: '#28EBCF',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  bonds: {
    icon: Building,
    label: 'Obligaties',
    color: '#60A5FA',
    gradient: 'from-blue-500/20 to-indigo-500/10',
  },
  commodities: {
    icon: Gem,
    label: 'Commodities',
    color: '#FBBF24',
    gradient: 'from-amber-500/20 to-yellow-500/10',
  },
  realEstate: {
    icon: Home,
    label: 'Vastgoed',
    color: '#F472B6',
    gradient: 'from-pink-500/20 to-rose-500/10',
  },
  moneyMarket: {
    icon: Wallet,
    label: 'Money Market',
    color: '#A78BFA',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
  crypto: {
    icon: Bitcoin,
    label: 'Crypto',
    color: '#FB923C',
    gradient: 'from-orange-500/20 to-amber-500/10',
  },
  mixed: {
    icon: Layers,
    label: 'Mixed',
    color: '#94A3B8',
    gradient: 'from-slate-500/20 to-gray-500/10',
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
      container: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2',
      item: (isActive, config) => `
        group relative flex flex-col items-center p-3 rounded-xl transition-all duration-300
        ${isActive
          ? `bg-gradient-to-br ${config?.gradient || 'from-gray-500/20 to-gray-600/10'} border-2 shadow-lg`
          : 'bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600/50'
        }
      `,
      icon: 'p-2 rounded-lg mb-1.5 transition-colors',
      label: 'text-xs font-medium transition-colors',
      count: 'text-[10px] mt-0.5 transition-colors',
    },
    // Pill/tag style
    pills: {
      container: 'flex flex-wrap gap-2',
      item: (isActive, config) => `
        flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
        ${isActive
          ? 'bg-[#28EBCF] text-gray-900 font-medium shadow-lg shadow-[#28EBCF]/20'
          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300'
        }
      `,
      icon: '',
      label: 'text-sm',
      count: 'text-xs opacity-70',
    },
    // Tab style (horizontal line)
    tabs: {
      container: 'flex border-b border-gray-800/50',
      item: (isActive, config) => `
        flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200
        ${isActive
          ? 'border-[#28EBCF] text-white'
          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
        }
      `,
      icon: '',
      label: 'text-sm font-medium',
      count: 'text-xs text-gray-500',
    },
    // Compact button style
    compact: {
      container: 'flex flex-wrap gap-1.5',
      item: (isActive, config) => `
        flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-[#28EBCF] text-gray-900 font-medium shadow-lg shadow-[#28EBCF]/20'
          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/80 hover:text-gray-300'
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
              boxShadow: isActive && variant === 'cards' ? `0 4px 20px ${config.color}15` : undefined,
            }}
          >
            {/* Active indicator (cards variant) */}
            {variant === 'cards' && isActive && (
              <div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: config.color }}
              />
            )}

            {/* Icon */}
            {showIcons && (
              <div className={`${style.icon} ${
                variant === 'cards'
                  ? isActive ? 'bg-white/10' : 'bg-gray-700/30 group-hover:bg-gray-700/50'
                  : ''
              }`}>
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    variant === 'pills' || variant === 'tabs' || variant === 'compact'
                      ? ''
                      : ''
                  }`}
                  style={{
                    color: variant === 'cards'
                      ? isActive ? config.color : '#9CA3AF'
                      : undefined
                  }}
                />
              </div>
            )}

            {/* Label */}
            <span className={`${style.label} ${
              variant === 'cards'
                ? isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                : ''
            }`}>
              {config.label || label}
            </span>

            {/* Count */}
            {showCounts && (
              <span className={`${style.count} ${
                variant === 'cards'
                  ? isActive ? 'text-gray-300' : 'text-gray-600'
                  : variant === 'compact'
                    ? isActive ? 'text-gray-700' : 'text-gray-500'
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
