// src/__tests__/imageUtils.test.ts
import { describe, it, expect } from 'vitest';
import { resolveCarImageUrl, standardizeCarImageData } from '@/utils/carImageUtils';

describe('Image Utils', () => {
  it('should resolve car image URL correctly', () => {
    // Test fallback image for null input
    const result1 = resolveCarImageUrl(null);
    expect(result1).toContain('unsplash.com');
    
    // Test URL as-is if it is already a full HTTP URL
    const testUrl = 'https://example.com/test.jpg';
    const result2 = resolveCarImageUrl(testUrl);
    expect(result2).toBe(testUrl);
  });

  it('should standardize car image data correctly', () => {
    const carData = {
      id: '1',
      title: 'Test Car',
      image_paths: ['path1.jpg', 'path2.jpg'],
      image_urls: ['https://example.com/path1.jpg', 'https://example.com/path2.jpg']
    };

    const standardized = standardizeCarImageData(carData);
    
    expect(standardized).toHaveProperty('images');
    expect(standardized).toHaveProperty('thumbnail');
    expect(standardized.images).toEqual(carData.image_urls);
    expect(standardized.thumbnail).toBe(carData.image_urls[0]);
  });
});