// Comprehensive debug script to test car deletion functionality
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDeleteCarComprehensive(carId) {
  console.log(`=== Comprehensive Delete Debug for Car ID: ${carId} ===`);
  
  try {
    // 1. Check if the car exists
    console.log('\n1. Checking if car exists...');
    const { data: car, error: fetchError } = await supabase
      .from('cars')
      .select('id, title, image_urls, created_at')
      .eq('id', carId)
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching car:', fetchError);
      return;
    }
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('✅ Car found:', {
      id: car.id,
      title: car.title,
      createdAt: car.created_at,
      imageUrlCount: car.image_urls ? car.image_urls.length : 0,
      imageUrls: car.image_urls
    });
    
    // 2. Test the image URL extraction logic
    console.log('\n2. Testing image URL extraction...');
    if (car.image_urls && Array.isArray(car.image_urls) && car.image_urls.length > 0) {
      const filePaths = car.image_urls.map(url => {
        if (!url.startsWith('http')) {
          return url;
        }
        
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const bucketIndex = pathParts.indexOf('cars-photos');
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const extractedPath = pathParts.slice(bucketIndex + 1).join('/');
            console.log(`  Extracted path from ${url} -> ${extractedPath}`);
            return extractedPath;
          }
          console.log(`  Could not extract path from ${url}`);
          return url;
        } catch (err) {
          console.log(`  Error parsing URL ${url}:`, err.message);
          return url;
        }
      });
      
      console.log('✅ Extracted file paths:', filePaths);
    } else {
      console.log('ℹ️  No image URLs found for this car');
    }
    
    // 3. Test the actual deletion process step by step
    console.log('\n3. Testing deletion process...');
    
    // 3a. Fetch car data (what deleteCarWithImages does)
    console.log('  3a. Fetching car data for deletion...');
    const { data: carForDeletion, error: fetchDeletionError } = await supabase
      .from('cars')
      .select('image_urls')
      .eq('id', carId)
      .single();
      
    if (fetchDeletionError) {
      console.error('❌ Error fetching car for deletion:', fetchDeletionError);
      return;
    }
    
    console.log('  ✅ Car data fetched for deletion');
    
    // 3b. Remove images from storage (what deleteCarWithImages does)
    if (carForDeletion?.image_urls && Array.isArray(carForDeletion.image_urls) && carForDeletion.image_urls.length > 0) {
      console.log('  3b. Attempting to remove images from storage...');
      console.log('    Image URLs to remove:', carForDeletion.image_urls);
      
      // Extract file paths
      const filePaths = carForDeletion.image_urls.map(url => {
        if (!url.startsWith('http')) {
          return url;
        }
        
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const bucketIndex = pathParts.indexOf('cars-photos');
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            return pathParts.slice(bucketIndex + 1).join('/');
          }
          return url;
        } catch (err) {
          return url;
        }
      });
      
      console.log('    Extracted file paths:', filePaths);
      
      // Attempt to remove files
      try {
        const { error: removeError } = await supabase.storage
          .from('cars-photos')
          .remove(filePaths);
        
        if (removeError) {
          console.error('❌ Error removing images from storage:', removeError);
        } else {
          console.log('  ✅ Images removed from storage successfully');
        }
      } catch (removeErr) {
        console.error('❌ Exception during image removal:', removeErr);
      }
    } else {
      console.log('  ℹ️  No images to remove from storage');
    }
    
    // 3c. Delete the car record from database (what deleteCarWithImages does)
    console.log('  3c. Attempting to delete car record from database...');
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);
      
    if (deleteError) {
      console.error('❌ Error deleting car from database:', deleteError);
    } else {
      console.log('  ✅ Car record deleted from database successfully');
    }
    
    // 4. Verify deletion
    console.log('\n4. Verifying deletion...');
    const { data: deletedCar, error: verifyError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', carId)
      .single();
      
    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('❌ Error verifying deletion:', verifyError);
    } else if (deletedCar) {
      console.log('❌ Car still exists after deletion attempt');
    } else {
      console.log('✅ Car successfully deleted from database');
    }
    
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('❌ Unexpected error during deletion debug:', error);
  }
}

// Get car ID from command line arguments
const carId = process.argv[2];
if (!carId) {
  console.log('Usage: node comprehensive-delete-debug.js <car-id>');
  console.log('Example: node comprehensive-delete-debug.js 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

debugDeleteCarComprehensive(carId);