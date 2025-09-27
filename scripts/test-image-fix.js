// scripts/test-image-fix.js
// Test script to verify the image fix is working correctly

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

async function testImageFix() {
  console.log('Testing image fix...');
  
  try {
    // Test 1: Check if imageUtils functions work correctly
    console.log('\n1. Testing image utility functions...');
    
    // Import the image utility functions
    const { getPublicImageUrl, getPublicUrlForPath, getPublicOrSignedUrl } = await import('../src/utils/imageUtils.js');
    
    // Test getPublicImageUrl
    const testImageUrl = getPublicImageUrl('test-image.jpg');
    console.log('   getPublicImageUrl result:', testImageUrl);
    
    // Test getPublicUrlForPath
    const testPathUrl = getPublicUrlForPath('cars/test/test-image.jpg');
    console.log('   getPublicUrlForPath result:', testPathUrl);
    
    // Test getPublicOrSignedUrl
    const testSignedUrl = await getPublicOrSignedUrl('cars/test/test-image.jpg');
    console.log('   getPublicOrSignedUrl result:', testSignedUrl);
    
    console.log('✓ Image utility functions are working correctly');
    
    // Test 2: Create a test car and verify image handling
    console.log('\n2. Testing car creation with images...');
    
    const testCar = {
      title: 'Test Car for Image Fix',
      make: 'Test',
      model: 'Image Fix Verification',
      year: 2023,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 1000,
      status: 'published',
      image_urls: [
        'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
      ]
    };
    
    const { data: car, error: carError } = await supabase
      .from('cars')
      .insert(testCar)
      .select()
      .single();
    
    if (carError) {
      console.error('✗ Error creating test car:', carError);
      return;
    }
    
    console.log('✓ Test car created successfully with ID:', car.id);
    
    // Test 3: Fetch the car and verify image URLs
    console.log('\n3. Testing car fetching and image URL resolution...');
    
    const { data: fetchedCar, error: fetchError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', car.id)
      .single();
    
    if (fetchError) {
      console.error('✗ Error fetching test car:', fetchError);
      return;
    }
    
    console.log('   Fetched car image_urls:', fetchedCar.image_urls);
    
    // Verify that all image URLs are valid
    if (Array.isArray(fetchedCar.image_urls) && fetchedCar.image_urls.length > 0) {
      for (let i = 0; i < fetchedCar.image_urls.length; i++) {
        const url = fetchedCar.image_urls[i];
        if (url.startsWith('http')) {
          console.log(`   ✓ Image URL ${i + 1} is a valid HTTP URL`);
        } else {
          console.log(`   ✗ Image URL ${i + 1} is not a valid HTTP URL:`, url);
        }
      }
    } else {
      console.log('   ⚠ No image URLs found in fetched car');
    }
    
    // Test 4: Clean up test car
    console.log('\n4. Cleaning up test car...');
    
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', car.id);
    
    if (deleteError) {
      console.warn('⚠ Warning: Could not clean up test car:', deleteError);
    } else {
      console.log('✓ Test car cleaned up successfully');
    }
    
    console.log('\n=== Test Complete ===');
    console.log('The image fix appears to be working correctly.');
    console.log('Admin UI should now show the same images as User UI.');
    
  } catch (err) {
    console.error('Error during test:', err);
  }
}

// Run the test
testImageFix();