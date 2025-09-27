// Check image URLs in database
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

async function checkImageUrls() {
  console.log('=== Database Image URL Check ===');
  
  try {
    // Fetch cars with image URLs
    console.log('1. Fetching cars with image URLs...');
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .limit(3);
    
    if (error) {
      console.error('❌ Error fetching cars:', error);
      return;
    }
    
    console.log(`✅ Found ${cars.length} cars with image URLs`);
    
    // Check each car's image URLs
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n--- Car ${i + 1}: ${car.title} (${car.id}) ---`);
      
      if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        console.log(`Found ${car.image_urls.length} image URL(s):`);
        
        for (let j = 0; j < car.image_urls.length; j++) {
          const url = car.image_urls[j];
          console.log(`\n  Image ${j + 1}:`);
          console.log(`    URL: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
          
          // Check if it's a valid URL format
          try {
            new URL(url);
            console.log('    ✅ Valid URL format');
          } catch (err) {
            console.log('    ❌ Invalid URL format');
            continue;
          }
          
          // Test accessibility
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              method: 'HEAD', 
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`    ✅ Accessible (Status: ${response.status})`);
              console.log(`    ✅ Content-Type: ${response.headers.get('content-type')}`);
            } else {
              console.log(`    ❌ Not accessible (Status: ${response.status})`);
              
              // Try to generate a new public URL if this is a storage path
              if (!url.startsWith('http')) {
                console.log('    🔄 Attempting to generate new public URL...');
                const { data: publicUrlData } = supabase.storage.from('cars-photos').getPublicUrl(url);
                if (publicUrlData?.publicUrl) {
                  console.log(`    🆕 New URL: ${publicUrlData.publicUrl}`);
                  
                  // Test the new URL
                  try {
                    const controller2 = new AbortController();
                    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
                    
                    const response2 = await fetch(publicUrlData.publicUrl, { 
                      method: 'HEAD', 
                      signal: controller2.signal 
                    });
                    
                    clearTimeout(timeoutId2);
                    
                    if (response2.ok) {
                      console.log(`    ✅ New URL accessible (Status: ${response2.status})`);
                    } else {
                      console.log(`    ❌ New URL not accessible (Status: ${response2.status})`);
                    }
                  } catch (err) {
                    console.log(`    ❌ Error testing new URL: ${err.message}`);
                  }
                }
              }
            }
          } catch (err) {
            console.log(`    ❌ Error testing accessibility: ${err.message}`);
          }
        }
      } else {
        console.log('  ❌ No valid image URLs found');
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ Image URLs are stored in database');
    console.log('⚠ Some URLs may not be accessible due to bucket policy issues');
    console.log('📋 Manual actions needed:');
    console.log('   1. Check Supabase Storage bucket policy for public read access');
    console.log('   2. Verify CORS settings allow all domains');
    console.log('   3. Re-upload any inaccessible images');
    
  } catch (err) {
    console.error('Error during image URL check:', err);
  }
}

checkImageUrls();