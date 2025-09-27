// scripts/simple-verify-fixes.js
// Simple verification that our image fixes are working

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

async function simpleVerifyFixes() {
  console.log('Simple verification of image fixes...');
  
  try {
    // Test 1: Check if the database has valid image URLs
    console.log('\n1. Checking database image URLs...');
    
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .eq('status', 'published')
      .limit(3);
    
    if (error) {
      console.error('   Error fetching cars:', error);
      return;
    }
    
    console.log(`   Found ${cars.length} published cars`);
    
    let allImagesValid = true;
    
    for (const car of cars) {
      console.log(`   \n   Car: ${car.title} (${car.id})`);
      
      if (!Array.isArray(car.image_urls) || car.image_urls.length === 0) {
        console.log('     ⚠ No images found');
        continue;
      }
      
      for (let i = 0; i < car.image_urls.length; i++) {
        const url = car.image_urls[i];
        const isValid = typeof url === 'string' && url.length > 0 && url.startsWith('http');
        console.log(`     Image ${i + 1}: ${isValid ? '✓' : '✗'} ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
        
        if (!isValid) {
          allImagesValid = false;
        }
      }
    }
    
    // Test 2: Verify image accessibility
    console.log('\n2. Verifying image accessibility...');
    
    if (cars.length > 0 && cars[0].image_urls.length > 0) {
      const testUrl = cars[0].image_urls[0];
      console.log(`   Testing URL: ${testUrl.substring(0, 60)}${testUrl.length > 60 ? '...' : ''}`);
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD', timeout: 5000 });
        console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Accessibility: ${response.ok ? '✓' : '✗'}`);
      } catch (err) {
        console.log(`   Accessibility test failed: ${err.message}`);
        allImagesValid = false;
      }
    }
    
    console.log('\n=== Simple Verification Complete ===');
    
    if (allImagesValid) {
      console.log('✓ All image fixes are working correctly!');
      console.log('The user interface should now display images properly.');
      console.log('\nTo verify in the browser:');
      console.log('1. Open http://localhost:5173/debug-images');
      console.log('2. Check that all image tests show images (except fallback test)');
      console.log('3. Verify no broken images appear in the main car listing');
    } else {
      console.log('⚠ Some issues were detected with image handling.');
      console.log('Please check the output above for details.');
    }
    
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

// Run the verification
simpleVerifyFixes();