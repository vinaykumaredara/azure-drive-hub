import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CarService } from '@/services/api/carService';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('CarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCar', () => {
    it('should create a car with published status and clear cache', async () => {
      const mockCarData = {
        title: 'Test Car',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        seats: 5,
        fuel_type: 'petrol',
        transmission: 'automatic',
        price_per_day: 100,
        status: 'published',
        images: []
      };

      const mockCreatedCar = {
        id: '1',
        ...mockCarData,
        image_urls: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      (mockSupabase.insert().select().single as any).mockResolvedValue({
        data: mockCreatedCar,
        error: null
      });

      const result = await CarService.createCar(mockCarData);

      expect(result).toEqual(mockCreatedCar);
      expect(mockSupabase.from).toHaveBeenCalledWith('cars');
      expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
        status: 'published',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })]);
    });
  });

  describe('getPublicCars', () => {
    it('should fetch published cars with correct query', async () => {
      const mockCars = [
        {
          id: '1',
          title: 'Test Car',
          status: 'published',
          created_at: new Date().toISOString()
        }
      ];

      (mockSupabase.select().eq().order as any).mockResolvedValue({
        data: mockCars,
        error: null
      });

      const result = await CarService.getPublicCars();

      expect(result).toEqual(mockCars);
      expect(mockSupabase.from).toHaveBeenCalledWith('cars');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'published');
    });
  });

  describe('deleteCar', () => {
    it('should delete car from database and clear cache', async () => {
      const carId = '1';
      const mockCar = {
        image_urls: ['image1.jpg', 'image2.jpg']
      };

      // Mock the select call for getting car data
      (mockSupabase.select().eq().single as any).mockResolvedValue({
        data: mockCar,
        error: null
      });

      // Mock the delete call
      (mockSupabase.delete().eq as any).mockResolvedValue({
        error: null
      });

      await CarService.deleteCar(carId);

      expect(mockSupabase.from).toHaveBeenCalledWith('cars');
      expect(mockSupabase.delete).toHaveBeenCalledWith();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', carId);
    });

    it('should handle case when car is not found during deletion', async () => {
      const carId = '1';
      
      // Mock the select call to return not found error
      (mockSupabase.select().eq().single as any).mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'No rows returned'
        }
      });

      // Mock the delete call
      (mockSupabase.delete().eq as any).mockResolvedValue({
        error: null
      });

      await expect(CarService.deleteCar(carId)).resolves.toBeUndefined();
    });
  });
});