// scripts/comprehensive-image-test.js
// Comprehensive test to verify image handling fixes

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

async function runComprehensiveImageTest() {
  console.log('Running comprehensive image test...');
  
  try {
    // Test 1: Check image utility functions
    console.log('\n1. Testing image utility functions...');
    
    // Import the image utility functions
    const imageUtils = await import('../src/utils/imageUtils.js');
    
    // Test getPublicOrSignedUrl
    const testResult1 = imageUtils.getPublicOrSignedUrl('https://example.com/image.jpg');
    console.log('   getPublicOrSignedUrl with full URL:', testResult1 === 'https://example.com/image.jpg' ? '✓' : '✗');
    
    const testResult2 = imageUtils.getPublicOrSignedUrl('cars/test/image.jpg');
    console.log('   getPublicOrSignedUrl with path:', testResult2 ? '✓' : '✗');
    
    // Test resolveCarImageUrls
    const testCar = {
      id: 'test-1',
      title: 'Test Car',
      image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
    };
    
    const resolvedCar = imageUtils.resolveCarImageUrls(testCar);
    console.log('   resolveCarImageUrls with existing URLs:', resolvedCar === testCar ? '✓' : '✗');
    
    const testCar2 = {
      id: 'test-2',
      title: 'Test Car 2',
      image_paths: ['cars/test/image1.jpg', 'cars/test/image2.jpg']
    };
    
    const resolvedCar2 = imageUtils.resolveCarImageUrls(testCar2);
    console.log('   resolveCarImageUrls with image_paths:', Array.isArray(resolvedCar2.image_urls) && resolvedCar2.image_urls.length === 2 ? '✓' : '✗');
    
    // Test 2: Check database image URLs
    console.log('\n2. Checking database image URLs...');
    
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .limit(3);
    
    if (error) {
      console.error('   Error fetching cars:', error);
      return;
    }
    
    console.log(`   Found ${cars.length} cars in database`);
    
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
      }
    }
    
    // Test 3: Verify image accessibility
    console.log('\n3. Verifying image accessibility...');
    
    if (cars.length > 0 && cars[0].image_urls.length > 0) {
      const testUrl = cars[0].image_urls[0];
      console.log(`   Testing URL: ${testUrl.substring(0, 60)}${testUrl.length > 60 ? '...' : ''}`);
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Accessibility: ${response.ok ? '✓' : '✗'}`);
      } catch (err) {
        console.log(`   Accessibility test failed: ${err.message}`);
      }
    }
    
    console.log('\n=== Comprehensive Image Test Complete ===');
    console.log('If all tests show ✓, the image display issue should be resolved.');
    
  } catch (err) {
    console.error('Error during comprehensive test:', err);
  }
}

// Run the test
runComprehensiveImageTest();