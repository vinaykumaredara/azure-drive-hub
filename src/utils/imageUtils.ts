// src/utils/imageUtils.ts
import { supabase } from '@/integrations/supabase/client';

// Returns either:
// 1. If value is already a full URL return it.
// 2. If value is a storage path return the public URL from storage.
// 3. If value is null return null.
export function getPublicOrSignedUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('http')) return value;

  // value is a relative storage path like "cars/<id>/file.jpg"
  const { data } = supabase.storage.from('cars-photos').getPublicUrl(value);
  return data?.publicUrl ?? null;
}

// Ensure image_urls array is populated on the JS object before render
export function resolveCarImageUrls(car: any): any {
  if (!car) return car;
  if (Array.isArray(car.image_urls) && car.image_urls.length) return car;

  const paths = Array.isArray(car.image_paths) ? car.image_paths : [];
  car.image_urls = paths.map(p => getPublicOrSignedUrl(p)).filter(Boolean) as string[];
  return car;
}

// Return a stable public URL for an image in the cars-photos bucket
// This function maintains compatibility with existing code that was using the old getPublicImageUrl
export function getPublicImageUrl(imagePath: string): string {
  try {
    // Extract the file name from the path if it's a full URL
    let fileName = imagePath;
    if (imagePath.includes('/')) {
      const url = new URL(imagePath);
      fileName = url.pathname.split('/').pop() || fileName;
    }
    
    // Validate that the file has an image extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerFileName = fileName.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => lowerFileName.endsWith(ext));
    
    if (!hasValidExtension) {
      console.warn('Invalid image extension:', fileName);
      // Return a fallback image
      return 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
    }
    
    // Get the public URL from Supabase storage
    const { data } = supabase.storage
      .from('cars-photos')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public image URL:', error);
    // Return a fallback image
    return 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
  }
}

// Return a stable public URL for a stored file path or a full URL if already present.
export function getPublicUrlForPath(path: string): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already a full URL

  // Keep full folder structure exactly as stored
  const { data } = supabase.storage.from('cars-photos').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

// Get a public or signed URL for an image, with fallback to a default image
// This function is used in the useCars hook to ensure all images are accessible
export async function getPublicOrSignedUrlAsync(path: string): Promise<string | null> {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // Try to get a public URL first
  try {
    const publicUrl = getPublicUrlForPath(path);
    if (publicUrl) {
      // Verify the URL is accessible
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        return publicUrl;
      }
    }
  } catch (error) {
    console.warn('Failed to get public URL for path:', path, error);
  }
  
  // If public URL fails, return a fallback image
  return 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
}

// Ensure car.image_urls is populated. If image_urls empty but image_paths exist, convert them.
export async function resolveImageUrlsForCar(car: any) {
  if (!car) return car;
  if (Array.isArray(car.image_urls) && car.image_urls.length) return car;

  const urls: string[] = [];
  const paths = Array.isArray(car.image_paths) ? car.image_paths : [];
  for (const p of paths) {
    const u = getPublicUrlForPath(p);
    if (u) urls.push(u);
  }
  car.image_urls = urls;
  return car;
}

// Upload multiple files, return { paths: string[], urls: string[] }
export async function uploadMultipleFiles(carId: string, files: File[]) {
  const results = await Promise.all(files.map(async (file) => {
    const filePath = `cars/${carId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('cars-photos').upload(filePath, file, {
      cacheControl: 'public, max-age=31536000, immutable'
    });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from('cars-photos').getPublicUrl(filePath);
    const publicUrl = pub?.publicUrl ?? null;
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
  if (selErr) throw selErr;
  const existingUrls = Array.isArray(row?.image_urls) ? row.image_urls : [];
  const mergedUrls = [...existingUrls, ...newUrls];

  const { error: updErr } = await supabase.from('cars').update({
    image_urls: mergedUrls
  }).eq('id', carId);

  if (updErr) {
    // Rollback storage if DB write fails
    await supabase.storage.from('cars-photos').remove(newPaths);
    throw updErr;
  }
  return { mergedUrls };
}