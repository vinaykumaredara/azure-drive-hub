// src/hooks/data/useCarMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CarService } from '@/services/api/carService';
import { toast } from '@/hooks/use-toast';
import { CreateCarRequest, UpdateCarRequest } from '@/services/api/car.types';

export const useCarMutations = () => {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (carData: CreateCarRequest) => CarService.createCar(carData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast({
        title: "Success",
        description: "Car created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, carData }: { id: string; carData: UpdateCarRequest }) => 
      CarService.updateCar(id, carData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast({
        title: "Success",
        description: "Car updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => CarService.deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast({
        title: "Success",
        description: "Car deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete car: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  return { 
    createMutation, 
    updateMutation, 
    deleteMutation,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};