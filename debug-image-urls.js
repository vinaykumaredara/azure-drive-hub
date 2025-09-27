// Debug script to check image URL resolution
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

// Simple resolver function (replicating the logic from carImageUtils.ts)
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

function resolveCarImageUrl(imagePath) {
  console.log("Resolving image path:", imagePath);
  
  // Handle null/undefined/empty cases
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.log("  -> Returning fallback (null/empty case)");
    return FALLBACK_IMAGE;
  }

  // If it's already a full HTTP URL, return it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log("  -> Returning as-is (already full URL)");
    return imagePath;
  }

  // Otherwise, treat it as a storage path and generate a public URL
  try {
    console.log("  -> Generating public URL from storage path");
    const { data } = supabase.storage.from('cars-photos').getPublicUrl(imagePath);
    const result = data?.publicUrl ?? FALLBACK_IMAGE;
    console.log("  -> Generated URL:", result);
    return result;
  } catch (error) {
    console.error('Error resolving car image URL:', error, imagePath);
    return FALLBACK_IMAGE;
  }
}

async function debugImageUrls() {
  console.log('=== Debugging Image URLs ===\n');
  
  try {
    // 1. Check a sample car's image URLs
    console.log('1. Fetching sample car image URLs...');
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .limit(1);
    
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    if (!cars || cars.length === 0) {
      console.log('No cars found with image URLs');
      return;
    }
    
    const car = cars[0];
    console.log(`\nCar: ${car.title} (${car.id})`);
    console.log('Raw image URLs from DB:', car.image_urls);
    
    // 2. Test resolution of each URL
    console.log('\n2. Resolving each image URL...');
    if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
      for (let i = 0; i < car.image_urls.length; i++) {
        const url = car.image_urls[i];
        console.log(`\nImage ${i + 1}:`);
        console.log(`  Raw URL: ${url}`);
        const resolvedUrl = resolveCarImageUrl(url);
        console.log(`  Resolved URL: ${resolvedUrl}`);
        
        // Test if URL is accessible
        try {
          console.log(`  Testing accessibility...`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(resolvedUrl, { 
            method: 'HEAD', 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`  ✓ Accessible (Status: ${response.status})`);
          } else {
            console.log(`  ✗ Not accessible (Status: ${response.status})`);
          }
        } catch (err) {
          console.log(`  ✗ Error accessing URL: ${err.message}`);
        }
      }
    }
    
    console.log('\n=== Debug Complete ===');
    
  } catch (err) {
    console.error('Error during debugging:', err);
  }
}

debugImageUrls();