import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children, level = 'page' } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error, errorInfo, reset: this.handleReset })
          : fallback;
      }

      // Default fallback based on level
      if (level === 'component') {
        return (
          <ComponentErrorFallback
            error={error}
            onRetry={this.handleReset}
          />
        );
      }

      return (
        <PageErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return children;
  }
}

/**
 * PageErrorFallback - Full page error display
 */
function PageErrorFallback({ error, errorInfo, onRetry, onReload, onGoHome }) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0D0E12] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Er ging iets mis
          </h1>
          <p className="text-gray-400">
            Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen
            of ga terug naar de startpagina.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#28EBCF] text-gray-900 font-medium rounded-lg hover:bg-[#20D4BA] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Opnieuw proberen
          </button>
          <button
            onClick={onReload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Pagina herladen
          </button>
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Naar start
          </button>
        </div>

        {/* Error Details (collapsible) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <Bug className="w-4 h-4" />
                Technische details
              </span>
              <span className="text-gray-500 text-xs">
                {showDetails ? 'Verbergen' : 'Tonen'}
              </span>
            </button>

            {showDetails && (
              <div className="px-4 pb-4 space-y-3">
                {/* Error message */}
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                    Error
                  </span>
                  <code className="text-sm text-red-400 font-mono block bg-gray-900/50 rounded p-2 overflow-x-auto">
                    {error.toString()}
                  </code>
                </div>

                {/* Stack trace */}
                {errorInfo?.componentStack && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                      Component Stack
                    </span>
                    <pre className="text-xs text-gray-400 font-mono bg-gray-900/50 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ComponentErrorFallback - Inline component error display
 */
function ComponentErrorFallback({ error, onRetry }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-400 mb-1">
            Component fout
          </h4>
          <p className="text-sm text-gray-400 mb-3">
            Dit onderdeel kon niet worden geladen.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-[#28EBCF] hover:text-[#20D4BA] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Opnieuw proberen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * withErrorBoundary - HOC for wrapping components with ErrorBoundary
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * useErrorHandler - Hook to throw errors to the nearest ErrorBoundary
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  if (error) {
    throw error;
  }

  const handleError = React.useCallback((error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, resetError };
}

export default ErrorBoundary;
