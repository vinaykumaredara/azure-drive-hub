// JavaScript version of repair-car-images.js
// Script to repair car image URLs in the database

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

// Simple resolver function (replicating the logic from carImageUtils.ts)
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

function resolveCarImageUrl(imagePath) {
  // Handle null/undefined/empty cases
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return FALLBACK_IMAGE;
  }

  // If it's already a full HTTP URL, return it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Otherwise, treat it as a storage path and generate a public URL
  try {
    const { data } = supabase.storage.from('cars-photos').getPublicUrl(imagePath);
    return data?.publicUrl ?? FALLBACK_IMAGE;
  } catch (error) {
    console.error('Error resolving car image URL:', error, imagePath);
    return FALLBACK_IMAGE;
  }
}

async function repairCarImages() {
  console.log('Starting car image repair process...');
  
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
    
    let repairedCount = 0;
    
    for (const car of cars) {
      try {
        let needsUpdate = false;
        let repairedImageUrls = [];
        
        // Check if image_urls is an array
        if (Array.isArray(car.image_urls)) {
          // Process each URL in the array using our unified resolver
          for (const url of car.image_urls) {
            const resolvedUrl = resolveCarImageUrl(url);
            repairedImageUrls.push(resolvedUrl);
            
            // Check if the URL was changed
            if (resolvedUrl !== url) {
              needsUpdate = true;
            }
          }
        } 
        // If image_urls is a string (legacy format), convert it to array
        else if (typeof car.image_urls === 'string') {
          const resolvedUrl = resolveCarImageUrl(car.image_urls);
          repairedImageUrls = [resolvedUrl];
          needsUpdate = true;
          console.log(`Converted string URL to array for car ${car.title}: ${car.image_urls} -> [${resolvedUrl}]`);
        }
        
        // Update the car if needed
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('cars')
            .update({ 
              image_urls: repairedImageUrls,
              updated_at: new Date().toISOString()
            })
            .eq('id', car.id);
          
          if (updateError) {
            console.error(`Error updating car ${car.id} (${car.title}):`, updateError);
          } else {
            console.log(`Successfully updated car ${car.id} (${car.title}) with ${repairedImageUrls.length} image URLs`);
            repairedCount++;
          }
        }
      } catch (err) {
        console.error(`Error processing car ${car.id} (${car.title}):`, err);
      }
    }
    
    console.log(`Repair process complete. Repaired ${repairedCount} cars.`);
  } catch (err) {
    console.error('Error during repair process:', err);
  }
}

// Run the repair process
repairCarImages().then(() => {
  console.log('Car image repair script completed.');
  process.exit(0);
}).catch((err) => {
  console.error('Car image repair script failed:', err);
  process.exit(1);
});