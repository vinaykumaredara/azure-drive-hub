import { resolveCarImageUrl, standardizeCarImageData, mapCarForUI } from '@/utils/carImageUtils';

describe('Image Mapping Utilities', () => {
  const sampleCarWithUrls = {
    id: 'test-car-1',
    title: 'Test Car',
    image_urls: [
      'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/test/1.webp',
      'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/test/2.webp'
    ],
    image_paths: [
      'cars/test/1.webp',
      'cars/test/2.webp'
    ]
  };

  const sampleCarWithPathsOnly = {
    id: 'test-car-2',
    title: 'Test Car 2',
    image_urls: null,
    image_paths: [
      'cars/test/3.webp',
      'cars/test/4.webp'
    ]
  };

  const sampleCarWithoutImages = {
    id: 'test-car-3',
    title: 'Test Car 3',
    image_urls: null,
    image_paths: null
  };

  describe('resolveCarImageUrl', () => {
    it('should return the same URL if it is already a full HTTP URL', () => {
      const url = 'https://example.com/image.jpg';
      expect(resolveCarImageUrl(url)).toBe(url);
    });

    it('should construct a public URL from a storage path', () => {
      const path = 'cars/test/image.jpg';
      const expected = 'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/test/image.jpg';
      expect(resolveCarImageUrl(path)).toBe(expected);
    });

    it('should return fallback image for null/undefined/empty input', () => {
      const fallback = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
      expect(resolveCarImageUrl(null)).toBe(fallback);
      expect(resolveCarImageUrl(undefined)).toBe(fallback);
      expect(resolveCarImageUrl('')).toBe(fallback);
      expect(resolveCarImageUrl('   ')).toBe(fallback);
    });
  });

  describe('standardizeCarImageData', () => {
    it('should handle null car input', () => {
      expect(standardizeCarImageData(null)).toBeNull();
    });

    it('should process car with image_urls correctly', () => {
      const result = standardizeCarImageData(sampleCarWithUrls);
      expect(result.images).toEqual(sampleCarWithUrls.image_urls);
      expect(result.thumbnail).toBe(sampleCarWithUrls.image_urls[0]);
      expect(result.image_paths).toEqual(sampleCarWithUrls.image_paths);
      expect(result.image_urls).toEqual(sampleCarWithUrls.image_urls);
    });

    it('should process car with image_paths only by constructing URLs', () => {
      const result = standardizeCarImageData(sampleCarWithPathsOnly);
      expect(result.images).toHaveLength(2);
      expect(result.images[0]).toContain('cars/test/3.webp');
      expect(result.thumbnail).toContain('cars/test/3.webp');
      expect(result.image_paths).toEqual(sampleCarWithPathsOnly.image_paths);
    });

    it('should use fallback images when no image data is available', () => {
      const result = standardizeCarImageData(sampleCarWithoutImages);
      const fallback = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
      expect(result.images).toEqual([fallback]);
      expect(result.thumbnail).toBe(fallback);
      expect(result.image_paths).toEqual([]);
      expect(result.image_urls).toEqual([]);
    });
  });

  describe('mapCarForUI', () => {
    it('should call standardizeCarImageData', () => {
      const result = mapCarForUI(sampleCarWithUrls);
      expect(result.images).toEqual(sampleCarWithUrls.image_urls);
      expect(result.thumbnail).toBe(sampleCarWithUrls.image_urls[0]);
    });
  });
});