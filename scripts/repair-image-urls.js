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
    
    for (const car of cars) {
      let updated = false;
      let newImageUrls = [];
      
      // Process image_urls array
      if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        newImageUrls = car.image_urls.map(url => {
          // If it's already a full URL, keep it
          if (typeof url === 'string' && url.startsWith('http')) {
            return url;
          }
          
          // If it's a file path, convert to public URL
          if (typeof url === 'string' && url.length > 0) {
            try {
              const { data } = supabase.storage
                .from('cars-photos')
                .getPublicUrl(url);
              return data?.publicUrl || url;
            } catch (err) {
              console.warn(`Failed to convert path to URL for car ${car.id}:`, url);
              return url;
            }
          }
          
          return url;
        });
        
        // Check if any URLs were changed
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