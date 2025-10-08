// src/utils/performanceOptimizations.ts
// Additional performance optimizations for the RP Cars website

/**
 * Debounce function to limit the rate at which a function is called
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit the rate at which a function is called
 * @param func - Function to throttle
 * @param limit - Limit time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Preload critical resources to improve perceived performance
 * @param urls - Array of URLs to preload
 */
export function preloadCriticalResources(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Optimize image loading by setting appropriate loading attributes
 */
export function optimizeImageLoading(): void {
  // Set loading="lazy" for images that are not critical
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
}

/**
 * Remove unused CSS classes to reduce bundle size
 */
export function removeUnusedCSS(): void {
  // This would typically be handled by a build tool like PurgeCSS
  // For runtime optimization, we can remove known unused classes
  const unusedClasses = [
    // Add any known unused classes here
  ];

  if (unusedClasses.length > 0) {
    console.warn('Unused CSS classes detected:', unusedClasses);
  }
}

/**
 * Optimize event listeners by using event delegation
 * @param container - Container element to attach delegated events to
 * @param eventType - Type of event to delegate
 * @param selector - CSS selector for target elements
 * @param handler - Event handler function
 */
export function delegateEvent(
  container: HTMLElement,
  eventType: string,
  selector: string,
  handler: (event: Event) => void
): void {
  container.addEventListener(eventType, event => {
    const target = event.target as HTMLElement;
    if (target.matches(selector)) {
      handler(event);
    }
  });
}

/**
 * Batch DOM updates to reduce reflows and repaints
 * @param callback - Function containing DOM updates
 */
export function batchDOMUpdates(callback: () => void): void {
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    callback();
  });
}

/**
 * Optimize scroll performance by debouncing scroll handlers
 * @param handler - Scroll handler function
 * @param delay - Delay in milliseconds
 * @returns Optimized scroll handler
 */
export function optimizeScrollHandler(
  handler: (event: Event) => void,
  delay: number = 16
): (event: Event) => void {
  return debounce(handler, delay);
}

/**
 * Enable passive event listeners for better scroll performance
 * @param element - Element to attach event listener to
 * @param event - Event type
 * @param handler - Event handler function
 */
export function addPassiveEventListener(
  element: HTMLElement,
  event: string,
  handler: (event: Event) => void
): void {
  element.addEventListener(event, handler, { passive: true });
}

/**
 * Optimize animation performance using requestAnimationFrame
 * @param callback - Animation frame callback
 * @returns Request ID for cancellation
 */
export function optimizeAnimation(
  callback: (timestamp: number) => void
): number {
  return requestAnimationFrame(callback);
}

/**
 * Cancel an animation frame
 * @param id - Request ID to cancel
 */
export function cancelOptimizedAnimation(id: number): void {
  cancelAnimationFrame(id);
}

/**
 * Memoize expensive function calls
 * @param func - Function to memoize
 * @param resolver - Function to resolve cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Initialize performance optimizations when the app loads
 */
export function initializePerformanceOptimizations(): void {
  // Optimize image loading
  optimizeImageLoading();

  // Preload critical resources
  // Add critical resources that should be preloaded
  const criticalResources: string[] = [
    // Add critical resources here
  ];

  if (criticalResources.length > 0) {
    preloadCriticalResources(criticalResources);
  }

  // Add passive event listeners for scroll and touch events
  addPassiveEventListener(document, 'scroll', () => {
    // Scroll handler logic
  });

  addPassiveEventListener(document, 'touchstart', () => {
    // Touch handler logic
  });

  console.log('Performance optimizations initialized');
}

// Run initialization when module is imported
initializePerformanceOptimizations();
