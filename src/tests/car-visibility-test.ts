import { supabase } from '@/integrations/supabase/client';

async function testCarVisibility() {
  console.log('Testing car creation and visibility...');
  
  // Test data for a new car
  const testCar = {
    title: 'Test Car for Visibility Check',
    make: 'Toyota',
    model: 'Corolla',
    year: 2023,
    seats: 5,
    fuel_type: 'petrol',
    transmission: 'automatic',
    price_per_day: 3500,
    price_in_paise: 350000, // 3500 INR in paise
    currency: 'INR',
    description: 'Test car for visibility verification',
    location_city: 'Test City',
    status: 'published',
    image_urls: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800']
  };

  try {
    // Insert a test car as admin
    console.log('Inserting test car...');
    const { data: insertedCar, error: insertError } = await supabase
      .from('cars')
      .insert(testCar)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert test car:', insertError);
      return;
    }

    console.log('Test car inserted successfully:', insertedCar);

    // Query published cars as public user
    console.log('Querying published cars...');
    const { data: publishedCars, error: queryError } = await supabase
      .from('cars')
      .select('*')
      .eq('status', 'published');

    if (queryError) {
      console.error('Failed to query published cars:', queryError);
      return;
    }

    // Check if our test car is in the results
    const testCarInResults = publishedCars.find(car => car.id === insertedCar.id);
    
    if (testCarInResults) {
      console.log('✅ SUCCESS: Test car is visible in published cars list');
      console.log('Car details:', {
        id: testCarInResults.id,
        title: testCarInResults.title,
        price_per_day: testCarInResults.price_per_day,
        price_in_paise: testCarInResults.price_in_paise,
        currency: testCarInResults.currency,
        status: testCarInResults.status
      });
    } else {
      console.log('❌ FAILURE: Test car is NOT visible in published cars list');
      console.log('Published cars count:', publishedCars.length);
    }

    // Clean up - delete the test car
    console.log('Cleaning up test car...');
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', insertedCar.id);

    if (deleteError) {
      console.error('Failed to delete test car:', deleteError);
    } else {
      console.log('Test car deleted successfully');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testCarVisibility();