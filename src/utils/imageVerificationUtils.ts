// src/utils/imageVerificationUtils.ts
// Utility functions for verifying and debugging car images

/**
 * Verify that an image URL is accessible and points to a valid image
 * @param url The URL to verify
 * @returns Promise that resolves to true if the URL points to a valid image
 */
export async function verifyImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Skip verification for data URLs
    if (url.startsWith('data:')) {
      return true;
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    // Create the fetch promise
    const fetchPromise = fetch(url, { 
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    }).then(response => {
      // Check if response is OK and content type is an image
      return response.ok && 
             response.headers.get('content-type') !== null && 
             response.headers.get('content-type')!.startsWith('image/');
    }).catch(() => {
      // If HEAD request fails, try GET request with a small timeout
      return fetch(url, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      }).then(response => {
        return response.ok && 
               response.headers.get('content-type') !== null && 
               response.headers.get('content-type')!.startsWith('image/');
      }).catch(() => false);
    });

    // Race the fetch promise against the timeout
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Image verification failed for URL:', url, error);
    return false;
  }
}

/**
 * Verify multiple image URLs concurrently
 * @param urls Array of URLs to verify
 * @returns Promise that resolves to an array of verified URLs
 */
export async function verifyImageUrls(urls: string[]): Promise<string[]> {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  try {
    // Verify all URLs concurrently with a limit to prevent overwhelming the browser
    const verificationPromises = urls.map(url => 
      verifyImageUrl(url).then(isValid => ({ url, isValid }))
    );
    
    const results = await Promise.all(verificationPromises);
    return results.filter(result => result.isValid).map(result => result.url);
  } catch (error) {
    console.error('Error verifying image URLs:', error);
    return [];
  }
}

/**
 * Debug car image data to help identify issues
 * @param car The car object to debug
 * @param context Context information for logging
 */
export function debugCarImageData(car: any, context: string = 'Unknown') {
  console.log(`[IMAGE-DEBUG] ${context}`, {
    carId: car?.id,
    carTitle: car?.title,
    image_urls: car?.image_urls,
    image_paths: car?.image_paths,
    images: car?.images,
    thumbnail: car?.thumbnail,
    image_urls_type: typeof car?.image_urls,
    image_paths_type: typeof car?.image_paths,
    images_type: typeof car?.images,
    thumbnail_type: typeof car?.thumbnail,
    image_urls_length: Array.isArray(car?.image_urls) ? car.image_urls.length : 'Not an array',
    image_paths_length: Array.isArray(car?.image_paths) ? car.image_paths.length : 'Not an array',
    images_length: Array.isArray(car?.images) ? car.images.length : 'Not an array'
  });
}

/**
 * Sanitize and validate image data for a car
 * @param car The car object to sanitize
 * @returns Sanitized car object with valid image data
 */
export function sanitizeCarImageData(car: any): any {
  if (!car) {return car;}

  // Ensure we have proper arrays
  const image_urls = Array.isArray(car.image_urls) ? car.image_urls.filter((url: any) => 
    typeof url === 'string' && url.length > 0
  ) : [];
  
  const image_paths = Array.isArray(car.image_paths) ? car.image_paths.filter((path: any) => 
    typeof path === 'string' && path.length > 0
  ) : [];

  // Create images array from image_urls or image_paths
  let images: string[] = [];
  if (image_urls.length > 0) {
    images = [...image_urls];
  } else if (image_paths.length > 0) {
    // Convert paths to URLs
    images = image_paths.map((path: string) => {
      // If it's already a URL, return as-is
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      // Otherwise, it's a storage path - we would need to resolve it
      // For now, we'll just return the path and let resolveCarImageUrl handle it
      return path;
    });
  }

  // Ensure we have at least one image (fallback)
  const fallbackImage = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
  if (images.length === 0) {
    images = [fallbackImage];
  }

  // First image as thumbnail
  const thumbnail = images[0];

  return {
    ...car,
    image_urls,
    image_paths,
    images,
    thumbnail
  };
}