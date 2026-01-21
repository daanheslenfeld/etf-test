import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 *
 * Tracks whether a CSS media query matches
 * Uses matchMedia for efficient updates (only on breakpoint changes)
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Use modern API with fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Preset breakpoint hooks matching Tailwind defaults
 */

// Mobile: < 768px (below md breakpoint)
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

// Tablet: 768px - 1023px (md to lg)
export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

// Desktop: >= 1024px (lg and above)
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

// Small mobile: < 640px (below sm breakpoint)
export function useIsSmallMobile() {
  return useMediaQuery('(max-width: 639px)');
}

// Touch device detection (not foolproof but helpful)
export function useIsTouchDevice() {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

// Reduced motion preference
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export default useMediaQuery;
