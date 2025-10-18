/**
 * Performance optimization utilities
 * Centralizes performance improvements across the application
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * Debounce hook for performance optimization
 * Reduces the number of function calls for frequently triggered events
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
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
}

/**
 * Throttle hook for performance optimization
 * Limits the number of times a function can be called
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
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
}

/**
 * Request idle callback polyfill for performance optimization
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (callback: IdleRequestCallback) => setTimeout(callback, 1);

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

/**
 * Optimize images by adding loading and decoding attributes
 */
export function optimizeImageAttributes(img: HTMLImageElement, isAboveFold = false): void {
  if (isAboveFold) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  } else {
    img.loading = 'lazy';
    img.decoding = 'async';
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string): void {
  if (typeof document === 'undefined') {return;}
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) {
    link.type = type;
  }
  document.head.appendChild(link);
}

/**
 * Prefetch resources for future navigation
 */
export function prefetchResource(href: string): void {
  if (typeof document === 'undefined') {return;}
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Measure and log performance metrics
 */
export function measurePerformance(name: string, callback: () => void): void {
  if (typeof performance === 'undefined') {
    callback();
    return;
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-measure`;

  performance.mark(startMark);
  callback();
  performance.mark(endMark);

  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    console.info(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
  } catch (error) {
    console.warn(`Failed to measure performance for ${name}`, error);
  }

  // Clean up marks and measures
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);
}

/**
 * Create a cache with automatic expiration
 */
export class PerformanceCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
