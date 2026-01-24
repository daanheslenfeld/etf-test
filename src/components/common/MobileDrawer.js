import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * MobileDrawer Component - Premium Banking Style
 *
 * Reusable slide-in drawer for mobile interfaces
 */
export function MobileDrawer({
  isOpen,
  onClose,
  title,
  position = 'right', // 'left' | 'right'
  children,
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}) {
  // Close on Escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Position-based classes
  const positionClasses = {
    left: {
      position: 'left-0',
      translate: isOpen ? 'translate-x-0' : '-translate-x-full',
      border: 'border-r',
    },
    right: {
      position: 'right-0',
      translate: isOpen ? 'translate-x-0' : 'translate-x-full',
      border: 'border-l',
    },
  };

  const pos = positionClasses[position];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#2D3436]/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 ${pos.position} h-full w-80 max-w-[85vw]
          bg-[#FEFEFE] ${pos.border} border-[#E8E8E6] z-50 shadow-[4px_0_12px_rgba(45,52,54,0.06)]
          transform transition-transform duration-300 ease-out
          lg:hidden
          ${pos.translate}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-[#E8E8E6] flex-shrink-0">
            {title && (
              <h2 className="text-[#2D3436] font-semibold text-lg">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2.5 min-w-[44px] min-h-[44px]
                  flex items-center justify-center
                  text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4]
                  rounded-lg transition-colors
                  active:bg-[#ECEEED]
                  ${!title ? 'ml-auto' : ''}
                `}
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-4 border-t border-[#E8E8E6] flex-shrink-0 bg-[#FEFEFE]">
              {footer}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * DrawerHeader - Optional custom header content
 */
export function DrawerHeader({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-b border-[#E8E8E6] ${className}`}>
      {children}
    </div>
  );
}

/**
 * DrawerBody - Scrollable content area with padding
 */
export function DrawerBody({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * DrawerSection - Grouped content with optional title
 */
export function DrawerSection({ title, children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {title && (
        <h3 className="text-xs text-[#636E72] uppercase tracking-wider mb-2 px-1">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export default MobileDrawer;
