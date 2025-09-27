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

// Mock the image service functions
vi.mock('@/services/api/imageService', () => ({
  uploadMultipleImageFiles: vi.fn(),
  removeImagesFromStorage: vi.fn()
}));

describe('Admin to User Car Visibility Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cache before each test
    CarService.clearCache();
  });

  it('should make admin-created cars immediately visible to users', async () => {
    const carData = {
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

    const createdCar = {
      id: '1',
      ...carData,
      image_urls: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Mock the insert call for creating a car
    (mockSupabase.insert().select().single as any).mockResolvedValue({
      data: createdCar,
      error: null
    });

    // Create car as admin
    const result = await CarService.createCar(carData);

    // Verify car was created with correct status
    expect(result).toEqual(createdCar);
    expect(result.status).toBe('published');
    expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
      status: 'published'
    })]);

    // Mock the select call for getting public cars
    const publicCars = [createdCar];
    (mockSupabase.select().eq().order as any).mockResolvedValue({
      data: publicCars,
      error: null
    });

    // Verify car appears in user query immediately
    const userCars = await CarService.getPublicCars();
    const foundCar = userCars.find(car => car.id === result.id);

    expect(foundCar).toBeDefined();
    expect(foundCar?.title).toBe('Test Car');
    expect(foundCar?.status).toBe('published');
  });

  it('should completely remove car from database when deleted', async () => {
    const testCarData = {
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

    const createdCar = {
      id: '1',
      ...testCarData,
      image_urls: ['image1.jpg'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Mock the insert call for creating a car
    (mockSupabase.insert().select().single as any).mockResolvedValue({
      data: createdCar,
      error: null
    });

    // Create car
    const result = await CarService.createCar(testCarData);

    // Verify it exists in database
    (mockSupabase.select().eq().single as any).mockResolvedValue({
      data: createdCar,
      error: null
    });

    let dbCar = await CarService.getCarById(result.id);
    expect(dbCar).toBeDefined();
    expect(dbCar?.id).toBe(result.id);

    // Mock the select call for getting car data before deletion
    (mockSupabase.select().eq().single as any).mockResolvedValue({
      data: createdCar,
      error: null
    });

    // Mock the delete call
    (mockSupabase.delete().eq as any).mockResolvedValue({
      error: null
    });

    // Delete car
    await CarService.deleteCar(result.id);

    // Verify it's gone from database
    (mockSupabase.select().eq().single as any).mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST116',
        message: 'No rows returned'
      }
    });

    dbCar = await CarService.getCarById(result.id);
    expect(dbCar).toBeNull();
  });
});