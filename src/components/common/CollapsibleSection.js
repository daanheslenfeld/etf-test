import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * CollapsibleSection - Animated expandable section with header
 *
 * Features:
 * - Smooth height animation
 * - Chevron rotation indicator
 * - Optional badge for counts
 * - Subtle styling for fintech look
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  badge,
  badgeColor = 'bg-gray-700 text-gray-300',
  icon: Icon,
  children,
  className = '',
  onToggle,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setContentHeight(contentRef.current.scrollHeight);
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setContentHeight('auto'), 300);
        return () => clearTimeout(timer);
      } else {
        // First set to actual height, then animate to 0
        setContentHeight(contentRef.current.scrollHeight);
        requestAnimationFrame(() => {
          setContentHeight(0);
        });
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggle?.(!isOpen);
  };

  return (
    <div className={`border border-gray-700/30 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">
            {title}
          </span>
          {badge !== undefined && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content with animation */}
      <div
        ref={contentRef}
        style={{
          height: typeof contentHeight === 'number' ? `${contentHeight}px` : contentHeight,
          overflow: 'hidden',
          transition: 'height 0.3s ease-in-out',
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * FilterSectionHeader - Simpler inline header for filter groups
 */
export function FilterSectionHeader({
  title,
  badge,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {title}
      </span>
      {badge !== undefined && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#28EBCF]/10 text-[#28EBCF]">
          {badge}
        </span>
      )}
    </div>
  );
}

/**
 * CollapsibleFilterSection - Lighter version for filter panels
 */
export function CollapsibleFilterSection({
  title,
  defaultOpen = true,
  activeCount = 0,
  children,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      {/* Minimal header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#28EBCF]/20 text-[#28EBCF]">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isOpen ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default CollapsibleSection;
