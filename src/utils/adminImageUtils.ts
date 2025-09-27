// src/utils/adminImageUtils.ts
import { supabase } from '@/integrations/supabase/client';
import { resolveCarImageUrls } from '@/utils/carImageUtils';

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
  console.log('resolveImageUrlsForCarAdmin: Processing car', {
    id: car?.id,
    title: car?.title,
    image_urls: car?.image_urls,
    image_urls_type: typeof car?.image_urls
  });
  
  // Use our unified resolver for consistency
  const result = await resolveCarImageUrls(car);
  
  console.log('resolveImageUrlsForCarAdmin: Result', {
    id: result?.id,
    title: result?.title,
    image_urls: result?.image_urls,
    image_urls_type: typeof result?.image_urls
  });
  
  return result;
}