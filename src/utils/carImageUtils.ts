// src/utils/carImageUtils.ts
// Unified utility for resolving car image URLs consistently across the application

import { supabase } from '@/integrations/supabase/client';

// Fallback image URL for when images fail to load
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

/**
 * Resolve a car image URL from either a storage path or a full URL
 * @param imagePath - Storage path or full URL
 * @returns Resolved public URL or fallback image
 */
export function resolveCarImageUrl(imagePath: string | null | undefined): string {
  // Handle null/undefined/empty cases
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.log('resolveCarImageUrl: Returning fallback for null/empty imagePath', { imagePath });
    return FALLBACK_IMAGE;
  }

  // If it's already a full HTTP URL, return it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('resolveCarImageUrl: Returning full URL as-is', { imagePath });
    return imagePath;
  }

  // Otherwise, treat it as a storage path and generate a public URL
  try {
    const { data } = supabase.storage.from('cars-photos').getPublicUrl(imagePath);
    const publicUrl = data?.publicUrl ?? FALLBACK_IMAGE;
    console.log('resolveCarImageUrl: Generated public URL', { imagePath, publicUrl });
    return publicUrl;
  } catch (error) {
    console.error('Error resolving car image URL:', error, imagePath);
    return FALLBACK_IMAGE;
  }
}

/**
 * Validate that a URL points to an actual image by checking content type
 * @param url - URL to validate
 * @returns Promise that resolves to true if URL points to an image
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    return response.ok && response.headers.get('content-type')?.startsWith('image') === true;
  } catch (error) {
    console.warn('Failed to validate image URL:', url, error);
    return false;
  }
}

/**
 * Resolve and validate a car image URL
 * @param imagePath - Storage path or full URL
 * @returns Resolved and validated public URL or fallback image
 */
export async function resolveAndValidateCarImageUrl(imagePath: string | null | undefined): Promise<string> {
  const resolvedUrl = resolveCarImageUrl(imagePath);
  
  // If it's the fallback image, return it immediately
  if (resolvedUrl === FALLBACK_IMAGE) {
    return resolvedUrl;
  }
  
  // Validate the resolved URL
  const isValid = await validateImageUrl(resolvedUrl);
  
  return isValid ? resolvedUrl : FALLBACK_IMAGE;
}

/**
 * Resolve all image URLs for a car
 * @param car - Car object with image_urls array
 * @returns Car object with resolved image URLs
 */
export async function resolveCarImageUrls(car: any): Promise<any> {
  console.log('resolveCarImageUrls: Processing car', {
    id: car?.id,
    title: car?.title,
    image_urls: car?.image_urls,
    image_urls_type: typeof car?.image_urls
  });
  
  if (!car) return car;
  
  // If we already have image_urls, resolve each one
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    console.log('resolveCarImageUrls: Resolving image URLs', car.image_urls);
    
    // Resolve all URLs in parallel
    const resolvedUrls = await Promise.all(
      car.image_urls.map(resolveAndValidateCarImageUrl)
    );
    
    console.log('resolveCarImageUrls: Resolved URLs', resolvedUrls);
    
    // Filter out any remaining invalid URLs and remove duplicates
    const validUrls = resolvedUrls
      .filter(url => url && url !== FALLBACK_IMAGE)
      .filter((url, index, self) => self.indexOf(url) === index);
    
    console.log('resolveCarImageUrls: Valid URLs', validUrls);
    
    // If we have valid URLs, use them; otherwise use fallback
    car.image_urls = validUrls.length > 0 ? validUrls : [FALLBACK_IMAGE];
    
    console.log('resolveCarImageUrls: Final image_urls', car.image_urls);
    
    return car;
  }
  
  // Fallback: ensure we have at least one fallback image
  car.image_urls = [FALLBACK_IMAGE];
  
  console.log('resolveCarImageUrls: Using fallback image', car.image_urls);
  
  return car;
}