import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkRealImages() {
  console.log('=== Checking for Cars with Real Images ===\n');
  
  try {
    // Get cars that might have real uploaded images (not placeholder URLs)
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log(`Found ${data.length} cars with image URLs:`);
    
    data.forEach((car, index) => {
      console.log(`\nCar ${index + 1}: ${car.title} (${car.id})`);
      if (car.image_urls && car.image_urls.length > 0) {
        car.image_urls.forEach((url, urlIndex) => {
          // Check if it's a placeholder URL or a real uploaded image
          const isPlaceholder = url.includes('unsplash.com') || url.includes('placeholder');
          console.log(`  Image ${urlIndex + 1}: ${isPlaceholder ? '[PLACEHOLDER]' : '[REAL UPLOAD]'} ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        });
      } else {
        console.log('  No images');
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkRealImages();