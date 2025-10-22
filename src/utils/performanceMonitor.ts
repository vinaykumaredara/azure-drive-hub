// Performance monitoring utility for mobile devices

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

const metrics: PerformanceMetrics = {};

export const trackPerformance = () => {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  // Measure initial load
  window.addEventListener('load', () => {
    try {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!perfData) return;
      
      metrics.ttfb = Math.round(perfData.responseStart - perfData.requestStart);
      
      console.log('📊 Performance Metrics:', {
        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
        ttfb: metrics.ttfb,
        download: Math.round(perfData.responseEnd - perfData.responseStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
        domComplete: Math.round(perfData.domComplete - perfData.fetchStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
      });
      
      // Alert if load time > 3s on mobile
      const isMobile = window.innerWidth < 768;
      const loadComplete = Math.round(perfData.loadEventEnd - perfData.fetchStart);
      if (loadComplete > 3000 && isMobile) {
        console.warn('⚠️ Slow load detected on mobile device:', loadComplete + 'ms');
      }
      
      // Track Core Web Vitals
      trackCoreWebVitals();
    } catch (error) {
      console.error('Performance tracking error:', error);
    }
  });
};

// Track Core Web Vitals (LCP, FID, CLS)
const trackCoreWebVitals = () => {
  try {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = Math.round(lastEntry.startTime);
      console.log('📊 LCP:', metrics.lcp, 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        metrics.fid = Math.round(entry.processingStart - entry.startTime);
        console.log('📊 FID:', metrics.fid, 'ms');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      }
      metrics.cls = parseFloat(clsScore.toFixed(3));
      console.log('📊 CLS:', metrics.cls);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    // Observer API not supported
    console.debug('Core Web Vitals tracking not supported');
  }
};

// Export performance monitor object for compatibility
export const performanceMonitor = {
  getMetrics: (): PerformanceMetrics => {
    return { ...metrics };
  },
  measureFunctionTime: <T>(name: string, fn: () => T): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    if (import.meta.env.DEV) {
      console.log(`⚡ ${name} took ${Math.round(end - start)}ms`);
    }
    return result;
  }
};

// Track component render performance
export const measureComponentRender = (componentName: string) => {
  if (typeof window === 'undefined' || !performance.mark) return;
  
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  const measureName = `${componentName}-render`;
  
  return {
    start: () => {
      try {
        performance.mark(startMark);
      } catch (e) {
        // Ignore errors
      }
    },
    end: () => {
      try {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        const measure = performance.getEntriesByName(measureName)[0];
        if (measure) {
          console.log(`⚡ ${componentName} rendered in ${Math.round(measure.duration)}ms`);
        }
        
        // Clean up marks
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      } catch (e) {
        // Ignore errors
      }
    },
  };
};
