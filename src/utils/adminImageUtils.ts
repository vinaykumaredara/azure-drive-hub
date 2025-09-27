// src/utils/adminImageUtils.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Get a public URL for an image in the cars-photos bucket
 * @param path The path to the image in the bucket
 * @returns The public URL for the image or null if invalid
 */
export function getPublicUrlFromPath(path: string): string | null {
  if (!path) return null;
  // If path already looks like a full URL, return it
  if (path.startsWith('http')) return path;
  // Get the public URL from Supabase storage
  try {
    const { data } = supabase.storage.from('cars-photos').getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error('getPublicUrl error', err, path);
    return null;
  }
}

/**
 * Resolve image URLs for a car in admin context
 * Ensures all images have valid public URLs
 * @param car The car object to resolve images for
 * @returns The car object with resolved image URLs
 */
export async function resolveImageUrlsForCarAdmin(car: any) {
  if (!car) return car;
  
  // If we already have valid image_urls, ensure they are full URLs
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    // Check if the URLs are valid (not just file paths)
    const resolvedUrls = car.image_urls.map((url: string) => {
      // If it's already a full URL, keep it
      if (url && (url.startsWith('http') || url.startsWith('https'))) {
        return url;
      }
      // Otherwise, treat it as a file path and generate a public URL
      return getPublicUrlFromPath(url) || url; // Fallback to original if conversion fails
    });
    
    car.image_urls = resolvedUrls;
    return car;
  }
  
  // Fallback: if no images, ensure we have an empty array
  if (!car.image_urls) {
    car.image_urls = [];
  }
  
  return car;
}