// src/utils/imageCrudUtils.ts
// Complete Image CRUD Reliability Utilities

import { supabase } from '@/integrations/supabase/client';
import { resolveCarImageUrl } from '@/utils/carImageUtils';

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
  const publicUrl = resolveCarImageUrl(fileName);
  
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
 * Create a new car with images
 * @param carData The car data to insert
 * @param imageFiles Array of image files to upload
 * @returns The created car object
 */
export async function createCarWithImages(carData: any, imageFiles: File[]) {
  let uploadedImagePaths: string[] = [];
  let uploadedImageUrls: string[] = [];

  try {
    // Upload images first
    if (imageFiles && imageFiles.length > 0) {
      const { paths, urls } = await uploadMultipleImageFiles(imageFiles, `new-${Date.now()}`);
      uploadedImagePaths = paths;
      uploadedImageUrls = urls;
    }

    // Add image URLs to car data
    const carDataWithImages = {
      ...carData,
      image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : [FALLBACK_IMAGE],
      status: carData.status || 'published'
    };

    // Insert car into database
    const { data, error } = await supabase
      .from('cars')
      .insert([carDataWithImages])
      .select()
      .single();

    if (error) {
      // If database insert fails, remove uploaded images
      if (uploadedImagePaths.length > 0) {
        await removeImagesFromStorage(uploadedImagePaths);
      }
      throw error;
    }

    // Update the car ID in the uploaded file paths for better organization
    if (uploadedImagePaths.length > 0 && data?.id) {
      // We could potentially rename the files here, but it's not necessary
      // The important thing is that the database has the correct URLs
    }

    return data;
  } catch (error) {
    // If any step fails, clean up uploaded images
    if (uploadedImagePaths.length > 0) {
      await removeImagesFromStorage(uploadedImagePaths);
    }
    throw error;
  }
}

/**
 * Update an existing car with new images
 * @param carId The ID of the car to update
 * @param carData The car data to update
 * @param newImageFiles Array of new image files to upload
 * @param removeOldImages Whether to remove old images from storage
 * @returns The updated car object
 */
export async function updateCarWithImages(
  carId: string, 
  carData: any, 
  newImageFiles: File[], 
  removeOldImages: boolean = true
) {
  let uploadedImagePaths: string[] = [];
  let uploadedImageUrls: string[] = [];
  let oldImageUrls: string[] = [];

  try {
    // Get the current car to preserve existing data
    const { data: currentCar, error: fetchError } = await supabase
      .from('cars')
      .select('image_urls')
      .eq('id', carId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Store old image URLs for potential cleanup
    if (currentCar?.image_urls && Array.isArray(currentCar.image_urls) && removeOldImages) {
      oldImageUrls = [...currentCar.image_urls];
    }

    // Upload new images
    if (newImageFiles && newImageFiles.length > 0) {
      const { paths, urls } = await uploadMultipleImageFiles(newImageFiles, carId);
      uploadedImagePaths = paths;
      uploadedImageUrls = urls;
    }

    // Prepare image URLs for the update
    let finalImageUrls: string[];
    if (uploadedImageUrls.length > 0) {
      // If we have new images, replace old ones completely
      finalImageUrls = uploadedImageUrls;
    } else if (currentCar?.image_urls && Array.isArray(currentCar.image_urls)) {
      // Keep existing images if no new ones uploaded
      finalImageUrls = currentCar.image_urls;
    } else {
      // Fallback to default image
      finalImageUrls = [FALLBACK_IMAGE];
    }

    // Prepare car data for update
    const carDataWithImages = {
      ...carData,
      image_urls: finalImageUrls
    };

    // Update car in database
    const { data, error } = await supabase
      .from('cars')
      .update(carDataWithImages)
      .eq('id', carId)
      .select()
      .single();

    if (error) {
      // If database update fails, remove newly uploaded images
      if (uploadedImagePaths.length > 0) {
        await removeImagesFromStorage(uploadedImagePaths);
      }
      throw error;
    }

    // Remove old images from storage if requested
    if (removeOldImages && oldImageUrls.length > 0) {
      await removeImagesFromStorage(oldImageUrls);
    }

    return data;
  } catch (error) {
    // If any step fails, clean up newly uploaded images
    if (uploadedImagePaths.length > 0) {
      await removeImagesFromStorage(uploadedImagePaths);
    }
    throw error;
  }
}

/**
 * Delete a car and all its associated images
 * @param carId The ID of the car to delete
 * @returns Promise that resolves when the car and images are deleted
 */
export async function deleteCarWithImages(carId: string) {
  // Get the car to retrieve image URLs
  const { data: car, error: fetchError } = await supabase
    .from('cars')
    .select('image_urls')
    .eq('id', carId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
    throw fetchError;
  }

  // Remove images from storage first
  if (car?.image_urls && Array.isArray(car.image_urls) && car.image_urls.length > 0) {
    await removeImagesFromStorage(car.image_urls);
  }

  // Delete the car record from database
  const { error: deleteError } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId);

  if (deleteError) {
    throw deleteError;
  }

  return { success: true };
}

/**
 * Verify storage and database alignment for a car
 * @param carId The ID of the car to verify
 * @returns Object containing verification results
 */
export async function verifyCarImageAlignment(carId: string) {
  try {
    // Get car data
    const { data: car, error: fetchError } = await supabase
      .from('cars')
      .select('image_urls')
      .eq('id', carId)
      .single();

    if (fetchError) {
      return {
        carId,
        error: 'Failed to fetch car data',
        details: fetchError
      };
    }

    if (!car) {
      return {
        carId,
        error: 'Car not found'
      };
    }

    // Check each image URL
    const verificationResults = [];
    const imageUrls = (car.image_urls && Array.isArray(car.image_urls)) ? car.image_urls : [];
    
    for (const url of imageUrls) {
      try {
        // Skip fallback images
        if (url === FALLBACK_IMAGE) {
          verificationResults.push({
            url,
            status: 'fallback',
            accessible: true
          });
          continue;
        }

        // Test if URL is accessible
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        verificationResults.push({
          url,
          status: response.ok ? 'accessible' : 'inaccessible',
          accessible: response.ok,
          statusCode: response.status
        });
      } catch (err) {
        verificationResults.push({
          url,
          status: 'error',
          accessible: false,
          error: (err as Error).message || 'Unknown error'
        });
      }
    }

    return {
      carId,
      imageUrls: imageUrls,
      verificationResults,
      allAccessible: verificationResults.every(r => r.accessible)
    };
  } catch (error) {
    return {
      carId,
      error: 'Verification failed',
      details: error
    };
  }
}