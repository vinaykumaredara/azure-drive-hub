// src/utils/resolveImageUrlsForCar.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve image URLs for a car, ensuring they are valid public URLs
 * This function handles both image_paths and image_urls fields
 * @param car The car object to resolve images for
 * @returns The car object with resolved image URLs
 */
export async function resolveImageUrlsForCar(car: any) {
  if (!car) {return car;}
  
  // If we already have valid image_urls, return as is
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    // Check if the URLs are valid (not just file paths)
    const hasValidUrls = car.image_urls.every((url: string) => 
      url && (url.startsWith('http') || url.startsWith('https'))
    );
    
    if (hasValidUrls) {
      return car;
    }
  }
  
  // If we have image_paths, convert them to public URLs
  if (Array.isArray(car.image_paths) && car.image_paths.length > 0) {
    const urls = [];
    for (const path of car.image_paths) {
      try {
        const { data } = supabase.storage.from('cars-photos').getPublicUrl(path);
        if (data?.publicUrl) {
          urls.push(data.publicUrl);
        }
      } catch (error) {
        console.warn('Failed to generate public URL for path:', path, error);
      }
    }
    
    // Update the car object with the resolved URLs
    car.image_urls = urls;
    return car;
  }
  
  // If we have old-style image_urls that are just file paths, convert them
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    const urls = [];
    for (const path of car.image_urls) {
      // If it's already a full URL, keep it
      if (path && (path.startsWith('http') || path.startsWith('https'))) {
        urls.push(path);
      } else {
        // Otherwise, treat it as a file path and generate a public URL
        try {
          const { data } = supabase.storage.from('cars-photos').getPublicUrl(path);
          if (data?.publicUrl) {
            urls.push(data.publicUrl);
          }
        } catch (error) {
          console.warn('Failed to generate public URL for path:', path, error);
        }
      }
    }
    
    car.image_urls = urls;
    return car;
  }
  
  // Fallback: if no images, ensure we have an empty array
  if (!car.image_urls) {
    car.image_urls = [];
  }
  
  return car;
}

/**
 * Resolve image URLs for multiple cars
 * @param cars Array of car objects
 * @returns Array of car objects with resolved image URLs
 */
export async function resolveImageUrlsForCars(cars: any[]) {
  if (!Array.isArray(cars)) {return cars;}
  
  return Promise.all(cars.map(resolveImageUrlsForCar));
}