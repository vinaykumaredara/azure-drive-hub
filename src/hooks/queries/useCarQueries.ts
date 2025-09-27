// src/hooks/queries/useCarQueries.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CarService } from '@/services/api/carService';

export const useCarQueries = () => {
  const queryClient = useQueryClient();
  
  return {
    // Public cars for users
    cars: useQuery({
      queryKey: ['cars', 'public'],
      queryFn: CarService.getPublicCars,
      staleTime: 2 * 60 * 1000,
    }),
    
    // Admin cars with more details
    adminCars: useQuery({
      queryKey: ['cars', 'admin'],
      queryFn: CarService.getAdminCars,
    }),
    
    // Invalidate queries
    invalidateCars: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    }
  };
};