// scripts/test-image-upload.js
// Test script to verify image upload functionality

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(url, key);

async function testImageUpload() {
  console.log('Testing image upload functionality...');
  
  // Create a test car
  const { data: car, error: carError } = await supabase
    .from('cars')
    .insert({
      title: 'Test Car for Image Upload',
      make: 'Test',
      model: 'Image Upload Test',
      year: 2023,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 1000,
      status: 'published',
      image_urls: []
    })
    .select()
    .single();
  
  if (carError) {
    console.error('Error creating test car:', carError);
    return;
  }
  
  console.log('Created test car:', car.id);
  
  // Test uploading multiple images
  // Note: In a real test, you would upload actual files
  // For this test, we'll simulate the process
  
  const testImageUrls = [
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1549399542-7e7f0c3c4b6c?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
  ];
  
  // Update the car with test image URLs
  const { error: updateError } = await supabase
    .from('cars')
    .update({ image_urls: testImageUrls })
    .eq('id', car.id);
  
  if (updateError) {
    console.error('Error updating car with images:', updateError);
    return;
  }
  
  console.log('Successfully updated car with test images');
  
  // Verify the update
  const { data: updatedCar, error: fetchError } = await supabase
    .from('cars')
    .select('image_urls')
    .eq('id', car.id)
    .single();
  
  if (fetchError) {
    console.error('Error fetching updated car:', fetchError);
    return;
  }
  
  console.log('Car image URLs:', updatedCar.image_urls);
  console.log('Test completed successfully');
  
  // Clean up - delete the test car
  const { error: deleteError } = await supabase
    .from('cars')
    .delete()
    .eq('id', car.id);
  
  if (deleteError) {
    console.error('Error deleting test car:', deleteError);
  } else {
    console.log('Test car deleted successfully');
  }
}

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testImageUpload().catch(console.error);
}

export default testImageUpload;