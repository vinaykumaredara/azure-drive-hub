/**
 * React performance optimization utilities
 * @module utils/react-performance
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * Debounces a callback function
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced callback
 */
export const useDebounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
};

/**
 * Throttles a callback function
 * @param callback - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled callback
 */
export const useThrottle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const lastRan = useRef(Date.now());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callbackRef.current(...args);
        lastRan.current = now;
      }
    },
    [delay]
  );
};

/**
 * Prevents unnecessary re-renders by memoizing complex computations
 * @param factory - Factory function for expensive computation
 * @param deps - Dependencies array
 * @returns Memoized value
 */
export { useMemo, useCallback, memo } from 'react';

/**
 * Hook for measuring component render performance
 * @param componentName - Name of the component
 */
export const useRenderPerformance = (componentName: string): void => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Performance] ${componentName} rendered ${renderCount.current} times. Last render took ${renderTime.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });
};

/**
 * Hook for lazy loading heavy operations
 * @param operation - Operation to perform
 * @param deps - Dependencies
 */
export const useLazyEffect = (
  operation: () => void | Promise<void>,
  deps: React.DependencyList
): void => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      operation();
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
