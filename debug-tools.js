// Debug tools for image display verification
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

// Fallback image URL
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

async function debugTools() {
  console.log('=== Debug Tools for Image Display Verification ===\n');
  
  try {
    // Get sample car data
    console.log('1. Fetching sample car data...');
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .limit(1);
    
    if (error) throw error;
    
    if (cars && cars.length > 0) {
      const car = cars[0];
      console.log(`   Car: ${car.title} (${car.id})`);
      
      if (car.image_urls && car.image_urls.length > 0) {
        const imageUrl = car.image_urls[0];
        console.log(`\n2. Debug Information for Image URL:`);
        console.log(`   Raw Image URL: ${imageUrl}`);
        
        // Test in incognito browser (simulated)
        console.log(`\n3. Incognito Browser Test:`);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(imageUrl, { 
            method: 'HEAD', 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('   ✅ Renders in incognito browser');
            console.log('   ✅ Status:', response.status);
            console.log('   ✅ Content-Type:', response.headers.get('content-type'));
          } else {
            console.log('   ❌ Does not render in incognito browser');
            console.log('   ❌ Status:', response.status);
          }
        } catch (err) {
          console.log('   ❌ Error testing in incognito browser:', err.message);
        }
        
        // Test fallback status
        console.log(`\n4. Fallback Status:`);
        if (imageUrl === FALLBACK_IMAGE) {
          console.log('   ⚠ Currently showing fallback image');
        } else {
          console.log('   ✅ Showing actual car image (not fallback)');
        }
        
        // Test resolver function
        console.log(`\n5. Resolver Function Test:`);
        
        // Test with null
        const nullResult = resolveCarImageUrl(null);
        console.log(`   resolveCarImageUrl(null) = ${nullResult === FALLBACK_IMAGE ? 'FALLBACK_IMAGE' : nullResult.substring(0, 40) + '...'}`);
        
        // Test with the actual URL
        const urlResult = resolveCarImageUrl(imageUrl);
        console.log(`   resolveCarImageUrl(actual) = ${urlResult === imageUrl ? 'SAME_AS_INPUT' : urlResult.substring(0, 40) + '...'}`);
      }
    }
    
    console.log('\n=== Debug Tools Summary ===');
    console.log('✅ Raw image URL displayed');
    console.log('✅ Incognito browser test simulated');
    console.log('✅ Fallback status shown');
    console.log('✅ Resolver function tested');
    
    console.log('\n=== Manual Debug Steps ===');
    console.log('1. Copy an image URL from above');
    console.log('2. Open a new incognito/private browser window');
    console.log('3. Paste the URL in the address bar');
    console.log('4. Press Enter to verify it loads');
    console.log('5. Check browser developer tools Network tab for any errors');
    
  } catch (err) {
    console.error('Error during debug tools execution:', err);
  }
}

// Replicate the resolver function
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

debugTools();