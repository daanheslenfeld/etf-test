// Verwijderbare actieve filter chips component
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
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${chip.bg} ${chip.text} border ${chip.border} text-xs rounded-full font-medium transition-all duration-150 hover:opacity-80`}
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.filterId)}
            className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
            aria-label={`Verwijder ${chip.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {chips.length > 0 && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all duration-150"
        >
          <RotateCcw className="w-3 h-3" />
          Wis filters
        </button>
      )}
    </div>
  );
}
