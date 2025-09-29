// src/utils/adminImageUtils.ts
import { resolveCarImageUrls, standardizeCarImageData } from '@/utils/carImageUtils';

/**
 * Resolve image URLs for a car in admin context
 * Ensures all images have valid public URLs
 * @param car The car object to resolve images for
 * @returns The car object with resolved image URLs
 */
export async function resolveImageUrlsForCarAdmin(car: any) {
  // Use our unified resolver for consistency
  const result = await resolveCarImageUrls(car);
  return result;
}

/**
 * Map car data from database to UI format for admin
 * @param car The car object from database
 * @returns Car object formatted for UI display
 */
export function mapCarForUI(car: any): any {
  if (!car) {
    return car;
  }

  // Use the standardized image data function
  return standardizeCarImageData(car);
}
