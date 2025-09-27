// scripts/fix-image-urls.js
// Script to fix image URLs in the database by ensuring they are valid public URLs

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

async function validateAndFixImageUrls() {
  console.log('Starting image URL validation and fix process...');
  
  try {
    // Fetch all cars with image_urls
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null);
    
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log(`Found ${cars.length} cars with image URLs to process`);
    
    let fixedCount = 0;
    
    for (const car of cars) {
      let needsUpdate = false;
      let fixedImageUrls = [];
      
      // Check if image_urls is an array
      if (Array.isArray(car.image_urls)) {
        // Process each URL in the array
        for (const url of car.image_urls) {
          // If it's already a valid HTTP URL, keep it
          if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            fixedImageUrls.push(url);
          } 
          // If it's a relative path, convert it to a public URL
          else if (typeof url === 'string' && url.length > 0) {
            try {
              const { data } = supabase.storage.from('cars-photos').getPublicUrl(url);
              if (data?.publicUrl) {
                fixedImageUrls.push(data.publicUrl);
                needsUpdate = true;
                console.log(`Fixed URL for car ${car.title}: ${url} -> ${data.publicUrl}`);
              } else {
                console.warn(`Could not generate public URL for ${url} in car ${car.title}`);
              }
            } catch (err) {
              console.error(`Error generating public URL for ${url} in car ${car.title}:`, err);
            }
          }
        }
      } 
      // If image_urls is a string (legacy format), convert it to array
      else if (typeof car.image_urls === 'string') {
        try {
          const { data } = supabase.storage.from('cars-photos').getPublicUrl(car.image_urls);
          if (data?.publicUrl) {
            fixedImageUrls = [data.publicUrl];
            needsUpdate = true;
            console.log(`Converted string URL to array for car ${car.title}: ${car.image_urls} -> [${data.publicUrl}]`);
          }
        } catch (err) {
          console.error(`Error converting string URL for car ${car.title}:`, err);
        }
      }
      
      // Update the car if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('cars')
          .update({ 
            image_urls: fixedImageUrls,
            updated_at: new Date().toISOString()
          })
          .eq('id', car.id);
        
        if (updateError) {
          console.error(`Error updating car ${car.id} (${car.title}):`, updateError);
        } else {
          console.log(`Successfully updated car ${car.id} (${car.title}) with ${fixedImageUrls.length} image URLs`);
          fixedCount++;
        }
      }
    }
    
    console.log(`Fix process complete. Fixed ${fixedCount} cars.`);
  } catch (err) {
    console.error('Error during fix process:', err);
  }
}

// Run the fix process
validateAndFixImageUrls().then(() => {
  console.log('Image URL fix script completed.');
  process.exit(0);
}).catch((err) => {
  console.error('Image URL fix script failed:', err);
  process.exit(1);
});