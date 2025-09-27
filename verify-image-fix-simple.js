// Simple script to verify image fixes
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

async function verifyImageFix() {
  console.log('=== Image Fix Verification ===\n');
  
  try {
    // 1. Check a sample car's image URLs
    console.log('1. Checking sample car image URLs...');
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
    console.log(`Car: ${car.title} (${car.id})`);
    console.log('Image URLs:', car.image_urls);
    
    // 2. Test URL accessibility
    console.log('\n2. Testing URL accessibility...');
    if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
      for (let i = 0; i < Math.min(car.image_urls.length, 3); i++) { // Test first 3 images
        const url = car.image_urls[i];
        console.log(`Testing image ${i + 1}: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
        
        try {
          // Test if URL is accessible
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
          }
        } catch (err) {
          console.log(`  ✗ Error accessing URL: ${err.message}`);
        }
      }
    }
    
    // 3. Test resolver function
    console.log('\n3. Testing resolver function...');
    
    const testCases = [
      null,
      '',
      'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
      'cars/test-image.jpg'
    ];
    
    testCases.forEach((testCase, index) => {
      try {
        const result = resolveCarImageUrl(testCase);
        console.log(`  Test ${index + 1}: ${JSON.stringify(testCase)} -> ${result.substring(0, 60)}${result.length > 60 ? '...' : ''}`);
      } catch (err) {
        console.error(`  Test ${index + 1} failed:`, err.message);
      }
    });
    
    console.log('\n=== Verification Complete ===');
    console.log('If all tests pass, the image display should work correctly in both admin and user interfaces.');
    
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyImageFix();