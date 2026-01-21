import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from './ModalContainer';
import { Button } from '../common';

/**
 * ConfirmationModal Component
 *
 * Generic confirmation dialog for actions that need user approval
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Bevestigen',
  message,
  description,
  confirmLabel = 'Bevestigen',
  cancelLabel = 'Annuleren',
  variant = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  loading = false,
  showCancel = true,
  children,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const icons = {
    warning: AlertTriangle,
    danger: XCircle,
    info: HelpCircle,
    success: CheckCircle,
  };

  const buttonVariants = {
    warning: 'primary',
    danger: 'danger',
    info: 'primary',
    success: 'success',
  };

  const Icon = icons[variant] || AlertTriangle;

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsSubmitting(true);
      try {
        await onConfirm();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <ModalHeader
        title={title}
        subtitle={description}
        icon={Icon}
        variant={variant}
      />

      <ModalBody>
        {message && (
          <p className="text-gray-300">{message}</p>
        )}
        {children}
      </ModalBody>

      <ModalFooter>
        {showCancel && (
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          variant={buttonVariants[variant]}
          onClick={handleConfirm}
          disabled={isLoading}
          loading={isLoading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContainer>
  );
}

/**
 * DeleteConfirmationModal - Preset for delete actions
 */
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  ...props
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} verwijderen`}
      message={`Weet je zeker dat je "${itemName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
      confirmLabel="Verwijderen"
      variant="danger"
      {...props}
    />
  );
}

export default ConfirmationModal;
