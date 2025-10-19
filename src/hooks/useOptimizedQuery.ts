/**
 * Optimized query hook for better performance
 * Implements query optimization strategies
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

interface OptimizedQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  queryKey: any[];
  queryFn: () => Promise<TData>;
  // Performance options
  enableCache?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

/**
 * Enhanced useQuery hook with performance optimizations
 */
export function useOptimizedQuery<TData = unknown>({
  queryKey,
  queryFn,
  enableCache = true,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 2 * 60 * 1000, // 2 minutes
  ...options
}: OptimizedQueryOptions<TData>) {
  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 1000; // Prevent fetches within 1 second

  // Debounced query function to prevent rapid successive calls
  const optimizedQueryFn = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;

    // If we just fetched, wait a bit
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_FETCH_INTERVAL - timeSinceLastFetch));
    }

    lastFetchTime.current = Date.now();
    return queryFn();
  }, [queryFn]);

  return useQuery<TData>({
    queryKey,
    queryFn: optimizedQueryFn,
    gcTime: enableCache ? cacheTime : 0,
    staleTime: enableCache ? staleTime : 0,
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnReconnect: 'always',
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

/**
 * Hook for prefetching data to improve perceived performance
 */
export function usePrefetch<TData = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: Partial<OptimizedQueryOptions<TData>>
) {
  const { data, isLoading } = useOptimizedQuery({
    queryKey,
    queryFn,
    staleTime: Infinity, // Prefetched data never goes stale
    ...options,
  });

  return { data, isLoading };
}
