// src/utils/imageDisplayUtils.ts
// Utility functions for standardizing image display across the application

import { resolveCarImageUrl } from '@/utils/carImageUtils';

// Fallback image URL
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

/**
 * Standardize car data for display by ensuring consistent image properties
 * @param car The car object to standardize
 * @returns Car object with standardized image properties
 */
export function standardizeCarImageData(car: any): any {
  if (!car) {return car;}

  // Create a copy of the car object to avoid mutating the original
  const standardizedCar = { ...car };

  // Ensure we have an images array for consistent display
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    // Resolve all image URLs to ensure they're valid
    standardizedCar.images = car.image_urls
      .map(resolveCarImageUrl)
      .filter((url: string) => url && typeof url === 'string' && url.length > 0);
    
    // Set the first image as the thumbnail
    standardizedCar.thumbnail = standardizedCar.images[0];
  } else if (Array.isArray(car.images) && car.images.length > 0) {
    // If we already have an images array, resolve the URLs
    standardizedCar.images = car.images
      .map(resolveCarImageUrl)
      .filter((url: string) => url && typeof url === 'string' && url.length > 0);
    
    // Set the first image as the thumbnail
    standardizedCar.thumbnail = standardizedCar.images[0];
  } else if (car.image && typeof car.image === 'string' && car.image.length > 0) {
    // If we have a single image property, use it
    const resolvedImage = resolveCarImageUrl(car.image);
    standardizedCar.images = resolvedImage ? [resolvedImage] : [FALLBACK_IMAGE];
    standardizedCar.thumbnail = resolvedImage || FALLBACK_IMAGE;
  } else {
    // Fallback to default images
    standardizedCar.images = [FALLBACK_IMAGE];
    standardizedCar.thumbnail = FALLBACK_IMAGE;
  }

  // Ensure we always have at least one image
  if (!standardizedCar.images || standardizedCar.images.length === 0) {
    standardizedCar.images = [FALLBACK_IMAGE];
    standardizedCar.thumbnail = FALLBACK_IMAGE;
  }

  return standardizedCar;
}

/**
 * Get standardized image data for a car
 * @param car The car object
 * @returns Object with images array and thumbnail
 */
export function getCarImageData(car: any): { images: string[]; thumbnail: string } {
  if (!car) {
    return {
      images: [FALLBACK_IMAGE],
      thumbnail: FALLBACK_IMAGE
    };
  }

  // Try to get images from image_urls first
  if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    const resolvedImages = car.image_urls
      .map(resolveCarImageUrl)
      .filter((url: string) => url && typeof url === 'string' && url.length > 0);
    
    return {
      images: resolvedImages.length > 0 ? resolvedImages : [FALLBACK_IMAGE],
      thumbnail: resolvedImages.length > 0 ? resolvedImages[0] : FALLBACK_IMAGE
    };
  }

  // Try to get images from images array
  if (Array.isArray(car.images) && car.images.length > 0) {
    const resolvedImages = car.images
      .map(resolveCarImageUrl)
      .filter((url: string) => url && typeof url === 'string' && url.length > 0);
    
    return {
      images: resolvedImages.length > 0 ? resolvedImages : [FALLBACK_IMAGE],
      thumbnail: resolvedImages.length > 0 ? resolvedImages[0] : FALLBACK_IMAGE
    };
  }

  // Try to get image from single image property
  if (car.image && typeof car.image === 'string' && car.image.length > 0) {
    const resolvedImage = resolveCarImageUrl(car.image);
    return {
      images: resolvedImage ? [resolvedImage] : [FALLBACK_IMAGE],
      thumbnail: resolvedImage || FALLBACK_IMAGE
    };
  }

  // Fallback
  return {
    images: [FALLBACK_IMAGE],
    thumbnail: FALLBACK_IMAGE
  };
}

/**
 * Validate and resolve image URLs for a car
 * @param car The car object
 * @returns Car object with validated image URLs
 */
export async function validateCarImageUrls(car: any): Promise<any> {
  if (!car) {return car;}

  const standardizedCar = standardizeCarImageData(car);
  
  // Validate each image URL to ensure it's accessible
  const validatedImages = [];
  for (const imageUrl of standardizedCar.images) {
    try {
      // Quick HEAD check to verify URL accessibility with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(imageUrl, { 
        method: 'HEAD', 
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok && response.headers.get('content-type')?.startsWith('image')) {
        validatedImages.push(imageUrl);
      } else {
        // Use fallback for invalid responses
        validatedImages.push(FALLBACK_IMAGE);
      }
    } catch {
      // Use fallback for network errors
      validatedImages.push(FALLBACK_IMAGE);
    }
  }

  // Remove duplicates while preserving order
  standardizedCar.images = [...new Set(validatedImages)];
  standardizedCar.thumbnail = standardizedCar.images[0];

  return standardizedCar;
}

/**
 * Map car data from database to UI format
 * @param car The car object from database
 * @returns Car object formatted for UI display
 */
export function mapCarForUI(car: any): any {
  if (!car) {return car;}

  // Standardize image data first
  const standardizedCar = standardizeCarImageData(car);
  
  // Ensure all required UI properties are present
  return {
    ...standardizedCar,
    // Ensure we have proper image arrays for UI components
    images: standardizedCar.images || [FALLBACK_IMAGE],
    thumbnail: standardizedCar.thumbnail || FALLBACK_IMAGE,
    // Preserve original data for debugging
    image_urls: car.image_urls || null,
    image_paths: car.image_paths || null
  };
}