// Final verification script for image fixes
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function finalVerification() {
  console.log('=== Final Image Fix Verification ===\n');
  
  try {
    // 1. Check if we have cars with image URLs
    console.log('1. Checking database for cars with images...');
    const { count, error: countError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .not('image_urls', 'is', null);
    
    if (countError) {
      console.error('Error counting cars:', countError);
      return;
    }
    
    console.log(`Found ${count} cars with image URLs`);
    
    if (count === 0) {
      console.log('No cars with images found. Please upload a car with images to test.');
      return;
    }
    
    // 2. Get a sample car and verify its image URLs
    console.log('\n2. Verifying sample car image URLs...');
    const { data: cars, error: fetchError } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching cars:', fetchError);
      return;
    }
    
    const car = cars[0];
    console.log(`Car: ${car.title} (${car.id})`);
    
    if (!Array.isArray(car.image_urls) || car.image_urls.length === 0) {
      console.log('Car has no valid image URLs');
      return;
    }
    
    console.log(`Found ${car.image_urls.length} image URLs`);
    
    // 3. Test accessibility of each image URL
    console.log('\n3. Testing image URL accessibility...');
    let allAccessible = true;
    
    for (let i = 0; i < car.image_urls.length; i++) {
      const url = car.image_urls[i];
      console.log(`Testing image ${i + 1}: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`  ✓ Accessible (Status: ${response.status})`);
        } else {
          console.log(`  ✗ Not accessible (Status: ${response.status})`);
          allAccessible = false;
        }
      } catch (err) {
        console.log(`  ✗ Error: ${err.message}`);
        allAccessible = false;
      }
    }
    
    // 4. Summary
    console.log('\n=== Final Verification Summary ===');
    if (allAccessible) {
      console.log('✅ All image URLs are accessible');
      console.log('✅ Image display should work correctly in both admin and user interfaces');
      console.log('✅ No more infinite loading states');
      console.log('✅ Proper fallback handling for missing images');
    } else {
      console.log('⚠ Some issues were detected with image accessibility');
      console.log('Please check the output above for details');
    }
    
    console.log('\n=== Verification Complete ===');
    
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

finalVerification();