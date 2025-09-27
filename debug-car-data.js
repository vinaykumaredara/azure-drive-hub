// Debug script to check car data and image URLs
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

async function debugCarData() {
  console.log('=== Debug Car Data ===\n');
  
  try {
    // 1. Check what's in the database
    console.log('1. Fetching cars from database...');
    const { data: dbCars, error: dbError } = await supabase
      .from('cars')
      .select('*');

    if (dbError) {
      console.error('Database error:', dbError);
      return;
    }

    console.log(`Found ${dbCars.length} cars in database:`);
    
    // 2. Check each car's image URLs
    for (let i = 0; i < dbCars.length; i++) {
      const car = dbCars[i];
      console.log(`\n--- Car ${i + 1}: ${car.title} (${car.id}) ---`);
      console.log(`Status: ${car.status}`);
      
      if (car.image_urls && Array.isArray(car.image_urls)) {
        console.log(`Image URLs (${car.image_urls.length}):`);
        for (let j = 0; j < car.image_urls.length; j++) {
          const url = car.image_urls[j];
          console.log(`  ${j + 1}. ${url}`);
          
          // Test if URL is accessible
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              method: 'HEAD', 
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`     ✓ Accessible (Status: ${response.status})`);
            } else {
              console.log(`     ✗ Not accessible (Status: ${response.status})`);
            }
          } catch (err) {
            console.log(`     ✗ Error: ${err.message}`);
          }
        }
      } else {
        console.log('No image URLs found');
      }
    }
    
    // 3. Check storage bucket
    console.log('\n2. Checking storage bucket...');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('cars-photos')
      .list('', { limit: 10 });

    if (storageError) {
      console.error('Storage error:', storageError);
    } else {
      console.log(`Found ${storageFiles.length} files in storage bucket:`);
      storageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
      });
    }
    
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugCarData();