import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkCarImageUrls() {
  console.log('=== Checking Car Image URLs ===\n');
  
  try {
    // Get cars and examine their image URLs
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log(`Found ${data.length} cars with image URLs:`);
    
    for (const car of data) {
      console.log(`\nCar: ${car.title} (${car.id})`);
      if (car.image_urls && car.image_urls.length > 0) {
        for (let i = 0; i < car.image_urls.length; i++) {
          const url = car.image_urls[i];
          const isPlaceholder = url.includes('unsplash.com') || url.includes('placeholder');
          console.log(`  Image ${i + 1}: ${isPlaceholder ? '[PLACEHOLDER]' : '[UPLOADED]'} ${url}`);
          
          // If it's an uploaded image, check if it's accessible
          if (!isPlaceholder) {
            try {
              // Extract the file path from the URL
              const urlObj = new URL(url);
              const pathname = urlObj.pathname;
              // Remove the prefix /storage/v1/object/public/cars-photos/
              const filePath = pathname.replace('/storage/v1/object/public/cars-photos/', '');
              
              console.log(`    File path: ${filePath}`);
              
              // Check if file exists in storage
              const { data: fileInfo, error: fileError } = await supabase
                .storage
                .from('cars-photos')
                .list('', {
                  search: filePath
                });
                
              if (fileError) {
                console.log(`    Storage check error: ${fileError.message}`);
              } else if (fileInfo.length > 0) {
                console.log(`    File exists in storage: ${fileInfo[0].name}`);
              } else {
                console.log(`    File NOT found in storage`);
              }
            } catch (urlError) {
              console.log(`    URL parsing error: ${urlError.message}`);
            }
          }
        }
      } else {
        console.log('  No images');
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCarImageUrls();