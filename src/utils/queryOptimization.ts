
// Query optimization utilities for better database performance
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { errorLogger } from './errorLogger';

// Type definitions for better type safety
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  cache?: boolean;
  cacheTTL?: number;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: any;
  count?: number;
  hasMore?: boolean;
}

// Query cache for frequently accessed data
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {return null;}

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
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

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const queryCache = new QueryCache();

// Optimized query builders
export class OptimizedQueries {
  // Optimized car fetching with proper indexing
  static async getCars(options: QueryOptions = {}): Promise<QueryResult<any>> {
    const cacheKey = `cars_${JSON.stringify(options)}`;
    
    if (options.cache !== false) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const query = supabase
        .from('cars')
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          service_charge,
          location_city,
          status,
          image_urls,
          created_at
        `)
        .eq('status', 'active');

      if (options.limit) {
        query.limit(options.limit);
      }

      if (options.offset) {
        query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options.orderBy) {
        query.order(options.orderBy, { ascending: options.ascending ?? false });
      } else {
        query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        errorLogger.logError(new Error(error.message), {
          component: 'OptimizedQueries',
          action: 'getCars',
          metadata: { options }
        });
        return { data: null, error };
      }

      const result = { data, error: null, count };
      
      if (options.cache !== false) {
        queryCache.set(cacheKey, result, options.cacheTTL);
      }

      return result;
    } catch (error) {
      errorLogger.logError(error as Error, {
        component: 'OptimizedQueries',
        action: 'getCars'
      });
      return { data: null, error };
    }
  }

  // Optimized booking queries with joins
  static async getBookingsWithDetails(
    userId?: string, 
    options: QueryOptions = {}
  ): Promise<QueryResult<any>> {
    const cacheKey = `bookings_${userId || 'all'}_${JSON.stringify(options)}`;
    
    if (options.cache !== false) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          car_id,
          pickup_date,
          return_date,
          pickup_time,
          return_time,
          total_amount,
          status,
          promo_code,
          discount_amount,
          created_at,
          cars (
            id,
            title,
            make,
            model,
            image_urls
          ),
          users (
            id,
            full_name
          )
        `);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        errorLogger.logError(new Error(error.message), {
          component: 'OptimizedQueries',
          action: 'getBookingsWithDetails',
          metadata: { userId, options }
        });
        return { data: null, error };
      }

      const result = { data, error: null, count };
      
      if (options.cache !== false) {
        queryCache.set(cacheKey, result, options.cacheTTL);
      }

      return result;
    } catch (error) {
      errorLogger.logError(error as Error, {
        component: 'OptimizedQueries',
        action: 'getBookingsWithDetails'
      });
      return { data: null, error };
    }
  }

  // Optimized dashboard statistics with single query
  static async getDashboardStats(): Promise<QueryResult<any>> {
    const cacheKey = 'dashboard_stats';
    const cached = queryCache.get(cacheKey);
    if (cached) {return cached;}

    try {
      // Use a custom query instead of RPC for now
      const { data, error } = await supabase
        .from('cars')
        .select('id', { count: 'planned', head: true });

      if (error) {
        errorLogger.logError(new Error(error.message), {
          component: 'OptimizedQueries',
          action: 'getDashboardStats'
        });
        return { data: null, error };
      }

      const result = { data, error: null };
      queryCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes cache

      return result;
    } catch (error) {
      errorLogger.logError(error as Error, {
        component: 'OptimizedQueries',
        action: 'getDashboardStats'
      });
      return { data: null, error };
    }
  }

  // Optimized search with full-text search
  static async searchCars(
    searchTerm: string, 
    filters: {
      location?: string;
      minPrice?: number;
      maxPrice?: number;
      fuelType?: string;
      transmission?: string;
      seats?: number;
    } = {},
    options: QueryOptions = {}
  ): Promise<QueryResult<any>> {
    try {
      let query = supabase
        .from('cars')
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          service_charge,
          location_city,
          image_urls
        `)
        .eq('status', 'active');

      // Full-text search
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters.location) {
        query = query.eq('location_city', filters.location);
      }

      if (filters.minPrice) {
        query = query.gte('price_per_day', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price_per_day', filters.maxPrice);
      }

      if (filters.fuelType) {
        query = query.eq('fuel_type', filters.fuelType);
      }

      if (filters.transmission) {
        query = query.eq('transmission', filters.transmission);
      }

      if (filters.seats) {
        query = query.eq('seats', filters.seats);
      }

      // Apply pagination and ordering
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('price_per_day', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        errorLogger.logError(new Error(error.message), {
          component: 'OptimizedQueries',
          action: 'searchCars',
          metadata: { searchTerm, filters, options }
        });
        return { data: null, error };
      }

      return { data, error: null, count };
    } catch (error) {
      errorLogger.logError(error as Error, {
        component: 'OptimizedQueries',
        action: 'searchCars'
      });
      return { data: null, error };
    }
  }

  // Batch operations for better performance
  static async batchUpdateCarStatus(
    carIds: string[], 
    status: 'active' | 'inactive' | 'maintenance'
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', carIds);

      if (error) {
        errorLogger.logError(new Error(error.message), {
          component: 'OptimizedQueries',
          action: 'batchUpdateCarStatus',
          metadata: { carIds, status }
        });
        return { success: false, error };
      }

      // Invalidate cache
      queryCache.invalidate('cars');

      return { success: true };
    } catch (error) {
      errorLogger.logError(error as Error, {
        component: 'OptimizedQueries',
        action: 'batchUpdateCarStatus'
      });
      return { success: false, error };
    }
  }
}

// Performance monitoring for queries
export const measureQueryPerformance = <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const executeQuery = async (): Promise<void> => {
      try {
        const result = await queryFn();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log slow queries
        if (duration > 1000) { // > 1 second
          errorLogger.logWarning(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`, {
            component: 'QueryPerformance',
            action: 'measureQueryPerformance',
            metadata: { queryName, duration }
          });
        }

        // Log query performance in development
        if (import.meta.env.DEV) {
          console.log(`🔍 Query ${queryName}: ${duration.toFixed(2)}ms`);
        }

        resolve(result);
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        errorLogger.logError(error as Error, {
          component: 'QueryPerformance',
          action: 'measureQueryPerformance',
          metadata: { queryName, duration }
        });
        
        reject(error);
      }
    };

    executeQuery();
  });
};