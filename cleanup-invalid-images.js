import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function cleanupInvalidImages() {
  console.log('=== Cleaning Up Invalid Image URLs ===\n');
  
  try {
    // Get all cars with image URLs
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, title, image_urls');
      
    if (carsError) {
      console.error('Error fetching cars:', carsError);
      return;
    }
    
    console.log(`Found ${cars.length} cars with image URLs`);
    
    let updatedCount = 0;
    let deletedFiles = 0;
    
    for (const car of cars) {
      if (car.image_urls && car.image_urls.length > 0) {
        let updatedImages = [];
        let filesToDelete = [];
        
        for (const url of car.image_urls) {
          // Check if it's a placeholder image (from unsplash)
          const isPlaceholder = url.includes('unsplash.com') || url.includes('placeholder');
          
          if (isPlaceholder) {
            // Keep placeholder images
            updatedImages.push(url);
          } else {
            // Check if it's a valid image URL (has image extension)
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
            const lowerUrl = url.toLowerCase();
            const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
            
            if (hasValidExtension) {
              // Check if it's accessible
              try {
                const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
                if (response.status === 200) {
                  // Valid and accessible image
                  updatedImages.push(url);
                } else {
                  console.log(`   Removing inaccessible image for car ${car.title}: ${url}`);
                  // Extract filename to delete from storage
                  try {
                    const urlObj = new URL(url);
                    const fileName = urlObj.pathname.split('/').pop();
                    if (fileName) filesToDelete.push(fileName);
                  } catch (urlError) {
                    console.log(`   Error parsing URL: ${url}`);
                  }
                }
              } catch (accessError) {
                console.log(`   Removing inaccessible image for car ${car.title}: ${url}`);
                // Extract filename to delete from storage
                try {
                  const urlObj = new URL(url);
                  const fileName = urlObj.pathname.split('/').pop();
                  if (fileName) filesToDelete.push(fileName);
                } catch (urlError) {
                  console.log(`   Error parsing URL: ${url}`);
                }
              }
            } else {
              console.log(`   Removing invalid image for car ${car.title}: ${url}`);
              // Extract filename to delete from storage
              try {
                const urlObj = new URL(url);
                const fileName = urlObj.pathname.split('/').pop();
                if (fileName) filesToDelete.push(fileName);
              } catch (urlError) {
                console.log(`   Error parsing URL: ${url}`);
              }
            }
          }
        }
        
        // Delete invalid files from storage
        if (filesToDelete.length > 0) {
          console.log(`   Deleting ${filesToDelete.length} invalid files from storage`);
          const { error: deleteError } = await supabase.storage
            .from('cars-photos')
            .remove(filesToDelete);
            
          if (deleteError) {
            console.error(`   Error deleting files:`, deleteError);
          } else {
            deletedFiles += filesToDelete.length;
          }
        }
        
        // Update car if images changed
        if (updatedImages.length !== car.image_urls.length) {
          console.log(`   Updating car ${car.title} (${car.id}): ${car.image_urls.length} -> ${updatedImages.length} images`);
          const { error: updateError } = await supabase
            .from('cars')
            .update({ image_urls: updatedImages })
            .eq('id', car.id);
            
          if (updateError) {
            console.error(`   Error updating car ${car.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }
    }
    
    console.log(`\n=== Cleanup Complete ===`);
    console.log(`Updated ${updatedCount} cars`);
    console.log(`Deleted ${deletedFiles} invalid files from storage`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

cleanupInvalidImages();