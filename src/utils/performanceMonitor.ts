// src/utils/performanceMonitor.ts
// Utility for monitoring application performance

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

// Extend PerformanceEntry types
interface PerformanceEntryExtended extends PerformanceEntry {
  processingStart?: number;
  value?: number;
  hadRecentInput?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: MutationObserver[] = [];

  constructor() {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Measure Core Web Vitals when page is fully loaded
    if (document.readyState === 'complete') {
      this.measureCoreWebVitals();
    } else {
      window.addEventListener('load', () => {
        this.measureCoreWebVitals();
      });
    }

    // Measure Time to First Byte
    this.measureTTFB();
  }

  private measureCoreWebVitals() {
    // First Contentful Paint
    if ('performance' in window && 'getEntriesByName' in performance) {
      const fcpEntries = performance.getEntriesByName('first-contentful-paint');
      if (fcpEntries.length > 0) {
        this.metrics.fcp = fcpEntries[0].startTime;
      }
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window && 'LargestContentfulPaint' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observation failed:', e);
      }
    }

    // First Input Delay
    if ('PerformanceObserver' in window && 'firstInput' in PerformanceObserver.supportedEntryTypes) {
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const entry = entries[0] as PerformanceEntryExtended;
            if (entry.processingStart) {
              this.metrics.fid = entry.processingStart - entry.startTime;
            }
          }
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observation failed:', e);
      }
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window && 'LayoutShift' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const extendedEntry = entry as PerformanceEntryExtended;
            if (!extendedEntry.hadRecentInput) {
              clsValue += extendedEntry.value || 0;
            }
          }
          this.metrics.cls = clsValue;
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observation failed:', e);
      }
    }
  }

  private measureTTFB() {
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.ttfb = timing.responseStart - timing.requestStart;
    }
  }

  // Log performance metrics to console
  public logMetrics() {
    console.table({
      'First Contentful Paint (FCP)': `${this.metrics.fcp?.toFixed(2) || 'N/A'} ms`,
      'Largest Contentful Paint (LCP)': `${this.metrics.lcp?.toFixed(2) || 'N/A'} ms`,
      'First Input Delay (FID)': `${this.metrics.fid?.toFixed(2) || 'N/A'} ms`,
      'Cumulative Layout Shift (CLS)': `${this.metrics.cls?.toFixed(4) || 'N/A'}`,
      'Time to First Byte (TTFB)': `${this.metrics.ttfb?.toFixed(2) || 'N/A'} ms`
    });
  }

  // Get performance metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Measure component render time
  public measureRenderTime(componentName: string, callback: () => void): number {
    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Render time for ${componentName}: ${duration.toFixed(2)} ms`);
    return duration;
  }

  // Measure function execution time
  public measureFunctionTime<T>(functionName: string, callback: () => T): T {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Execution time for ${functionName}: ${duration.toFixed(2)} ms`);
    return result;
  }

  // Send metrics to analytics service
  public sendMetricsToAnalytics(metrics: PerformanceMetrics) {
    // In a real application, you would send these metrics to your analytics service
    console.log('Sending performance metrics to analytics:', metrics);
    
    // Example implementation:
    // fetch('/api/performance-metrics', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(metrics),
    // });
  }

  // Clean up observers
  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const measureRenderTime = performanceMonitor.measureRenderTime.bind(performanceMonitor);
export const measureFunctionTime = performanceMonitor.measureFunctionTime.bind(performanceMonitor);