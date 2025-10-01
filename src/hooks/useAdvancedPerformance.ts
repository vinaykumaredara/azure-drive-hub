// Enhanced caching and performance hooks
import { useEffect, useCallback, useRef } from 'react';

// Cache implementation
const cache = new Map<string, any>();

export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl = 5 * 60 * 1000) => {
  const fetchData = useCallback(async () => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }, [key, fetcher, ttl]);

  return fetchData;
};

// Performance monitoring
export const usePerformanceMonitor = (): void => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            console.log('FID:', (entry as any).processingStart - entry.startTime);
          }
        }
      });
      
      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        observer.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('Performance observer not supported');
      }
      
      return () => observer.disconnect();
    }
    return undefined;
  }, []);
};

// Intersection observer for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {return;}

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
};

// Memory optimization
export const useMemoryOptimization = () => {
  useEffect(() => {
    const cleanup = () => {
      // Clear unused cache entries
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutes
          cache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical images
    const criticalImages = [
      '/api/placeholder/400/300',
      '/api/placeholder/600/400'
    ];
    
    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }
};

// Service Worker registration (disabled in development)
export const registerServiceWorker = () => {
  // Skip service worker in development to avoid preview conflicts
  if (import.meta.env.DEV) {
    console.log('Service Worker registration skipped in development mode');
    return;
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Error boundary hook
export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = useCallback((error: Error) => {
    setError(error);
    console.error('Captured error:', error);
  }, []);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureError(new Error(event.message));
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      captureError(new Error(event.reason));
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [captureError]);
  
  return { error, resetError, captureError };
};

// Import missing useState
import { useState } from 'react';

export default {
  useCache,
  usePerformanceMonitor,
  useIntersectionObserver,
  useMemoryOptimization,
  preloadCriticalResources,
  registerServiceWorker,
  useErrorBoundary,
};