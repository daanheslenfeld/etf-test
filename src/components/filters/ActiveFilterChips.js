import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * ActiveFilterChips Component - Premium Banking Style
 *
 * Displays active filters as removable chips
 * Muted color scheme for professional look
 */

// Premium banking color scheme for filter types
const DEFAULT_COLORS = {
  region: { bg: 'bg-[#6B7B8A]/10', text: 'text-[#6B7B8A]', border: 'border-[#6B7B8A]/20' },
  sector: { bg: 'bg-[#7C9885]/10', text: 'text-[#7C9885]', border: 'border-[#7C9885]/20' },
  marketCap: { bg: 'bg-[#8B7B9A]/10', text: 'text-[#8B7B9A]', border: 'border-[#8B7B9A]/20' },
  strategy: { bg: 'bg-[#7C9885]/10', text: 'text-[#7C9885]', border: 'border-[#7C9885]/20' },
  currency: { bg: 'bg-[#C9A962]/10', text: 'text-[#C9A962]', border: 'border-[#C9A962]/20' },
  bondType: { bg: 'bg-[#C9A962]/10', text: 'text-[#C9A962]', border: 'border-[#C9A962]/20' },
  duration: { bg: 'bg-[#C9A962]/10', text: 'text-[#C9A962]', border: 'border-[#C9A962]/20' },
  creditRating: { bg: 'bg-[#C0736D]/10', text: 'text-[#C0736D]', border: 'border-[#C0736D]/20' },
  commodityType: { bg: 'bg-[#C9A962]/10', text: 'text-[#C9A962]', border: 'border-[#C9A962]/20' },
  replication: { bg: 'bg-[#8B7B9A]/10', text: 'text-[#8B7B9A]', border: 'border-[#8B7B9A]/20' },
  propertyType: { bg: 'bg-[#6B7B8A]/10', text: 'text-[#6B7B8A]', border: 'border-[#6B7B8A]/20' },
  cryptoType: { bg: 'bg-[#8B7B9A]/10', text: 'text-[#8B7B9A]', border: 'border-[#8B7B9A]/20' },
  riskLevel: { bg: 'bg-[#C0736D]/10', text: 'text-[#C0736D]', border: 'border-[#C0736D]/20' },
  allocation: { bg: 'bg-[#6B7B8A]/10', text: 'text-[#6B7B8A]', border: 'border-[#6B7B8A]/20' },
  providers: { bg: 'bg-[#ECEEED]', text: 'text-[#636E72]', border: 'border-[#E8E8E6]' },
  search: { bg: 'bg-[#ECEEED]', text: 'text-[#636E72]', border: 'border-[#E8E8E6]' },
  default: { bg: 'bg-[#ECEEED]', text: 'text-[#636E72]', border: 'border-[#E8E8E6]' },
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
        border: chip.border || 'border-[#E8E8E6]',
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
              hover:shadow-sm
              ${colors.bg} ${colors.text} ${colors.border}
            `}
          >
            {showLabel && chip.filterLabel && (
              <span className="text-[#B2BEC3] font-normal">
                {chip.filterLabel}:
              </span>
            )}
            <span>{chip.label || chip.valueLabel || chip.value}</span>
            {onRemove && (
              <button
                onClick={() => onRemove(chip.filterId, chip.value)}
                className="p-0.5 hover:bg-[#2D3436]/10 rounded transition-colors"
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
            text-[#636E72] hover:text-[#7C9885] transition-colors font-medium ml-1
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
        ${colors.bg} ${colors.text} ${colors.border}
        ${className}
      `}
    >
      {filterLabel && (
        <span className="text-[#B2BEC3] font-normal">{filterLabel}:</span>
      )}
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-[#2D3436]/10 rounded transition-colors"
        >
          <X className={sizeConfig.icon} />
        </button>
      )}
    </span>
  );
}

export default ActiveFilterChips;
