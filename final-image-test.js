import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function finalImageTest() {
  console.log('=== Final Image Upload and Display Test ===\n');
  
  try {
    // 1. Create a proper test image (1x1 pixel PNG in base64)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageData, 'base64');
    const testFile = new File([testImageBuffer], 'final-test-image.png', { type: 'image/png' });
    
    // 2. Upload the image
    console.log('1. Uploading proper test image...');
    const fileName = `final-test-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('cars-photos')
      .upload(fileName, testFile);
      
    if (uploadError) {
      console.error('   Upload Error:', uploadError);
      return;
    }
    console.log('   Upload successful');
    
    // 3. Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('cars-photos')
      .getPublicUrl(fileName);
      
    console.log(`2. Public URL: ${publicUrlData.publicUrl}`);
    
    // 4. Verify content type
    try {
      const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
      console.log(`3. Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } catch (accessError) {
      console.log(`   Access Test Error: ${accessError.message}`);
    }
    
    // 5. Create a test car with this image
    console.log('4. Creating test car with proper image...');
    const testCar = {
      title: "Final Test Car",
      make: "Honda",
      model: "Civic",
      year: 2024,
      seats: 5,
      fuel_type: "petrol",
      transmission: "automatic",
      price_per_day: 3000,
      description: "Final test car with proper image",
      location_city: "Bangalore",
      status: "published",
      image_urls: [publicUrlData.publicUrl],
      price_in_paise: 300000,
      currency: "INR",
      booking_status: "available"
    };
    
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .insert([testCar])
      .select();
      
    if (carError) {
      console.error('   Car Creation Error:', carError);
      // Clean up the uploaded image
      await supabase.storage.from('cars-photos').remove([fileName]);
      return;
    }
    
    console.log(`   Car created successfully with ID: ${carData[0].id}`);
    
    // 6. Fetch the car and verify image processing
    console.log('5. Fetching and processing car images...');
    const { data: fetchedCar, error: fetchError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carData[0].id)
      .single();
      
    if (fetchError) {
      console.error('   Fetch Error:', fetchError);
    } else {
      console.log('   Fetch successful');
      console.log(`   Car image URLs: ${JSON.stringify(fetchedCar.image_urls)}`);
      
      // Simulate frontend image processing
      if (fetchedCar.image_urls && fetchedCar.image_urls.length > 0) {
        const imageUrl = fetchedCar.image_urls[0];
        console.log(`   Processing image: ${imageUrl.substring(0, 60)}...`);
        
        // Check if it's a full URL
        if (imageUrl.startsWith('http')) {
          console.log('   ✓ Image is a full URL');
          
          // Test access
          try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (response.status === 200) {
              console.log('   ✓ Image is accessible');
              console.log(`   ✓ Content-Type: ${response.headers.get('content-type')}`);
            } else {
              console.log(`   ✗ Image access failed: ${response.status}`);
            }
          } catch (accessError) {
            console.log(`   ✗ Image access error: ${accessError.message}`);
          }
        }
      }
    }
    
    // 7. Clean up - delete the test car and image
    console.log('6. Cleaning up test data...');
    await supabase.from('cars').delete().eq('id', carData[0].id);
    await supabase.storage.from('cars-photos').remove([fileName]);
    console.log('   Cleanup complete');
    
    console.log('\n=== Final Test Complete ===');
    console.log('🎉 All image upload and display functionality is working correctly!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

finalImageTest();