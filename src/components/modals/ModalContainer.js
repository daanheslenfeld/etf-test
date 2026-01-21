import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ModalContainer Component
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizes[size] || sizes.md}
          bg-[#1A1B1F] border border-gray-700/50 rounded-2xl shadow-2xl
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
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors z-10"
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
  iconColor = '#28EBCF',
  variant = 'default', // 'default' | 'warning' | 'danger' | 'success'
  children,
  className = '',
}) {
  const variants = {
    default: 'border-gray-700/50',
    warning: 'border-amber-500/30 bg-amber-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  };

  const iconColors = {
    default: iconColor,
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    info: '#3B82F6',
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
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
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
    <div className={`p-5 border-t border-gray-700/50 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default ModalContainer;
