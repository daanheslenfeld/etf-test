import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FilterSection Component
 *
 * Collapsible group of related filters
 * Used to organize filters into logical sections
 */
export function FilterSection({
  title,
  subtitle,
  children,
  collapsible = true,
  defaultExpanded = true,
  badge,
  icon: Icon,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Section Header */}
      {title && (
        <div
          onClick={toggleExpanded}
          className={`
            flex items-center justify-between mb-3
            ${collapsible ? 'cursor-pointer group' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className="w-4 h-4 text-gray-500" />
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                {title}
              </h4>
              {subtitle && (
                <p className="text-xs text-gray-600">{subtitle}</p>
              )}
            </div>
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#28EBCF]/10 text-[#28EBCF] rounded">
                {badge}
              </span>
            )}
          </div>
          {collapsible && (
            <ChevronDown
              className={`
                w-4 h-4 text-gray-500 transition-transform duration-200
                group-hover:text-gray-400
                ${isExpanded ? 'rotate-180' : ''}
              `}
            />
          )}
        </div>
      )}

      {/* Section Content */}
      <div
        className={`
          transition-all duration-300 ease-out overflow-hidden
          ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * FilterGrid - Grid layout for filter controls
 */
export function FilterGrid({
  children,
  cols = 4,
  gap = 3,
  className = '',
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
  };

  return (
    <div className={`grid ${colClasses[cols] || colClasses[4]} ${gapClasses[gap] || gapClasses[3]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * FilterDivider - Visual separator between filter sections
 */
export function FilterDivider({ className = '' }) {
  return (
    <div className={`border-t border-gray-800/30 my-4 ${className}`} />
  );
}

export default FilterSection;
