import React from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

/**
 * PageLoader Component
 *
 * Full page loading state for use with React Suspense
 */
export function PageLoader({
  title = 'Laden...',
  subtitle,
  showLogo = true,
  variant = 'default', // 'default' | 'minimal' | 'branded'
}) {
  // Minimal variant - just a spinner
  if (variant === 'minimal') {
    return (
      <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-[#7C9885] animate-spin" />
          {title && (
            <p className="mt-4 text-[#636E72] text-sm">{title}</p>
          )}
        </div>
      </div>
    );
  }

  // Branded variant - with logo animation
  if (variant === 'branded') {
    return (
      <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Animated Logo */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7C9885] to-[#6B8A74] rounded-2xl flex items-center justify-center animate-pulse">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            {/* Spinning ring */}
            <div className="absolute inset-0 -m-2">
              <svg className="w-20 h-20 animate-spin-slow" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#7C9885"
                  strokeWidth="2"
                  strokeDasharray="180 100"
                  strokeLinecap="round"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#2D3436] mb-1">
            ETF Portaal
          </h1>
          <p className="text-[#636E72] text-sm">
            {title}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-6">
            <span className="w-2 h-2 bg-[#7C9885] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-[#7C9885] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-[#7C9885] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Custom animation */}
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // Default variant
  return (
    <div className="min-h-screen bg-[#F5F6F4] flex items-center justify-center">
      <div className="flex flex-col items-center max-w-sm text-center">
        {showLogo && (
          <div className="w-12 h-12 bg-[#7C9885]/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-[#7C9885]" />
          </div>
        )}

        {/* Loading spinner */}
        <div className="relative mb-4">
          <div className="w-10 h-10 border-2 border-[#E8E8E6] rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-[#7C9885] border-t-transparent rounded-full animate-spin" />
        </div>

        <h2 className="text-lg font-medium text-[#2D3436] mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[#636E72]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * SectionLoader Component
 *
 * Loading state for sections within a page
 */
export function SectionLoader({
  title,
  height = 'h-48',
  className = '',
}) {
  return (
    <div
      className={`
        bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl
        flex items-center justify-center
        ${height}
        ${className}
      `}
    >
      <div className="flex flex-col items-center">
        <RefreshCw className="w-6 h-6 text-[#7C9885] animate-spin" />
        {title && (
          <p className="mt-3 text-sm text-[#636E72]">{title}</p>
        )}
      </div>
    </div>
  );
}

/**
 * ContentLoader Component
 *
 * Skeleton loader for content areas
 */
export function ContentLoader({
  lines = 3,
  showAvatar = false,
  className = '',
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#ECEEED] rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-[#ECEEED] rounded w-1/3 mb-2" />
            <div className="h-3 bg-[#E8E8E6] rounded w-1/4" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-[#ECEEED] rounded"
            style={{ width: `${100 - (i * 15)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * TableLoader Component
 *
 * Skeleton loader for table content
 */
export function TableLoader({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showHeader && (
        <div className="flex gap-4 pb-3 border-b border-[#E8E8E6] mb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-[#E8E8E6] rounded"
              style={{ width: `${Math.random() * 40 + 60}px` }}
            />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={`h-4 bg-[#ECEEED] rounded ${colIdx === 0 ? 'flex-1' : ''}`}
                style={{ width: colIdx === 0 ? undefined : `${Math.random() * 30 + 50}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CardLoader Component
 *
 * Skeleton loader for card content
 */
export function CardLoader({
  showImage = false,
  className = '',
}) {
  return (
    <div className={`bg-[#FEFEFE] border border-[#E8E8E6] rounded-xl p-4 animate-pulse ${className}`}>
      {showImage && (
        <div className="h-32 bg-[#ECEEED] rounded-lg mb-4" />
      )}
      <div className="space-y-3">
        <div className="h-5 bg-[#ECEEED] rounded w-3/4" />
        <div className="h-4 bg-[#E8E8E6] rounded w-full" />
        <div className="h-4 bg-[#E8E8E6] rounded w-2/3" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-[#ECEEED] rounded flex-1" />
        <div className="h-8 bg-[#E8E8E6] rounded w-20" />
      </div>
    </div>
  );
}

/**
 * GridLoader Component
 *
 * Skeleton loader for grid of cards
 */
export function GridLoader({
  count = 4,
  columns = 'grid-cols-2',
  className = '',
}) {
  return (
    <div className={`grid ${columns} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardLoader key={i} />
      ))}
    </div>
  );
}

export default PageLoader;
