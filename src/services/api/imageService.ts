// src/services/api/imageService.ts
import { supabase } from '@/integrations/supabase/client';

// Fallback image URL
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

/**
 * Upload a single image file to Supabase Storage
 * @param file The image file to upload
 * @param carId The ID of the car (used for folder organization)
 * @returns Object containing the file path and public URL
 */
export async function uploadImageFile(file: File, carId: string) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error(`File ${file.name} is not a valid image.`);
  }

  // Generate unique file name
  const fileName = `cars/${carId}/${Date.now()}_${file.name}`;
  
  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('cars-photos')
    .upload(fileName, file, {
      cacheControl: 'public, max-age=31536000, immutable'
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL for the uploaded file
  const { data } = supabase.storage.from('cars-photos').getPublicUrl(fileName);
  const publicUrl = data?.publicUrl;
  
  if (!publicUrl) {
    // If we can't generate a public URL, remove the uploaded file and throw error
    await supabase.storage.from('cars-photos').remove([fileName]);
    throw new Error('Failed to generate public URL for uploaded image');
  }

  return {
    path: fileName,
    url: publicUrl
  };
}

/**
 * Upload multiple image files to Supabase Storage
 * @param files Array of image files to upload
 * @param carId The ID of the car (used for folder organization)
 * @returns Object containing arrays of file paths and public URLs
 */
export async function uploadMultipleImageFiles(files: File[], carId: string) {
  const uploadedFiles: { path: string; url: string }[] = [];
  const uploadedPaths: string[] = [];

  try {
    // Upload files one by one to ensure atomicity
    for (const file of files) {
      const uploadedFile = await uploadImageFile(file, carId);
      uploadedFiles.push(uploadedFile);
      uploadedPaths.push(uploadedFile.path);
    }

    return {
      paths: uploadedFiles.map(f => f.path),
      urls: uploadedFiles.map(f => f.url)
    };
  } catch (error) {
    // Rollback all previously uploaded files
    if (uploadedPaths.length > 0) {
      await supabase.storage.from('cars-photos').remove(uploadedPaths);
    }
    throw error;
  }
}

/**
 * Remove images from Supabase Storage
 * @param imageUrls Array of image URLs or paths to remove
 * @returns Promise that resolves when all images are removed
 */
export async function removeImagesFromStorage(imageUrls: string[] | null | undefined) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return;
  }

  // Filter out any null/undefined/empty values
  const validUrls = imageUrls.filter(url => url && typeof url === 'string' && url.length > 0);
  
  if (validUrls.length === 0) {
    return;
  }

  // Extract file paths from URLs (if they're full URLs)
  const filePaths = validUrls.map(url => {
    // If it's already a path (not a full URL), use it as is
    if (!url.startsWith('http')) {
      return url;
    }
    
    // Extract path from Supabase public URL
    // Example: https://xxx.supabase.co/storage/v1/object/public/cars-photos/cars/123/image.jpg
    // Should extract: cars/123/image.jpg
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('cars-photos');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      return url; // Fallback to original if we can't parse
    } catch (err) {
      return url; // Fallback to original if URL parsing fails
    }
  });

  try {
    const { error } = await supabase.storage
      .from('cars-photos')
      .remove(filePaths);
    
    if (error) {
      console.warn('Warning: Some images could not be removed from storage:', error);
      // Don't throw error as this shouldn't break the main flow
    }
  } catch (err) {
    console.warn('Warning: Error removing images from storage:', err);
    // Don't throw error as this shouldn't break the main flow
  }
}

/**
 * Remove images from Supabase Storage using file paths
 * @param filePaths Array of file paths to remove
 * @returns Promise that resolves when all images are removed
 */
export async function removeImagesFromStorageByPaths(filePaths: string[] | null | undefined) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return;
  }

  // Filter out any null/undefined/empty values
  const validPaths = filePaths.filter(path => path && typeof path === 'string' && path.length > 0);
  
  if (validPaths.length === 0) {
    return;
  }

  try {
    const { error } = await supabase.storage
      .from('cars-photos')
      .remove(validPaths);
    
    if (error) {
      console.warn('Warning: Some images could not be removed from storage:', error);
      // Don't throw error as this shouldn't break the main flow
    }
  } catch (err) {
    console.warn('Warning: Error removing images from storage:', err);
    // Don't throw error as this shouldn't break the main flow
  }
}