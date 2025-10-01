// src/services/api/carService.ts
import { supabase } from '@/integrations/supabase/client';
import { Car, CreateCarRequest, UpdateCarRequest } from './car.types';
import { uploadMultipleImageFiles, removeImagesFromStorageByPaths } from '@/utils/imageCrudUtils';

/**
 * CarService - Service class for managing car CRUD operations
 * 
 * @description Provides comprehensive car management functionality including
 * creation, reading, updating, and deletion of car records with proper
 * image handling and caching for performance optimization.
 * 
 * @author Senior Developer
 * @since 1.0.0
 */
export class CarService {
  // Cache for public cars
  private static cache = new Map<string, { data: Car[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new car with images
   * 
   * @description Creates a new car record in the database with associated images.
   * Ensures proper status handling for user visibility and cache invalidation.
   * 
   * @param carData - The car data to create
   * @returns The created car object
   * @throws Error if car creation fails
   */
  static async createCar(carData: CreateCarRequest): Promise<Car> {
    try {
      let uploadedImagePaths: string[] = [];
      let uploadedImageUrls: string[] = [];

      // Upload images first
      if (carData.images && carData.images.length > 0) {
        const { paths, urls } = await uploadMultipleImageFiles(carData.images, `new-${Date.now()}`);
        uploadedImagePaths = paths;
        uploadedImageUrls = urls;
      }

      // Add image URLs and paths to car data
      const carDataWithImages: any = {
        ...carData,
        image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        image_paths: uploadedImagePaths.length > 0 ? uploadedImagePaths : null,
        status: carData.status || 'published',
        currency: 'INR',
        price_in_paise: Math.round((carData.price_per_day || 0) * 100),
        booking_status: 'available',
        created_at: new Date().toISOString()
      };

      // Remove the images property as it's not needed in the database
      delete carDataWithImages.images;

      // Insert car into database - using explicit typing workaround
      const { data, error } = await (supabase.from('cars') as any)
        .insert([carDataWithImages])
        .select()
        .single();

      if (error) {
        // If database insert fails, remove uploaded images
        if (uploadedImagePaths.length > 0) {
          await removeImagesFromStorageByPaths(uploadedImagePaths);
        }
        throw error;
      }

      // Clear cache to ensure new car appears immediately
      this.cache.clear();

      return data;
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  }

  /**
   * Update an existing car with new images
   * 
   * @description Updates an existing car record in the database with new data and images.
   * Handles image replacement and cleanup of old images when requested.
   * 
   * @param id - The ID of the car to update
   * @param carData - The updated car data
   * @returns The updated car object
   * @throws Error if car update fails
   */
  static async updateCar(id: string, carData: UpdateCarRequest): Promise<Car> {
    try {
      let uploadedImagePaths: string[] = [];
      let uploadedImageUrls: string[] = [];
      let oldImagePaths: string[] = [];

      // Get the current car to preserve existing data
      const { data: currentCar, error: fetchError } = await (supabase.from('cars') as any)
        .select('image_urls, image_paths')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Store old image paths for potential cleanup
      if (currentCar?.image_paths && Array.isArray(currentCar.image_paths) && carData.removeOldImages) {
        oldImagePaths = [...currentCar.image_paths];
      }

      // Upload new images
      if (carData.newImages && carData.newImages.length > 0) {
        const { paths, urls } = await uploadMultipleImageFiles(carData.newImages, id);
        uploadedImagePaths = paths;
        uploadedImageUrls = urls;
      }

      // Prepare image URLs and paths for the update
      let finalImageUrls: string[] | null;
      let finalImagePaths: string[] | null;
      
      if (uploadedImageUrls.length > 0) {
        // If we have new images, replace old ones completely
        finalImageUrls = uploadedImageUrls;
        finalImagePaths = uploadedImagePaths;
      } else if (currentCar?.image_urls && Array.isArray(currentCar.image_urls)) {
        // Keep existing images if no new ones uploaded
        finalImageUrls = currentCar.image_urls;
        finalImagePaths = currentCar.image_paths && Array.isArray(currentCar.image_paths) ? currentCar.image_paths : null;
      } else {
        // No images
        finalImageUrls = null;
        finalImagePaths = null;
      }

      // Prepare car data for update
      const carDataWithImages: any = {
        ...carData,
        image_urls: finalImageUrls,
        image_paths: finalImagePaths
      };

      // Update currency and price_in_paise if price_per_day is being updated
      if (carData.price_per_day !== undefined) {
        carDataWithImages.currency = 'INR';
        carDataWithImages.price_in_paise = Math.round(carData.price_per_day * 100);
      }

      // Remove properties that shouldn't go to the database
      delete carDataWithImages.newImages;
      delete carDataWithImages.removeOldImages;

      // Update car in database
      const { data, error } = await (supabase.from('cars') as any)
        .update(carDataWithImages)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // If database update fails, remove newly uploaded images
        if (uploadedImagePaths.length > 0) {
          await removeImagesFromStorageByPaths(uploadedImagePaths);
        }
        throw error;
      }

      // Remove old images from storage if requested
      if (carData.removeOldImages && oldImagePaths.length > 0) {
        await removeImagesFromStorageByPaths(oldImagePaths);
      }

      return data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  }

  /**
   * Delete a car and all its associated images
   * 
   * @description Deletes a car record from the database and removes all associated images from storage.
   * Ensures proper cleanup of both database records and storage files.
   * 
   * @param id - The ID of the car to delete
   * @throws Error if car deletion fails
   */
  static async deleteCar(id: string): Promise<void> {
    try {
      console.log(`[CAR-SERVICE] Starting deletion process for car ID: ${id}`);
      
      // Get the car to retrieve image paths
      const { data: car, error: fetchError } = await (supabase.from('cars') as any)
        .select('image_paths')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error(`[CAR-SERVICE] Error fetching car ${id}:`, fetchError);
        throw fetchError;
      }

      // Remove images from storage first using paths for reliability
      if (car?.image_paths && Array.isArray(car.image_paths) && car.image_paths.length > 0) {
        console.log(`[CAR-SERVICE] Removing ${car.image_paths.length} images from storage for car ${id}`);
        await removeImagesFromStorageByPaths(car.image_paths);
      } else {
        console.log(`[CAR-SERVICE] No images to remove for car ${id}`);
      }

      // Delete the car record from database
      console.log(`[CAR-SERVICE] Deleting car record from database for car ${id}`);
      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`[CAR-SERVICE] Error deleting car record ${id}:`, deleteError);
        throw deleteError;
      }

      console.log(`[CAR-SERVICE] Successfully deleted car ${id} from database`);
      
      // Clear cache
      this.cache.clear();
      console.log(`[CAR-SERVICE] Cache cleared after car deletion`);
    } catch (error) {
      console.error('[CAR-SERVICE] Error deleting car:', error);
      throw error;
    }
  }

  /**
   * Get public cars for user display
   * 
   * @description Retrieves all published cars for display to users with caching for performance.
   * Filters cars by 'published' status to ensure only available cars are returned.
   * 
   * @returns Array of published car objects
   * @throws Error if car retrieval fails
   */
  static async getPublicCars(): Promise<Car[]> {
    const cacheKey = 'public-cars';
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const { data, error } = await (supabase.from('cars') as any)
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          price_per_hour,
          description,
          location_city,
          status,
          image_urls,
          image_paths,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cache the results
      this.cache.set(cacheKey, { data: data || [], timestamp: Date.now() });

      return data || [];
    } catch (error) {
      console.error('Error fetching public cars:', error);
      throw error;
    }
  }

  /**
   * Get all cars for admin dashboard
   * 
   * @description Retrieves all cars for the admin dashboard without filtering by status.
   * Used by administrators to manage all car records regardless of publication status.
   * 
   * @returns Array of all car objects
   * @throws Error if car retrieval fails
   */
  static async getAdminCars(): Promise<Car[]> {
    try {
      const { data, error } = await (supabase.from('cars') as any)
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          price_per_hour,
          description,
          location_city,
          status,
          image_urls,
          image_paths,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin cars:', error);
      throw error;
    }
  }

  /**
   * Get a specific car by ID
   * 
   * @description Retrieves a single car record by its ID.
   * Returns null if the car is not found rather than throwing an error.
   * 
   * @param id - The ID of the car to retrieve
   * @returns The car object or null if not found
   * @throws Error if database query fails for reasons other than not found
   */
  static async getCarById(id: string): Promise<Car | null> {
    try {
      const { data, error } = await (supabase.from('cars') as any)
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          price_per_hour,
          description,
          location_city,
          status,
          image_urls,
          image_paths,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, car not found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching car by ID:', error);
      throw error;
    }
  }

  /**
   * Clear the cache
   * 
   * @description Clears the in-memory cache of car data to ensure fresh data is fetched.
   * Called after create, update, or delete operations to maintain data consistency.
   */
  static clearCache(): void {
    this.cache.clear();
  }
}