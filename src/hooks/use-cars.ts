// Custom hook for car data management with caching and error handling
import { useState, useEffect, useCallback, useRef } from 'react';
import { carApi, type Car, type CarListResponse, apiCache } from '@/lib/api';

interface UseCarFilters {
  from?: string;
  to?: string;
  seats?: number;
  q?: string;
  sortBy?: string;
  fuelType?: string;
}

interface UseCarsReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
  clearError: () => void;
}

export function useCars(filters: UseCarFilters = {}): UseCarsReturn {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCars = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Check cache first
    const cacheKey = JSON.stringify({ action: 'getCars', filters });
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      setCars(cachedData.items);
      setTotalCount(cachedData.total);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await carApi.getCars({
        from: filters.from,
        to: filters.to,
        seats: filters.seats,
        q: filters.q
      });

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      let filteredCars = response.items;

      // Apply client-side filters
      if (filters.fuelType && filters.fuelType !== 'all') {
        filteredCars = filteredCars.filter(car => 
          car.fuel.toLowerCase() === filters.fuelType!.toLowerCase()
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-asc':
            filteredCars.sort((a, b) => a.pricePerDay - b.pricePerDay);
            break;
          case 'price-desc':
            filteredCars.sort((a, b) => b.pricePerDay - a.pricePerDay);
            break;
          case 'rating-desc':
            filteredCars.sort((a, b) => b.rating - a.rating);
            break;
          case 'popular':
          default:
            filteredCars.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
        }
      }

      const finalResponse = {
        items: filteredCars,
        total: filteredCars.length
      };

      // Cache the result
      apiCache.set(cacheKey, finalResponse, 30);

      setCars(finalResponse.items);
      setTotalCount(finalResponse.total);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch cars');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCars();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCars]);

  const refetch = useCallback(() => {
    // Clear cache and refetch
    const cacheKey = JSON.stringify({ action: 'getCars', filters });
    apiCache.clear();
    fetchCars();
  }, [fetchCars, filters]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    cars,
    loading,
    error,
    totalCount,
    refetch,
    clearError
  };
}

// Hook for individual car details
export function useCarDetail(carId: string | null) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) {
      setCar(null);
      return;
    }

    const fetchCar = async () => {
      const cacheKey = `car-${carId}`;
      const cachedCar = apiCache.get(cacheKey);
      
      if (cachedCar) {
        setCar(cachedCar);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const carData = await carApi.getCarById(carId);
        apiCache.set(cacheKey, carData, 60); // Cache for 1 minute
        setCar(carData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch car details');
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [carId]);

  return { car, loading, error };
}