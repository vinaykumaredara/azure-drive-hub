// src/__tests__/services/imageService.test.ts
import { uploadImageFile, uploadMultipleImageFiles, removeImagesFromStorageByPaths } from '@/utils/imageCrudUtils';
import { resolveCarImageUrl, validateImageUrl } from '@/utils/carImageUtils';

// Mock the Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn()
    }
  }
}));

describe('Image Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImageFile', () => {
    it('should upload an image file and return path and URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCarId = 'test-car-id';
      
      // Mock the Supabase storage methods
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' }
      });
      
      const supabaseStorageMock: any = {
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      };
      
      // Mock the supabase client
      const { supabase } = require('@/integrations/supabase/client');
      supabase.storage.from.mockReturnValue(supabaseStorageMock);
      
      const result = await uploadImageFile(mockFile, mockCarId);
      
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('url');
      expect(result.url).toBe('https://example.com/test.jpg');
      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalled();
    });

    it('should throw an error if upload fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCarId = 'test-car-id';
      
      // Mock the Supabase storage methods to simulate an error
      const mockUpload = jest.fn().mockResolvedValue({ error: new Error('Upload failed') });
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      
      const supabaseStorageMock: any = {
        upload: mockUpload,
        remove: mockRemove
      };
      
      // Mock the supabase client
      const { supabase } = require('@/integrations/supabase/client');
      supabase.storage.from.mockReturnValue(supabaseStorageMock);
      
      await expect(uploadImageFile(mockFile, mockCarId)).rejects.toThrow('Upload failed');
      expect(mockUpload).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled(); // Should attempt cleanup
    });
  });

  describe('resolveCarImageUrl', () => {
    it('should return fallback image for null input', () => {
      const result = resolveCarImageUrl(null);
      expect(result).toContain('unsplash.com');
    });

    it('should return URL as-is if it is already a full HTTP URL', () => {
      const testUrl = 'https://example.com/test.jpg';
      const result = resolveCarImageUrl(testUrl);
      expect(result).toBe(testUrl);
    });

    it('should generate public URL for storage path', () => {
      const testPath = 'cars/test/test.jpg';
      const mockPublicUrl = 'https://example.supabase.co/storage/v1/object/public/cars-photos/cars/test/test.jpg';
      
      // Mock the Supabase storage methods
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl }
      });
      
      const supabaseStorageMock: any = {
        getPublicUrl: mockGetPublicUrl
      };
      
      // Mock the supabase client
      const { supabase } = require('@/integrations/supabase/client');
      supabase.storage.from.mockReturnValue(supabaseStorageMock);
      
      const result = resolveCarImageUrl(testPath);
      expect(result).toBe(mockPublicUrl);
      expect(mockGetPublicUrl).toHaveBeenCalledWith(testPath);
    });
  });

  describe('validateImageUrl', () => {
    it('should return false for empty URL', async () => {
      const result = await validateImageUrl('');
      expect(result).toBe(false);
    });

    it('should return false when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await validateImageUrl('https://example.com/test.jpg');
      expect(result).toBe(false);
    });
  });
});