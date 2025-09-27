// scripts/test-multi-upload.js
// Test script to verify multi-image upload functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testMultiImageUpload() {
  console.log('Testing multi-image upload functionality...');
  
  try {
    // Create a test car
    const { data: testCar, error: createError } = await supabase
      .from('cars')
      .insert({
        title: 'Multi-Image Test Car',
        make: 'Test',
        model: 'Multi-Image',
        year: 2023,
        seats: 5,
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        price_per_day: 3000,
        description: 'Test car for multi-image functionality',
        status: 'published',
        image_urls: [
          'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'
        ]
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create test car:', createError);
      return;
    }

    console.log('Created test car with ID:', testCar.id);
    console.log('Image URLs count:', testCar.image_urls.length);
    console.log('Image URLs:', testCar.image_urls);

    // Verify the car was created with multiple images
    if (testCar.image_urls.length === 3) {
      console.log('✅ SUCCESS: Car created with multiple images');
    } else {
      console.log('❌ FAILED: Car does not have expected number of images');
    }

    // Test updating the car with additional images
    const updatedImageUrls = [
      ...testCar.image_urls,
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800'
    ];

    const { error: updateError } = await supabase
      .from('cars')
      .update({ image_urls: updatedImageUrls })
      .eq('id', testCar.id);

    if (updateError) {
      console.error('Failed to update car with additional images:', updateError);
      return;
    }

    // Verify the update
    const { data: updatedCar, error: fetchError } = await supabase
      .from('cars')
      .select('image_urls')
      .eq('id', testCar.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch updated car:', fetchError);
      return;
    }

    console.log('Updated image URLs count:', updatedCar.image_urls.length);
    console.log('Updated image URLs:', updatedCar.image_urls);

    if (updatedCar.image_urls.length === 5) {
      console.log('✅ SUCCESS: Car updated with additional images');
    } else {
      console.log('❌ FAILED: Car does not have expected number of images after update');
    }

    // Clean up - delete the test car
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', testCar.id);

    if (deleteError) {
      console.error('Failed to delete test car:', deleteError);
    } else {
      console.log('✅ Cleaned up test car');
    }

    console.log('\n🎉 Multi-image upload test completed!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testMultiImageUpload();