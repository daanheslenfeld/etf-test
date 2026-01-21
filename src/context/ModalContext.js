import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ModalContext
 *
 * Centralized modal management for the application
 * Provides a way to open/close modals from anywhere
 */

const ModalContext = createContext(null);

// Modal types
export const MODAL_TYPES = {
  CONFIRMATION: 'confirmation',
  ERROR: 'error',
  TRADE: 'trade',
  ALERT: 'alert',
  CUSTOM: 'custom',
};

/**
 * ModalProvider Component
 */
export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  // Open a modal
  const openModal = useCallback((type, props = {}) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const modal = {
      id,
      type,
      props,
      isOpen: true,
    };
    setModals(prev => [...prev, modal]);
    return id;
  }, []);

  // Close a specific modal by id
  const closeModal = useCallback((id) => {
    setModals(prev => prev.filter(m => m.id !== id));
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  // Helper: Open confirmation modal
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const id = openModal(MODAL_TYPES.CONFIRMATION, {
        ...options,
        onConfirm: () => {
          closeModal(id);
          resolve(true);
          options.onConfirm?.();
        },
        onCancel: () => {
          closeModal(id);
          resolve(false);
          options.onCancel?.();
        },
      });
    });
  }, [openModal, closeModal]);

  // Helper: Open error modal
  const showError = useCallback((error, options = {}) => {
    return openModal(MODAL_TYPES.ERROR, {
      error,
      ...options,
    });
  }, [openModal]);

  // Helper: Open alert modal
  const alert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const id = openModal(MODAL_TYPES.ALERT, {
        message,
        ...options,
        onClose: () => {
          closeModal(id);
          resolve();
          options.onClose?.();
        },
      });
    });
  }, [openModal, closeModal]);

  // Get the current active modal (top of stack)
  const activeModal = modals.length > 0 ? modals[modals.length - 1] : null;

  const value = {
    modals,
    activeModal,
    openModal,
    closeModal,
    closeAllModals,
    confirm,
    showError,
    alert,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

/**
 * useModal Hook
 */
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export default ModalContext;
