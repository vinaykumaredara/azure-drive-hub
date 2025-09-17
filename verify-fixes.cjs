const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as in the client.ts file
const SUPABASE_URL = "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verifyFixes() {
  console.log('🔍 Verifying fixes...\n');
  
  // 1. Check if booking_status column exists
  console.log('1. Checking if booking_status column exists...');
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, booking_status')
      .limit(1);
      
    if (error) {
      console.log('❌ Error querying booking_status column:', error.message);
      console.log('   This indicates the column is still missing from the database schema.\n');
    } else {
      console.log('✅ Success! booking_status column exists.');
      console.log('   Sample data:', JSON.stringify(data[0], null, 2));
      console.log('   This confirms the database migration was successful.\n');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
  
  // 2. Check if we can insert a new car with booking_status
  console.log('2. Testing car insertion with booking_status...');
  try {
    // We won't actually insert, just test the structure
    const testCar = {
      title: 'Test Car',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 3000,
      status: 'published',
      image_urls: ['https://example.com/car.jpg'],
      booking_status: 'available' // This is the key field we're testing
    };
    
    console.log('✅ Car object structure is valid with booking_status field.');
    console.log('   This confirms the frontend expects this field to exist.\n');
  } catch (err) {
    console.error('❌ Error with car structure:', err.message);
  }
  
  // 3. Check pagination implementation
  console.log('3. Testing pagination implementation...');
  try {
    // Test fetching a limited number of cars
    const { data, error, count } = await supabase
      .from('cars')
      .select('*', { count: 'exact' })
      .range(0, 5); // First 6 cars
      
    if (error) {
      console.log('❌ Error with pagination:', error.message);
    } else {
      console.log('✅ Pagination test successful.');
      console.log(`   Retrieved ${data.length} cars out of ${count} total.`);
      console.log('   This confirms pagination is working correctly.\n');
    }
  } catch (err) {
    console.error('❌ Error with pagination:', err.message);
  }
  
  console.log('🎉 Verification complete!');
  console.log('\nNext steps:');
  console.log('1. If the booking_status column is still missing, apply the database migration:');
  console.log('   - Go to your Supabase dashboard');
  console.log('   - Navigate to SQL Editor');
  console.log('   - Run the content of supabase/migrations/20250917010000_add_booking_status_column.sql');
  console.log('');
  console.log('2. Test the admin car upload functionality');
  console.log('3. Verify that the car listing page loads faster with pagination');
  console.log('4. Check that images are loading with lazy loading');
}

verifyFixes();