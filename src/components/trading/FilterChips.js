// Verwijderbare actieve filter chips component - Pastel Design System
import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * FilterChips - Toont actieve filters als verwijderbare chips
 */
export default function FilterChips({ chips, onRemove, onReset, hasFilters }) {
  if (!hasFilters || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${chip.bg || 'bg-[#E6F0EB]'} ${chip.text || 'text-[#5F8A74]'} border ${chip.border || 'border-[#8AB4A0]/30'} text-xs rounded-full font-medium transition-all duration-200 hover:shadow-[0_2px_8px_rgba(138,180,160,0.15)]`}
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.filterId)}
            className="hover:bg-[#2D3E36]/10 rounded-full p-0.5 transition-colors"
            aria-label={`Verwijder ${chip.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {chips.length > 0 && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#5F7066] hover:text-[#2D3E36] bg-[#F0F2EE] hover:bg-[#E4E8E5] rounded-full transition-all duration-200"
        >
          <RotateCcw className="w-3 h-3" />
          Wis filters
        </button>
      )}
    </div>
  );
}
