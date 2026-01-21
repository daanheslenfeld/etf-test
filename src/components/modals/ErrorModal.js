import React from 'react';
import { AlertCircle, XCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from './ModalContainer';
import { Button } from '../common';

/**
 * ErrorModal Component
 *
 * Display error messages with details and retry option
 */
export function ErrorModal({
  isOpen,
  onClose,
  onRetry,
  title = 'Er ging iets mis',
  message,
  details,
  errorCode,
  showRetry = true,
  retryLabel = 'Opnieuw proberen',
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyError = async () => {
    const errorText = [
      `Error: ${title}`,
      message && `Message: ${message}`,
      errorCode && `Code: ${errorCode}`,
      details && `Details: ${details}`,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalHeader
        title={title}
        icon={XCircle}
        variant="danger"
      />

      <ModalBody>
        {message && (
          <p className="text-gray-300 mb-4">{message}</p>
        )}

        {(details || errorCode) && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            {errorCode && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Error Code</span>
                <code className="text-xs text-red-400 font-mono">{errorCode}</code>
              </div>
            )}
            {details && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Details</span>
                <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-all bg-gray-900/50 rounded p-2 max-h-32 overflow-y-auto">
                  {details}
                </pre>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyError}
          icon={copied ? Check : Copy}
        >
          {copied ? 'Gekopieerd' : 'Kopieer'}
        </Button>
        <div className="flex-1" />
        {showRetry && onRetry && (
          <Button
            variant="secondary"
            onClick={onRetry}
            icon={RefreshCw}
          >
            {retryLabel}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onClose}
        >
          Sluiten
        </Button>
      </ModalFooter>
    </ModalContainer>
  );
}

/**
 * ConnectionErrorModal - Preset for connection errors
 */
export function ConnectionErrorModal({
  isOpen,
  onClose,
  onRetry,
  service = 'de service',
}) {
  return (
    <ErrorModal
      isOpen={isOpen}
      onClose={onClose}
      onRetry={onRetry}
      title="Verbindingsfout"
      message={`Kan geen verbinding maken met ${service}. Controleer je internetverbinding en probeer het opnieuw.`}
      showRetry={true}
      retryLabel="Opnieuw verbinden"
    />
  );
}

/**
 * TradeErrorModal - Preset for trading errors
 */
export function TradeErrorModal({
  isOpen,
  onClose,
  onRetry,
  error,
}) {
  return (
    <ErrorModal
      isOpen={isOpen}
      onClose={onClose}
      onRetry={onRetry}
      title="Order Uitvoering Mislukt"
      message={error?.message || 'De order kon niet worden uitgevoerd.'}
      details={error?.details}
      errorCode={error?.code}
      showRetry={true}
      retryLabel="Opnieuw proberen"
    />
  );
}

export default ErrorModal;
