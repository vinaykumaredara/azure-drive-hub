// src/utils/carImageUtils.ts
// Unified utility for resolving car image URLs consistently across the application

// Cache for resolved URLs to improve performance
const urlCache = new Map<string, string>();
const imageCache = new Map<string, HTMLImageElement>();

// Fallback image URL for when images fail to load
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

/**
 * Preload an image and cache it for better performance
 * @param src - Image source URL
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  // Check if already cached
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Resolve a car image URL from either a storage path or a full URL
 * @param imagePath - Storage path or full URL
 * @returns Resolved public URL or fallback image
 */
export function resolveCarImageUrl(path: string | null | undefined): string {
  // Handle null/undefined/empty cases
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return FALLBACK_IMAGE;
  }
  
  // Check cache first
  if (urlCache.has(path)) {
    return urlCache.get(path)!;
  }
  
  let result: string;
  
  // If it's already a full HTTP URL, return it as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    result = path;
  } else {
    // For storage paths, construct the public URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
    result = `${supabaseUrl}/storage/v1/object/public/cars-photos/${path}`;
  }
  
  // Cache the result
  urlCache.set(path, result);
  return result;
}

/**
 * Resolve all image URLs for a car
 * @param car - Car object with image_urls array
 * @returns Car object with resolved image URLs
 */
export function resolveCarImageUrls(car: any): any {
  if (!car) {
    return car;
  }
  
  // If we have image_paths, resolve them
  if (Array.isArray(car.image_paths) && car.image_paths.length > 0) {
    car.image_urls = car.image_paths.map(resolveCarImageUrl);
    return car;
  }
  
  // If we already have image_urls, resolve them to ensure they are full URLs
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    car.image_urls = car.image_urls.map(resolveCarImageUrl);
    return car;
  }
  
  // Fallback: ensure we have at least one fallback image
  car.image_urls = [FALLBACK_IMAGE];
  return car;
}

/**
 * Standardize car data for display by ensuring consistent image properties
 * @param car The car object to standardize
 * @returns Car object with standardized image properties
 */
export function standardizeCarImageData(car: any) {
  if (!car) {
    return car;
  }

  // Ensure we have proper arrays for image_paths and image_urls
  const image_paths: string[] = (Array.isArray(car?.image_paths) && car.image_paths.length > 0) 
    ? car.image_paths 
    : [];
    
  const image_urls: string[] = (Array.isArray(car?.image_urls) && car.image_urls.length > 0) 
    ? car.image_urls.map(resolveCarImageUrl)
    : (image_paths.length > 0 ? image_paths.map(resolveCarImageUrl) : []);
  
  // Ensure we have valid images array
  const images = (Array.isArray(image_urls) && image_urls.length > 0) 
    ? image_urls 
    : [FALLBACK_IMAGE];
    
  // Ensure we have a valid thumbnail
  const thumbnail = (typeof images[0] === 'string' && images[0].length > 0) 
    ? images[0] 
    : FALLBACK_IMAGE;
  
  return { ...car, image_paths, image_urls, images, thumbnail };
}

/**
 * Validate if an image URL is accessible
 * @param url - Image URL to validate
 * @returns Promise that resolves to true if URL is accessible, false otherwise
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Map car data from database to UI format
 * @param car The car object from database
 * @returns Car object formatted for UI display
 */
export function mapCarForUI(car: any): any {
  // wrapper mapping used across UI components
  return standardizeCarImageData(car);
}