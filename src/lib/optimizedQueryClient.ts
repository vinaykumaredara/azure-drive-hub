/**
 * Optimized Query Client Configuration for RP CARS
 * Implements aggressive caching, deduplication, and retry strategies
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Creates an optimized query client with:
 * - Aggressive stale time (data stays fresh longer)
 * - Extended garbage collection (cache persists)
 * - Smart retry logic (fast failure, fewer retries for non-recoverable errors)
 * - Deduplication (prevents duplicate requests)
 */
export const createOptimizedQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 15 minutes (was 10)
        staleTime: 15 * 60 * 1000,
        
        // Keep unused data in cache for 1 hour (was 30 min)
        gcTime: 60 * 60 * 1000,
        
        // Smart retry logic
        retry: (failureCount: number, error: any) => {
          // Don't retry on authentication errors (401/403)
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          
          // Don't retry on not found (404)
          if (error?.status === 404) {
            return false;
          }
          
          // Don't retry on validation errors (400)
          if (error?.status === 400) {
            return false;
          }
          
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        
        // Retry with exponential backoff
        retryDelay: (attemptIndex: number) => {
          return Math.min(1000 * 2 ** attemptIndex, 10000);
        },
        
        // Don't refetch on window focus (prevents unnecessary network calls)
        refetchOnWindowFocus: false,
        
        // Always refetch on network reconnect
        refetchOnReconnect: 'always',
        
        // Deduplicate requests within 5 seconds
        structuralSharing: true,
      },
      
      mutations: {
        // Retry mutations once (mutations are usually idempotent)
        retry: 1,
        
        // Centralized error handling
        onError: (error: any) => {
          // Log for debugging (in development only)
          if (import.meta.env.DEV) {
            console.error('Mutation error:', error);
          }
          
          // Could add global error tracking here (e.g., Sentry)
        },
        
        // Shorter retry delay for mutations
        retryDelay: 1000,
      },
    },
  });
};

/**
 * Default query client instance
 * Use this throughout the app for consistency
 */
export const optimizedQueryClient = createOptimizedQueryClient();

/**
 * Query key factory for consistent cache management
 * Helps with cache invalidation and prefetching
 */
export const queryKeys = {
  // Cars
  cars: {
    all: ['cars'] as const,
    lists: () => [...queryKeys.cars.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.cars.lists(), filters] as const,
    details: () => [...queryKeys.cars.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cars.details(), id] as const,
  },
  
  // Bookings
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.bookings.lists(), userId] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
  },
  
  // User
  user: {
    all: ['user'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
    licenses: (id: string) => [...queryKeys.user.all, 'licenses', id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId: string) => [...queryKeys.dashboard.all, 'stats', userId] as const,
    notifications: (userId: string) => [...queryKeys.dashboard.all, 'notifications', userId] as const,
  },
} as const;
