import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ModalContainer Component - Premium Banking Style
 *
 * Base modal wrapper with backdrop, animations, and accessibility
 */
export function ModalContainer({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#2D3436]/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizes[size] || sizes.md}
          bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl shadow-[0_8px_32px_rgba(45,52,54,0.12)]
          transform transition-all duration-200
          animate-modal-enter
          ${className}
        `}
        role="dialog"
        aria-modal="true"
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#636E72] hover:text-[#2D3436] hover:bg-[#F5F6F4] rounded-lg transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * ModalHeader - Header section with title and optional subtitle
 */
export function ModalHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = '#7C9885',
  variant = 'default', // 'default' | 'warning' | 'danger' | 'success'
  children,
  className = '',
}) {
  const variants = {
    default: 'border-[#E8E8E6]',
    warning: 'border-[#C9A962]/30 bg-[#C9A962]/5',
    danger: 'border-[#C0736D]/30 bg-[#C0736D]/5',
    success: 'border-[#7C9885]/30 bg-[#7C9885]/5',
    info: 'border-[#6B7B8A]/30 bg-[#6B7B8A]/5',
  };

  const iconColors = {
    default: iconColor,
    warning: '#C9A962',
    danger: '#C0736D',
    success: '#7C9885',
    info: '#6B7B8A',
  };

  return (
    <div className={`p-5 border-b ${variants[variant]} ${className}`}>
      <div className="flex items-start gap-4 pr-8">
        {Icon && (
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${iconColors[variant]}15` }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColors[variant] }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h2 className="text-lg font-semibold text-[#2D3436]">{title}</h2>
          )}
          {subtitle && (
            <p className="text-sm text-[#636E72] mt-0.5">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * ModalBody - Content section
 */
export function ModalBody({ children, className = '' }) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ModalFooter - Actions section
 */
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`p-5 border-t border-[#E8E8E6] flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default ModalContainer;
