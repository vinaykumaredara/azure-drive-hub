// scripts/repair-image-urls.js
// Repair script to fix image URLs in the database

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

// Add validation function
async function validateUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return response.ok && response.headers.get('content-type')?.startsWith('image');
  } catch {
    return false;
  }
}

async function repairImageUrls() {
  console.log('Repairing image URLs in database...');
  
  try {
    // Fetch all cars with image_urls
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, image_urls');
    
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log(`Found ${cars.length} cars to process`);
    
    let updatedCount = 0;
    
    // In the repair loop, add validation:
    for (const car of cars) {
      let updated = false;
      let newImageUrls = [];
      
      if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        for (const url of car.image_urls) {
          if (typeof url === 'string' && url.startsWith('http')) {
            // Validate existing full URLs
            const isValid = await validateUrl(url);
            if (isValid) {
              newImageUrls.push(url);
            } else {
              // Convert invalid URL to new public URL
              const fileName = url.split('/').pop();
              if (fileName) {
                const { data } = supabase.storage.from('cars-photos').getPublicUrl(fileName);
                newImageUrls.push(data?.publicUrl || url);
              }
            }
          } else if (typeof url === 'string' && url.length > 0) {
            // Convert relative paths to public URLs
            const { data } = supabase.storage.from('cars-photos').getPublicUrl(url);
            newImageUrls.push(data?.publicUrl || url);
          }
        }

        if (JSON.stringify(car.image_urls) !== JSON.stringify(newImageUrls)) {
          updated = true;
        }
      }
      
      // Update the car if needed
      if (updated) {
        const { error: updateError } = await supabase
          .from('cars')
          .update({ image_urls: newImageUrls })
          .eq('id', car.id);
        
        if (updateError) {
          console.error(`Error updating car ${car.id}:`, updateError);
        } else {
          console.log(`Updated car ${car.id} with ${newImageUrls.length} image URLs`);
          updatedCount++;
        }
      }
    }
    
    console.log(`Repair complete. Updated ${updatedCount} cars.`);
  } catch (err) {
    console.error('Error during repair:', err);
  }
}

// Run the repair
repairImageUrls();