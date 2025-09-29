import { describe, it, expect } from 'vitest';
import { standardizeCarImageData, mapCarForUI } from '@/utils/carImageUtils';

describe('Image Display Utilities', () => {
  it('should standardize car image data correctly', () => {
    const car = {
      id: '1',
      title: 'Test Car',
      image_paths: ['cars/1/image1.jpg', 'cars/1/image2.jpg'],
      image_urls: [
        'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/1/image1.jpg',
        'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/1/image2.jpg'
      ]
    };

    const standardized = standardizeCarImageData(car);
    
    expect(standardized).toEqual({
      ...car,
      images: car.image_urls,
      thumbnail: car.image_urls[0]
    });
  });

  it('should handle car with no images', () => {
    const car = {
      id: '1',
      title: 'Test Car'
    };

    const standardized = standardizeCarImageData(car);
    
    expect(standardized.image_paths).toEqual([]);
    expect(standardized.image_urls).toEqual([]);
    expect(standardized.images).toEqual([]);
    expect(standardized.thumbnail).toBeNull();
  });

  it('should map car for UI correctly', () => {
    const car = {
      id: '1',
      title: 'Test Car',
      image_paths: ['cars/1/image1.jpg'],
      image_urls: [
        'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/1/image1.jpg'
      ]
    };

    const mapped = mapCarForUI(car);
    
    expect(mapped.images).toEqual(car.image_urls);
    expect(mapped.thumbnail).toEqual(car.image_urls[0]);
  });

  it('should handle car with empty image arrays', () => {
    const car = {
      id: '1',
      title: 'Test Car',
      image_paths: [],
      image_urls: []
    };

    const standardized = standardizeCarImageData(car);
    
    expect(standardized.image_paths).toEqual([]);
    expect(standardized.image_urls).toEqual([]);
    expect(standardized.images).toEqual([]);
    expect(standardized.thumbnail).toBeNull();
  });

  it('should handle car with null image properties', () => {
    const car = {
      id: '1',
      title: 'Test Car',
      image_paths: null,
      image_urls: null
    };

    const standardized = standardizeCarImageData(car);
    
    expect(standardized.image_paths).toEqual([]);
    expect(standardized.image_urls).toEqual([]);
    expect(standardized.images).toEqual([]);
    expect(standardized.thumbnail).toBeNull();
  });
});