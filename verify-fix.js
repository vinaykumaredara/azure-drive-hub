// Script to verify that the image columns fix worked
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFix() {
  try {
    console.log('Verifying image columns fix...');
    
    // Try to fetch a car with the image columns
    console.log('Testing query with image columns...');
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, image_paths, image_urls')
      .limit(1);

    if (error) {
      console.error('❌ Query failed:', error.message);
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n🔧 SOLUTION: Run the SQL migration in add-image-columns.sql');
        console.log('   Or run this SQL directly in your Supabase SQL Editor:');
        console.log('   ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_paths text[] DEFAULT ARRAY[]::text[], ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];');
      }
      return;
    }

    console.log('✅ Query succeeded! The image columns exist in the database.');
    console.log('Sample data:', JSON.stringify(data, null, 2));
    
    // Try to fetch all cars (like the user dashboard does)
    console.log('\nTesting full car listing query...');
    const { data: allCars, error: allCarsError } = await supabase
      .from('cars')
      .select(`
        id,
        title,
        make,
        model,
        year,
        seats,
        fuel_type,
        transmission,
        price_per_day,
        price_per_hour,
        description,
        location_city,
        status,
        image_urls,
        image_paths,
        created_at,
        price_in_paise,
        currency,
        booking_status,
        booked_by,
        booked_at
      `)
      .eq('status', 'published')
      .limit(5);

    if (allCarsError) {
      console.error('❌ Full car listing query failed:', allCarsError.message);
      return;
    }

    console.log('✅ Full car listing query succeeded!');
    console.log(`Found ${allCars.length} cars`);
    
    if (allCars.length > 0) {
      console.log('Sample car:', JSON.stringify(allCars[0], null, 2));
    }
    
    console.log('\n🎉 USER DASHBOARD SHOULD NOW WORK CORRECTLY!');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verifyFix();