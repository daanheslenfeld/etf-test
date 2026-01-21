import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * ActiveFilterChips Component
 *
 * Displays active filters as removable chips
 * Color-coded by filter type
 */

// Default color scheme for filter types
const DEFAULT_COLORS = {
  region: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  sector: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  marketCap: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  strategy: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  currency: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  bondType: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  duration: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  creditRating: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  commodityType: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  replication: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  propertyType: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  cryptoType: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  riskLevel: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  allocation: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  providers: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
  search: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
  default: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
};

export function ActiveFilterChips({
  chips = [],
  onRemove,
  onClearAll,
  showLabel = true,
  showClearAll = true,
  size = 'md',
  colorMap = DEFAULT_COLORS,
  className = '',
}) {
  if (chips.length === 0) return null;

  const sizes = {
    sm: {
      chip: 'px-2 py-1 text-[10px]',
      icon: 'w-2.5 h-2.5',
      clearAll: 'text-[10px]',
    },
    md: {
      chip: 'px-3 py-1.5 text-xs',
      icon: 'w-3 h-3',
      clearAll: 'text-xs',
    },
    lg: {
      chip: 'px-3.5 py-2 text-sm',
      icon: 'w-3.5 h-3.5',
      clearAll: 'text-sm',
    },
  };

  const sizeConfig = sizes[size] || sizes.md;

  const getChipColors = (chip) => {
    // Use chip's own colors if provided
    if (chip.bg && chip.text) {
      return {
        bg: chip.bg,
        text: chip.text,
        border: chip.border || 'border-gray-700/50',
      };
    }
    // Fall back to color map
    return colorMap[chip.filterId] || colorMap.default;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips.map((chip) => {
        const colors = getChipColors(chip);
        const key = chip.id || `${chip.filterId}-${chip.value}`;

        return (
          <span
            key={key}
            className={`
              inline-flex items-center gap-2 ${sizeConfig.chip}
              rounded-lg font-medium border transition-all
              hover:scale-105 hover:shadow-sm
              ${colors.bg} ${colors.text} ${colors.border}
            `}
          >
            {showLabel && chip.filterLabel && (
              <span className="text-gray-400 font-normal">
                {chip.filterLabel}:
              </span>
            )}
            <span>{chip.label || chip.valueLabel || chip.value}</span>
            {onRemove && (
              <button
                onClick={() => onRemove(chip.filterId, chip.value)}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
              >
                <X className={sizeConfig.icon} />
              </button>
            )}
          </span>
        );
      })}

      {showClearAll && onClearAll && chips.length > 1 && (
        <button
          onClick={onClearAll}
          className={`
            inline-flex items-center gap-1.5 ${sizeConfig.clearAll}
            text-gray-500 hover:text-[#28EBCF] transition-colors font-medium ml-1
          `}
        >
          <RotateCcw className={sizeConfig.icon} />
          Wis alles
        </button>
      )}
    </div>
  );
}

/**
 * FilterChip - Single filter chip component
 */
export function FilterChip({
  label,
  filterLabel,
  onRemove,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const colors = DEFAULT_COLORS[variant] || DEFAULT_COLORS.default;

  const sizes = {
    sm: { chip: 'px-2 py-1 text-[10px]', icon: 'w-2.5 h-2.5' },
    md: { chip: 'px-3 py-1.5 text-xs', icon: 'w-3 h-3' },
    lg: { chip: 'px-3.5 py-2 text-sm', icon: 'w-3.5 h-3.5' },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <span
      className={`
        inline-flex items-center gap-2 ${sizeConfig.chip}
        rounded-lg font-medium border transition-all
        hover:scale-105
        ${colors.bg} ${colors.text} ${colors.border}
        ${className}
      `}
    >
      {filterLabel && (
        <span className="text-gray-400 font-normal">{filterLabel}:</span>
      )}
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-white/10 rounded transition-colors"
        >
          <X className={sizeConfig.icon} />
        </button>
      )}
    </span>
  );
}

export default ActiveFilterChips;
