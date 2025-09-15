// Enhanced caching strategy for Supabase queries
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SupabaseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum cache entries

  private generateKey(table: string, query: any): string {
    return `${table}_${JSON.stringify(query)}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  async get<T>(
    table: string, 
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    const { ttl = 5 * 60 * 1000, forceRefresh = false } = options;
    const key = this.generateKey(table, queryFn.toString());

    // Clean expired entries
    this.evictExpired();

    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return { ...cached.data, fromCache: true };
      }
    }

    // Fetch fresh data
    try {
      const result = await queryFn();
      
      if (!result.error && result.data) {
        // Evict oldest if necessary
        this.evictOldest();
        
        // Cache the result
        this.cache.set(key, {
          data: result,
          timestamp: Date.now(),
          ttl
        });
      }
      
      return result;
    } catch (error) {
      return { data: null, error };
    }
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Could implement hit tracking
    };
  }
}

// Singleton instance
export const cacheManager = new SupabaseCache();

// Enhanced query functions with caching
// Note: Cached queries are temporarily disabled due to TypeScript complexity
// Use direct Supabase queries in components instead
export const cachedQueries = {
  // Cars with caching - temporarily disabled
  getCars: async (options: { ttl?: number; forceRefresh?: boolean } = {}) => {
    console.warn('cachedQueries.getCars is temporarily disabled. Use direct Supabase queries.');
    return { data: null, error: 'Cached queries temporarily disabled' };
  },

  // Bookings with caching - temporarily disabled
  getBookings: async (options: { ttl?: number; forceRefresh?: boolean } = {}) => {
    console.warn('cachedQueries.getBookings is temporarily disabled. Use direct Supabase queries.');
    return { data: null, error: 'Cached queries temporarily disabled' };
  },

  // Licenses with caching - temporarily disabled
  getLicenses: async (options: { ttl?: number; forceRefresh?: boolean } = {}) => {
    console.warn('cachedQueries.getLicenses is temporarily disabled. Use direct Supabase queries.');
    return { data: null, error: 'Cached queries temporarily disabled' };
  },

  // Promo codes with caching - temporarily disabled
  getPromoCodes: async (options: { ttl?: number; forceRefresh?: boolean } = {}) => {
    console.warn('cachedQueries.getPromoCodes is temporarily disabled. Use direct Supabase queries.');
    return { data: null, error: 'Cached queries temporarily disabled' };
  },
};

// Cache invalidation helpers
export const invalidateCache = {
  cars: () => cacheManager.invalidate('cars'),
  bookings: () => cacheManager.invalidate('bookings'),
  licenses: () => cacheManager.invalidate('licenses'),
  promoCodes: () => cacheManager.invalidate('promo_codes'),
  all: () => cacheManager.invalidate(),
};

// Performance monitoring
export const performanceMonitor = {
  measureQuery: async <T>(name: string, queryFn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await queryFn();
      const end = performance.now();
      console.log(`Query ${name} took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`Query ${name} failed after ${end - start} milliseconds:`, error);
      throw error;
    }
  },

  measureRender: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`Component ${componentName} render took ${end - start} milliseconds`);
    };
  }
};

// Image optimization and lazy loading
export const imageOptimization = {
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  preloadCriticalImages: async (urls: string[]) => {
    const promises = urls.map(url => imageOptimization.preloadImage(url));
    try {
      await Promise.all(promises);
      console.log('Critical images preloaded');
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  },

  createOptimizedUrl: (originalUrl: string, width?: number, height?: number, quality = 80) => {
    if (!originalUrl) {return originalUrl;}
    
    // For Supabase storage URLs, we can add transformation parameters
    if (originalUrl.includes('supabase')) {
      const url = new URL(originalUrl);
      if (width) {url.searchParams.set('width', width.toString());}
      if (height) {url.searchParams.set('height', height.toString());}
      url.searchParams.set('quality', quality.toString());
      return url.toString();
    }
    
    return originalUrl;
  }
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic imports for large libraries
  loadChartLibrary: () => import('recharts'),
  loadDateLibrary: () => import('date-fns'),
  loadIconLibrary: () => import('lucide-react'),
  
  // Code splitting for routes
  loadAdminRoutes: () => Promise.all([
    import('@/components/AdminCarManagement'),
    import('@/components/AdminBookingManagement'),
    import('@/components/AnalyticsDashboard'),
    import('@/components/PromoCodeManager'),
    import('@/components/MaintenanceScheduler'),
  ]),
};

export default {
  cacheManager,
  cachedQueries,
  invalidateCache,
  performanceMonitor,
  imageOptimization,
  bundleOptimization,
};