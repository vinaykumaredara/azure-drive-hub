import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminCarManagement from '@/components/AdminCarManagement';
import { CarService } from '@/services/api/carService';
import { useToast, toast } from '@/hooks/use-toast';

// Mock the CarService
vi.mock('@/services/api/carService', () => ({
  CarService: {
    deleteCar: vi.fn(),
    getAdminCars: vi.fn()
  }
}));

// Mock the Supabase client
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

// Mock the useRealtimeSubscription hook
vi.mock('@/hooks/useRealtime', () => ({
  useRealtimeSubscription: vi.fn()
}));

// Mock the resolveImageUrlsForCarAdmin utility
vi.mock('@/utils/adminImageUtils', () => ({
  resolveImageUrlsForCarAdmin: vi.fn().mockImplementation((car) => Promise.resolve(car))
}));

// Mock the image CRUD utilities
vi.mock('@/utils/imageCrudUtils', () => ({
  createCarWithImages: vi.fn(),
  updateCarWithImages: vi.fn(),
  uploadMultipleImageFiles: vi.fn(),
  removeImagesFromStorage: vi.fn()
}));

// Mock the toast function
vi.mock('@/hooks/use-toast', async () => {
  const actual = await vi.importActual('@/hooks/use-toast');
  return {
    ...actual,
    toast: vi.fn(),
    useToast: vi.fn().mockReturnValue({
      toast: vi.fn(),
      toasts: [],
      dismiss: vi.fn()
    })
  };
});

describe('AdminCarManagement', () => {
  const mockCars = [
    {
      id: '1',
      title: 'Test Car 1',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 100,
      status: 'published',
      image_urls: null,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Test Car 2',
      make: 'Honda',
      model: 'Civic',
      year: 2021,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'manual',
      price_per_day: 80,
      status: 'draft',
      image_urls: null,
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the Supabase select call for fetching cars
    (mockSupabase.select().order as any).mockResolvedValue({
      data: mockCars,
      error: null
    });
  });

  it('should render the car management dashboard', async () => {
    render(<AdminCarManagement />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Car Management')).toBeInTheDocument();
    });

    // Check that cars are displayed
    expect(screen.getByText('Test Car 1')).toBeInTheDocument();
    expect(screen.getByText('Test Car 2')).toBeInTheDocument();
  });

  it('should handle car deletion using CarService', async () => {
    render(<AdminCarManagement />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Car Management')).toBeInTheDocument();
    });

    // Mock the deleteCar function to resolve successfully
    (CarService.deleteCar as any).mockResolvedValue(undefined);

    // Find and click the delete button for the first car
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    // Wait for the deletion to complete
    await waitFor(() => {
      expect(CarService.deleteCar).toHaveBeenCalledWith('1');
    });

    // Check for success message
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Success",
        description: "Car deleted successfully from database and storage"
      }));
    });
  });
});