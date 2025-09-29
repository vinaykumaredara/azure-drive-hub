import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTestCar() {
  try {
    console.log('\n=== Creating Test Car ===');
    
    // Create a simple test image file
    const testContent = 'This is a test image file for car verification';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-car-image-${Date.now()}.txt`;
    
    console.log(`\n1. Uploading test image: ${testFileName}`);
    
    // Upload test image
    const { error: uploadError } = await supabase.storage
      .from('cars-photos')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }
    
    console.log('Upload successful');
    
    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('cars-photos')
      .getPublicUrl(testFileName);
    
    console.log('Public URL:', publicUrlData?.publicUrl || 'None');
    
    // Create test car data
    const testCar = {
      title: 'Test Car',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 2500,
      price_per_hour: 150,
      description: 'Test car for verification purposes',
      location_city: 'Hyderabad',
      status: 'published',
      image_urls: [publicUrlData.publicUrl],
      price_in_paise: 250000,
      currency: 'INR',
      booking_status: 'available'
    };
    
    console.log('\n2. Creating test car in database...');
    
    // Insert test car
    const { data: carData, error: insertError } = await supabase
      .from('cars')
      .insert([testCar])
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return;
    }
    
    console.log('Test car created successfully:', carData[0]);
    
    // Verify we can fetch the car
    console.log('\n3. Verifying car fetch...');
    const { data: fetchedCar, error: fetchError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carData[0].id)
      .single();
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return;
    }
    
    console.log('Fetched car:', fetchedCar);
    
    console.log('\n=== Test Complete ===');
    console.log('Test car ID:', fetchedCar.id);
    console.log('Test image URL:', fetchedCar.image_urls[0]);
    
  } catch (error) {
    console.error('Test car creation error:', error);
  }
}

createTestCar();

// Script to create a test car with images for debugging
import { createClient } from '@supabase/supabase-js';

async function createTestCar() {
  try {
    console.log('Creating test car...');
    
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a test car with image data
    const { data, error } = await supabase
      .from('cars')
      .insert([
        {
          title: 'Test Car for Debugging',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          seats: 5,
          fuel_type: 'petrol',
          transmission: 'automatic',
          price_per_day: 2500,
          status: 'published',
          image_urls: [
            'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
          ],
          image_paths: null,
          description: 'Test car for debugging image display issues'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating test car:', error);
      return;
    }

    console.log('Test car created successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestCar();
