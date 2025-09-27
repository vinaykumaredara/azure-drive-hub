import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testImageFlow() {
  console.log('=== Testing Complete Image Flow ===\n');
  
  try {
    // 1. Create a simple test image (1x1 pixel PNG in base64)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageData, 'base64');
    const testFile = new File([testImageBuffer], 'flow-test-image.png', { type: 'image/png' });
    
    // 2. Upload the image
    console.log('1. Uploading test image...');
    const fileName = `flow-test-${Date.now()}.png`;
    
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
    
    // 4. Test if we can access the image
    try {
      const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
      console.log(`3. Access Test: ${response.status} ${response.statusText}`);
    } catch (accessError) {
      console.log(`   Access Test Error: ${accessError.message}`);
    }
    
    // 5. Create a test car with this image
    console.log('4. Creating test car with uploaded image...');
    const testCar = {
      title: "Flow Test Car",
      make: "Toyota",
      model: "Test Model",
      year: 2023,
      seats: 5,
      fuel_type: "petrol",
      transmission: "automatic",
      price_per_day: 2500,
      description: "Test car for image flow verification",
      location_city: "Hyderabad",
      status: "published",
      image_urls: [publicUrlData.publicUrl],
      price_in_paise: 250000,
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
    
    // 6. Fetch the car as admin
    console.log('5. Fetching car as admin...');
    const { data: adminCar, error: adminError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carData[0].id)
      .single();
      
    if (adminError) {
      console.error('   Admin Fetch Error:', adminError);
    } else {
      console.log('   Admin fetch successful');
      console.log(`   Admin car image URLs: ${JSON.stringify(adminCar.image_urls)}`);
    }
    
    // 7. Fetch the car as anonymous user
    console.log('6. Fetching car as anonymous user...');
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: anonCar, error: anonError } = await supabaseAnon
      .from('cars')
      .select('*')
      .eq('id', carData[0].id)
      .single();
      
    if (anonError) {
      console.error('   Anonymous Fetch Error:', anonError);
    } else {
      console.log('   Anonymous fetch successful');
      console.log(`   Anonymous car image URLs: ${JSON.stringify(anonCar.image_urls)}`);
      
      // Test accessing the image URL
      if (anonCar.image_urls && anonCar.image_urls.length > 0) {
        try {
          const response = await fetch(anonCar.image_urls[0], { method: 'HEAD' });
          console.log(`   Anonymous image access: ${response.status} ${response.statusText}`);
        } catch (accessError) {
          console.log(`   Anonymous image access error: ${accessError.message}`);
        }
      }
    }
    
    // 8. Clean up - delete the test car and image
    console.log('7. Cleaning up test data...');
    await supabase.from('cars').delete().eq('id', carData[0].id);
    await supabase.storage.from('cars-photos').remove([fileName]);
    console.log('   Cleanup complete');
    
    console.log('\n=== Test Complete ===');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testImageFlow();