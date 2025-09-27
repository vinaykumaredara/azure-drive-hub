import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findBrokenImages() {
  console.log('=== Finding Cars with Potentially Broken Images ===\n');
  
  try {
    // Get all cars with image URLs
    const { data: cars, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id, title, image_urls, status, created_at')
      .not('image_urls', 'is', null)
      .order('created_at', { ascending: false });
      
    if (carsError) {
      console.error('Error fetching cars:', carsError);
      return;
    }
    
    console.log(`Found ${cars.length} cars with image URLs:`);
    
    let brokenCount = 0;
    
    for (const car of cars) {
      if (car.image_urls && car.image_urls.length > 0) {
        for (let i = 0; i < car.image_urls.length; i++) {
          const url = car.image_urls[i];
          
          // Skip placeholder images
          const isPlaceholder = url.includes('unsplash.com') || url.includes('placeholder');
          if (isPlaceholder) continue;
          
          // Test access to the image
          try {
            const response = await fetch(url, { 
              method: 'HEAD',
              timeout: 5000 // 5 second timeout
            });
            
            if (response.status !== 200) {
              console.log(`\n⚠️  Broken Image Found:`);
              console.log(`   Car: ${car.title} (${car.id})`);
              console.log(`   Image URL: ${url}`);
              console.log(`   Status: ${response.status} ${response.statusText}`);
              brokenCount++;
            }
          } catch (accessError) {
            console.log(`\n⚠️  Inaccessible Image Found:`);
            console.log(`   Car: ${car.title} (${car.id})`);
            console.log(`   Image URL: ${url}`);
            console.log(`   Error: ${accessError.message}`);
            brokenCount++;
          }
        }
      }
    }
    
    console.log(`\n=== Scan Complete ===`);
    console.log(`Found ${brokenCount} potentially broken images`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

findBrokenImages();