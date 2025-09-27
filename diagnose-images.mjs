// Diagnostic script to check car image data in the database
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseCars() {
  try {
    console.log('\n=== Fetching cars from database ===');
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls, created_at')
      .limit(5);

    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }

    console.log(`Found ${cars.length} cars:`);
    cars.forEach((car, index) => {
      console.log(`\n--- Car ${index + 1} ---`);
      console.log('ID:', car.id);
      console.log('Title:', car.title);
      console.log('Created:', car.created_at);
      console.log('Image URLs:', car.image_urls);
      
      if (car.image_urls && car.image_urls.length > 0) {
        car.image_urls.forEach((url, urlIndex) => {
          console.log(`  URL ${urlIndex + 1}: ${url}`);
          // Check if it's a full URL or just a path
          if (url.startsWith('http')) {
            console.log('    Type: Full URL');
          } else {
            console.log('    Type: File path');
          }
        });
      } else {
        console.log('  No images found');
      }
    });

    console.log('\n=== Checking storage bucket ===');
    // Try to list objects in the cars-photos bucket
    const { data: objects, error: storageError } = await supabase
      .storage
      .from('cars-photos')
      .list('', { limit: 5 });

    if (storageError) {
      console.error('Error listing storage objects:', storageError);
    } else {
      console.log('Storage objects found:', objects?.length || 0);
      if (objects && objects.length > 0) {
        objects.forEach((obj, index) => {
          console.log(`  Object ${index + 1}: ${obj.name}`);
        });
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

diagnoseCars();