// src/utils/imageUtils.test.ts
// Test the image utilities

import { vi } from 'vitest';
import { getPublicOrSignedUrl, resolveCarImageUrls } from './imageUtils';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({
          data: {
            publicUrl: 'https://example.com/public/image.jpg'
          }
        }))
      }))
    }
  }
}));

describe('imageUtils', () => {
  describe('getPublicOrSignedUrl', () => {
    it('should return null for null input', () => {
      expect(getPublicOrSignedUrl(null)).toBeNull();
    });

    it('should return the same URL if it starts with http', () => {
      const url = 'https://example.com/image.jpg';
      expect(getPublicOrSignedUrl(url)).toBe(url);
    });

    it('should convert a path to a public URL', () => {
      const path = 'cars/test/image.jpg';
      const result = getPublicOrSignedUrl(path);
      expect(result).toBe('https://example.com/public/image.jpg');
    });
  });

  describe('resolveCarImageUrls', () => {
    it('should return the same car if it has image_urls', () => {
      const car = {
        id: '1',
        image_urls: ['https://example.com/image1.jpg']
      };
      expect(resolveCarImageUrls(car)).toBe(car);
    });

    it('should convert image_paths to image_urls if image_urls is empty', () => {
      const car = {
        id: '1',
        image_paths: ['cars/test/image1.jpg', 'cars/test/image2.jpg']
      };
      const result = resolveCarImageUrls(car);
      expect(result.image_urls).toEqual([
        'https://example.com/public/image.jpg',
        'https://example.com/public/image.jpg'
      ]);
    });
  });
});