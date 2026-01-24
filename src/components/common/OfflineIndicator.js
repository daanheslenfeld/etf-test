import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * OfflineIndicator Component
 *
 * Shows when the app is offline or has stale data
 */
export function OfflineIndicator({
  isOnline = true,
  lastUpdated,
  onRefresh,
  variant = 'banner', // 'banner' | 'inline' | 'badge'
  showTimestamp = true,
  className = '',
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return null;
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Zojuist';
    if (minutes < 60) return `${minutes} min geleden`;
    if (hours < 24) return `${hours} uur geleden`;
    return new Date(timestamp).toLocaleDateString('nl-NL');
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isOnline && !lastUpdated) return null;

  // Badge variant
  if (variant === 'badge') {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
          ${isOnline
            ? 'bg-[#C9A962]/10 text-[#C9A962]'
            : 'bg-[#C0736D]/10 text-[#C0736D]'
          }
          ${className}
        `}
      >
        {isOnline ? (
          <>
            <Clock className="w-3 h-3" />
            Cached
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </span>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div
        className={`
          flex items-center gap-2 text-sm
          ${isOnline ? 'text-[#C9A962]' : 'text-[#C0736D]'}
          ${className}
        `}
      >
        {isOnline ? (
          <Clock className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>
          {isOnline
            ? `Cached data${lastUpdated && showTimestamp ? ` (${formatRelativeTime(lastUpdated)})` : ''}`
            : 'Offline'
          }
        </span>
        {onRefresh && isOnline && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-[#F5F6F4] rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div
      className={`
        ${isOnline
          ? 'bg-[#C9A962]/10 border-[#C9A962]/30'
          : 'bg-[#C0736D]/10 border-[#C0736D]/30'
        }
        border rounded-xl px-4 py-3
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              p-2 rounded-lg
              ${isOnline ? 'bg-[#C9A962]/20' : 'bg-[#C0736D]/20'}
            `}
          >
            {isOnline ? (
              <Clock className="w-5 h-5 text-[#C9A962]" />
            ) : (
              <WifiOff className="w-5 h-5 text-[#C0736D]" />
            )}
          </div>
          <div>
            <p className={`font-medium ${isOnline ? 'text-[#C9A962]' : 'text-[#C0736D]'}`}>
              {isOnline ? 'Gecachte data' : 'Geen verbinding'}
            </p>
            <p className="text-sm text-[#636E72]">
              {isOnline
                ? showTimestamp && lastUpdated
                  ? `Laatst bijgewerkt: ${formatRelativeTime(lastUpdated)}`
                  : 'Toont opgeslagen data'
                : 'Controleer je internetverbinding'
              }
            </p>
          </div>
        </div>

        {onRefresh && isOnline && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-[#C9A962]/20 text-[#C9A962] hover:bg-[#C9A962]/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            `}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Vernieuwen
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ConnectionStatus Component
 *
 * Shows IB Gateway connection status
 */
export function ConnectionStatus({
  isConnected,
  isConnecting,
  lastConnected,
  error,
  onReconnect,
  variant = 'default', // 'default' | 'compact' | 'detailed'
  className = '',
}) {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    if (!onReconnect || isReconnecting || isConnecting) return;
    setIsReconnecting(true);
    try {
      await onReconnect();
    } finally {
      setIsReconnecting(false);
    }
  };

  // Compact variant - just an icon
  if (variant === 'compact') {
    return (
      <div
        className={`relative ${className}`}
        title={isConnected ? 'Verbonden' : isConnecting ? 'Verbinden...' : 'Niet verbonden'}
      >
        <div
          className={`
            w-2.5 h-2.5 rounded-full
            ${isConnected
              ? 'bg-[#7C9885]'
              : isConnecting
                ? 'bg-[#C9A962] animate-pulse'
                : 'bg-[#C0736D]'
            }
          `}
        />
      </div>
    );
  }

  // Detailed variant - full card
  if (variant === 'detailed') {
    return (
      <div
        className={`
          bg-[#FEFEFE] border rounded-xl p-4
          ${isConnected
            ? 'border-[#7C9885]/30'
            : isConnecting
              ? 'border-[#C9A962]/30'
              : 'border-[#C0736D]/30'
          }
          ${className}
        `}
      >
        <div className="flex items-start gap-4">
          <div
            className={`
              p-3 rounded-xl
              ${isConnected
                ? 'bg-[#7C9885]/10'
                : isConnecting
                  ? 'bg-[#C9A962]/10'
                  : 'bg-[#C0736D]/10'
              }
            `}
          >
            {isConnected ? (
              <Wifi className="w-6 h-6 text-[#7C9885]" />
            ) : isConnecting ? (
              <RefreshCw className="w-6 h-6 text-[#C9A962] animate-spin" />
            ) : (
              <WifiOff className="w-6 h-6 text-[#C0736D]" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-[#2D3436]">
                IB Gateway
              </h3>
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${isConnected
                    ? 'bg-[#7C9885]/20 text-[#7C9885]'
                    : isConnecting
                      ? 'bg-[#C9A962]/20 text-[#C9A962]'
                      : 'bg-[#C0736D]/20 text-[#C0736D]'
                  }
                `}
              >
                {isConnected ? 'Verbonden' : isConnecting ? 'Verbinden...' : 'Niet verbonden'}
              </span>
            </div>

            {error && (
              <p className="text-sm text-[#C0736D] mb-2">
                {error}
              </p>
            )}

            {!isConnected && !isConnecting && lastConnected && (
              <p className="text-sm text-[#636E72] mb-2">
                Laatst verbonden: {new Date(lastConnected).toLocaleTimeString('nl-NL')}
              </p>
            )}

            {!isConnected && !isConnecting && onReconnect && (
              <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="flex items-center gap-2 text-sm text-[#7C9885] hover:text-[#6B8A74]"
              >
                <RefreshCw className={`w-4 h-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                Opnieuw verbinden
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant - badge with status
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${isConnected
            ? 'bg-[#7C9885]/10 text-[#7C9885]'
            : isConnecting
              ? 'bg-[#C9A962]/10 text-[#C9A962]'
              : 'bg-[#C0736D]/10 text-[#C0736D]'
          }
        `}
      >
        {isConnected ? (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            Verbonden
          </>
        ) : isConnecting ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Verbinden...
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            Niet verbonden
          </>
        )}
      </div>

      {!isConnected && !isConnecting && onReconnect && (
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="p-1 text-[#636E72] hover:text-[#2D3436] transition-colors"
          title="Opnieuw verbinden"
        >
          <RefreshCw className={`w-4 h-4 ${isReconnecting ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

/**
 * NetworkStatus Hook
 *
 * Tracks browser online/offline status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * NetworkStatusBanner
 *
 * Global banner that shows when browser goes offline
 */
export function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRecovered(true);
      const timer = setTimeout(() => {
        setShowRecovered(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRecovered) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg
        transform transition-all duration-300
        ${isOnline
          ? 'bg-[#7C9885] text-white'
          : 'bg-[#C0736D] text-white'
        }
      `}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Verbinding hersteld</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Geen internetverbinding</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
