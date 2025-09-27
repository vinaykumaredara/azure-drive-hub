import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyImageUrls() {
  console.log('=== RP Cars - Image URL Verification ===\n');
  
  try {
    // Fetch a sample of cars with image_urls
    const { data: cars, error: fetchError } = await supabase
      .from('cars')
      .select('id, title, image_urls, created_at')
      .not('image_urls', 'is', null)
      .limit(5);
      
    if (fetchError) {
      console.error('Error fetching cars:', fetchError);
      return;
    }
    
    console.log(`Found ${cars.length} cars with image URLs\n`);
    
    for (const car of cars) {
      console.log(`Car: ${car.title} (${car.id})`);
      console.log(`Created: ${car.created_at}`);
      
      if (!car.image_urls || car.image_urls.length === 0) {
        console.log('  No images\n');
        continue;
      }
      
      for (let i = 0; i < car.image_urls.length; i++) {
        const url = car.image_urls[i];
        console.log(`  Image ${i + 1}:`);
        console.log(`    URL: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        
        // Determine URL type
        const isPlaceholder = url.includes('unsplash.com') || url.includes('placeholder');
        const isSupabaseUrl = url.includes('.supabase.co/storage/v1/object');
        
        console.log(`    Type: ${isPlaceholder ? 'Placeholder' : isSupabaseUrl ? 'Supabase Storage' : 'External'}`);
        
        // Test accessibility
        if (!isPlaceholder) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(url, { 
              method: 'HEAD',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 200) {
              console.log(`    Status: ✓ Accessible (200 OK)`);
            } else {
              console.log(`    Status: ✗ Inaccessible (${response.status} ${response.statusText})`);
            }
          } catch (error) {
            console.log(`    Status: ✗ Error (${error.name}: ${error.message})`);
          }
        } else {
          console.log(`    Status: ✓ Placeholder (no verification)`);
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('=== Verification Complete ===\n');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

verifyImageUrls();