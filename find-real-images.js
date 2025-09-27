import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findRealImages() {
  console.log('=== Finding Real Images ===\n');
  
  try {
    // List all image files in the bucket (common image extensions)
    const { data: files, error: filesError } = await supabase
      .storage
      .from('cars-photos')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
        
    if (filesError) {
      console.error('Error listing files:', filesError);
      return;
    }
    
    // Filter for actual image files
    const imageFiles = files.filter(file => {
      const name = file.name.toLowerCase();
      return name.endsWith('.jpg') || name.endsWith('.jpeg') || 
             name.endsWith('.png') || name.endsWith('.gif') || 
             name.endsWith('.webp');
    });
    
    console.log(`Found ${imageFiles.length} actual image files:`);
    imageFiles.forEach(file => {
      console.log(`  - ${file.name}`);
    });
    
    // Check if any cars reference these files
    if (imageFiles.length > 0) {
      console.log('\nChecking if any cars reference these images...');
      
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id, title, image_urls')
        .not('image_urls', 'is', null);
        
      if (carsError) {
        console.error('Error fetching cars:', carsError);
        return;
      }
      
      console.log(`Found ${cars.length} cars with image URLs:`);
      
      // Check each car's image URLs
      for (const car of cars) {
        if (car.image_urls && car.image_urls.length > 0) {
          const matchingImages = car.image_urls.filter(url => {
            return imageFiles.some(file => url.includes(file.name));
          });
          
          if (matchingImages.length > 0) {
            console.log(`\nCar: ${car.title} (${car.id})`);
            matchingImages.forEach((url, index) => {
              console.log(`  Image ${index + 1}: ${url}`);
            });
          }
        }
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

findRealImages();