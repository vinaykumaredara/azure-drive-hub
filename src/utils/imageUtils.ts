// src/utils/imageUtils.ts
import { supabase } from '@/integrations/supabase/client';
import { resolveCarImageUrl, resolveCarImageUrls } from '@/utils/carImageUtils';

// Export the unified resolver functions for backward compatibility
export { resolveCarImageUrl, resolveCarImageUrls };

// Returns either:
// 1. If value is already a full URL return it.
// 2. If value is a storage path return the public URL from storage.
// 3. If value is null return null.
export function getPublicOrSignedUrl(value: string | null): string | null {
  if (!value) {return null;}
  return resolveCarImageUrl(value);
}

// Ensure image_urls array is populated on the JS object before render
export function resolveCarImageUrlsLegacy(car: any): any {
  if (!car) {return car;}
  if (Array.isArray(car.image_urls) && car.image_urls.length) {return car;}

  const paths = Array.isArray(car.image_paths) ? car.image_paths : [];
  car.image_urls = paths.map((p: string) => getPublicOrSignedUrl(p)).filter(Boolean) as string[];
  return car;
}

// Return a stable public URL for an image in the cars-photos bucket
// This function maintains compatibility with existing code that was using the old getPublicImageUrl
export function getPublicImageUrl(imagePath: string): string {
  return resolveCarImageUrl(imagePath);
}

// Return a stable public URL for a stored file path or a full URL if already present.
export function getPublicUrlForPath(path: string): string | null {
  return resolveCarImageUrl(path);
}

// Get a public or signed URL for an image, with fallback to a default image
// This function is used in the useCars hook to ensure all images are accessible
export async function getPublicOrSignedUrlAsync(path: string): Promise<string | null> {
  const resolvedUrl = resolveCarImageUrl(path);
  if (resolvedUrl) {
    return resolvedUrl;
  }
  return null;
}

// Add this enhanced function:
export async function validateAndResolveImageUrl(url: string | null): Promise<string> {
  return resolveCarImageUrl(url);
}

// Ensure car.image_urls is populated. If image_urls empty but image_paths exist, convert them.
export async function resolveImageUrlsForCarLegacy(car: any) {
  return await resolveCarImageUrls(car);
}

// Upload multiple files, return { paths: string[], urls: string[] }
export async function uploadMultipleFiles(carId: string, files: File[]) {
  const results = await Promise.all(files.map(async (file) => {
    const filePath = `cars/${carId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('cars-photos').upload(filePath, file, {
      cacheControl: 'public, max-age=31536000, immutable'
    });
    if (upErr) {throw upErr;}
    // Use our unified resolver to get the public URL
    const publicUrl = resolveCarImageUrl(filePath);
    return { path: filePath, url: publicUrl };
  }));

  return {
    paths: results.map(r => r.path),
    urls: results.map(r => r.url).filter(Boolean) as string[]
  };
}

// Append arrays safely in DB (client read-modify-write approach)
export async function appendImageUrlsToCar(carId: string, newUrls: string[], newPaths: string[]) {
  // Read existing arrays
  const { data: row, error: selErr } = await supabase.from('cars').select('image_urls').eq('id', carId).single();
  if (selErr) {throw selErr;}
  const existingUrls = Array.isArray((row as any)?.image_urls) ? (row as any).image_urls : [];
  // Resolve all URLs before merging
  const resolvedNewUrls = newUrls.map(resolveCarImageUrl);
  const mergedUrls = [...existingUrls, ...resolvedNewUrls];

  const { error: updErr } = await (supabase.from('cars') as any).update({
    image_urls: mergedUrls
  }).eq('id', carId);

  if (updErr) {
    // Rollback storage if DB write fails
    await supabase.storage.from('cars-photos').remove(newPaths);
    throw updErr;
  }
  return { mergedUrls };
}