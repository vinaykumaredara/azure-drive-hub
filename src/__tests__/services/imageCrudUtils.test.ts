import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCarWithImages } from '@/utils/imageCrudUtils';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn()
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('imageCrudUtils', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'cars') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          delete: vi.fn().mockReturnThis()
        };
      }
      return {};
    });
    
    mockSupabase.storage.from.mockImplementation((bucket) => {
      if (bucket === 'cars-photos') {
        return {
          remove: vi.fn()
        };
      }
      return {};
    });
  });
  
  describe('deleteCarWithImages', () => {
    it('should delete a car and its images', async () => {
      // Setup mocks
      const mockCarData = {
        id: 'test-car-id',
        title: 'Test Car',
        image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      };
      
      // Mock the fetch car call
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockCarData,
        error: null
      });
      
      // Mock the delete car call
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        error: null
      });
      
      // Mock the storage remove call
      mockSupabase.storage.from().remove.mockResolvedValueOnce({
        error: null
      });
      
      // Call the function
      const result = await deleteCarWithImages('test-car-id');
      
      // Verify the result
      expect(result).toEqual({ success: true });
    });
    
    it('should handle car without images', async () => {
      // Setup mocks
      const mockCarData = {
        id: 'test-car-id',
        title: 'Test Car',
        image_urls: null
      };
      
      // Mock the fetch car call
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockCarData,
        error: null
      });
      
      // Mock the delete car call
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        error: null
      });
      
      // Call the function
      const result = await deleteCarWithImages('test-car-id');
      
      // Verify the result
      expect(result).toEqual({ success: true });
    });
  });
});