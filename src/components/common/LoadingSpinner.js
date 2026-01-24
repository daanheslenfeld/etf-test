import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner Component - Pastel Design System
 */
const SIZES = {
  sm: { spinner: 'w-4 h-4', text: 'text-xs' },
  md: { spinner: 'w-6 h-6', text: 'text-sm' },
  lg: { spinner: 'w-8 h-8', text: 'text-base' },
  xl: { spinner: 'w-12 h-12', text: 'text-lg' },
};

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
  className = '',
}) {
  const sizeConfig = SIZES[size] || SIZES.md;

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeConfig.spinner} text-[#7C9885] animate-spin`} />
      {text && (
        <span className={`${sizeConfig.text} text-[#636E72]`}>{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F5F6F4]/95 z-50">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#FEFEFE]/90 backdrop-blur-sm z-10 rounded-2xl">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * LoadingDots - Three animated dots
 */
export function LoadingDots({ className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="w-1.5 h-1.5 bg-[#7C9885] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-[#7C9885] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-[#7C9885] rounded-full animate-bounce" />
    </div>
  );
}

/**
 * LoadingPulse - Pulsing placeholder for content
 */
export function LoadingPulse({
  width = 'w-full',
  height = 'h-4',
  className = '',
}) {
  return (
    <div className={`${width} ${height} bg-[#ECEEED] rounded-lg animate-pulse ${className}`} />
  );
}

/**
 * LoadingSkeleton - Skeleton loader for cards/content
 */
export function LoadingSkeleton({
  lines = 3,
  showAvatar = false,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {showAvatar && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0F2EE] rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <LoadingPulse width="w-1/3" height="h-4" />
            <LoadingPulse width="w-1/4" height="h-3" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingPulse
          key={i}
          width={i === lines - 1 ? 'w-2/3' : 'w-full'}
          height="h-4"
        />
      ))}
    </div>
  );
}

/**
 * LoadingCard - Full card skeleton
 */
export function LoadingCard({ className = '' }) {
  return (
    <div className={`bg-[#FEFEFE] border border-[#E8E8E6] rounded-2xl p-6 shadow-[0_2px_8px_rgba(45,52,54,0.06)] ${className}`}>
      <LoadingSkeleton showAvatar lines={2} />
    </div>
  );
}

export default LoadingSpinner;
