// supabase/functions/delete-car/index.ts
// Edge Function for secure car deletion with image cleanup

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client with service role key for full access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Fallback image URL for logging
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // SECURITY: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // SECURITY: Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { carId } = await req.json();
    
    // Validate carId
    if (!carId || typeof carId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'carId is required and must be a string' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[DELETE-CAR] Admin ${user.id} starting deletion process for car ID: ${carId}`);

    // 1. Fetch car data to get image paths
    const { data: car, error: fetchError } = await supabaseAdmin
      .from('cars')
      .select('image_paths, image_urls')
      .eq('id', carId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No rows returned - car doesn't exist
        console.log(`[DELETE-CAR] Car with ID ${carId} not found`);
        return new Response(
          JSON.stringify({ error: 'Car not found' }),
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error(`[DELETE-CAR] Error fetching car ${carId}:`, fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch car data', details: fetchError.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[DELETE-CAR] Found car ${carId} with ${car.image_paths?.length || 0} images`);

    // 2. Delete images from storage if they exist
    let imagesDeleted = false;
    let imagesDeleteError: string | null = null;
    
    if (car.image_paths && Array.isArray(car.image_paths) && car.image_paths.length > 0) {
      // Filter out any null/undefined/empty values and fallback images
      const validPaths = car.image_paths.filter(
        path => path && 
                typeof path === 'string' && 
                path.length > 0 && 
                path !== FALLBACK_IMAGE
      );
      
      console.log(`[DELETE-CAR] Attempting to delete ${validPaths.length} images from storage`);
      
      if (validPaths.length > 0) {
        try {
          const { error: storageError } = await supabaseAdmin.storage
            .from('cars-photos')
            .remove(validPaths);
          
          if (storageError) {
            imagesDeleteError = storageError.message;
            console.error(`[DELETE-CAR] Error deleting images from storage:`, storageError);
          } else {
            imagesDeleted = true;
            console.log(`[DELETE-CAR] Successfully deleted ${validPaths.length} images from storage`);
          }
        } catch (storageException) {
          imagesDeleteError = storageException instanceof Error ? storageException.message : 'Unknown storage error';
          console.error(`[DELETE-CAR] Exception during image deletion:`, storageException);
        }
      } else {
        console.log(`[DELETE-CAR] No valid image paths to delete`);
        imagesDeleted = true; // No images to delete is considered successful
      }
    } else {
      console.log(`[DELETE-CAR] No image paths found for car ${carId}`);
      imagesDeleted = true; // No images to delete is considered successful
    }

    // 3. Delete car record from database
    console.log(`[DELETE-CAR] Deleting car record from database`);
    const { error: deleteError } = await supabaseAdmin
      .from('cars')
      .delete()
      .eq('id', carId);

    if (deleteError) {
      console.error(`[DELETE-CAR] Error deleting car record:`, deleteError);
      
      // If we successfully deleted images but failed to delete the database record,
      // this is a critical consistency issue
      if (imagesDeleted) {
        console.error(`[DELETE-CAR] CRITICAL: Images deleted but database record deletion failed!`);
        return new Response(
          JSON.stringify({ 
            error: 'Database deletion failed after images were removed',
            details: deleteError.message,
            warning: 'Images have been removed but car record still exists - manual cleanup required'
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to delete car record', details: deleteError.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[DELETE-CAR] Successfully deleted car record ${carId} from database`);

    // 4. Return success response
    const response = {
      success: true,
      carId,
      imagesDeleted,
      imagesDeleteError,
      message: `Car ${carId} successfully deleted${imagesDeleted ? ' with all associated images' : ''}`
    };

    console.log(`[DELETE-CAR] Deletion completed successfully for car ${carId}`);
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[DELETE-CAR] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error during deletion process',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});