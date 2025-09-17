// Script to verify the atomic booking implementation structure
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyStructure() {
  console.log('🔍 Verifying Atomic Booking Implementation Structure...\n');

  try {
    // 1. Check if required columns exist in cars table
    console.log('1. Checking cars table structure...');
    const { data: carsColumns, error: carsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'cars')
      .eq('table_schema', 'public')
      .in('column_name', ['booking_status', 'booked_by', 'booked_at', 'price_in_paise', 'currency']);

    if (carsError) throw carsError;

    const requiredCarColumns = ['booking_status', 'booked_by', 'booked_at', 'price_in_paise', 'currency'];
    const existingCarColumns = carsColumns.map(col => col.column_name);
    
    const missingCarColumns = requiredCarColumns.filter(col => !existingCarColumns.includes(col));
    
    if (missingCarColumns.length === 0) {
      console.log('   ✅ All required columns exist in cars table');
    } else {
      console.log('   ❌ Missing columns in cars table:', missingCarColumns);
    }

    // 2. Check if indexes exist
    console.log('\n2. Checking indexes...');
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('schemaname', 'public')
      .in('indexname', ['idx_cars_booking_status', 'idx_cars_booked_by', 'idx_cars_booked_at']);

    if (indexesError) throw indexesError;

    const requiredIndexes = ['idx_cars_booking_status', 'idx_cars_booked_by', 'idx_cars_booked_at'];
    const existingIndexes = indexes.map(idx => idx.indexname);
    
    const missingIndexes = requiredIndexes.filter(idx => !existingIndexes.includes(idx));
    
    if (missingIndexes.length === 0) {
      console.log('   ✅ All required indexes exist');
    } else {
      console.log('   ❌ Missing indexes:', missingIndexes);
    }

    // 3. Check if the function exists
    console.log('\n3. Checking for atomic booking function...');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'book_car_atomic');

    if (functionsError) throw functionsError;

    if (functions.length > 0) {
      console.log('   ✅ Atomic booking function exists');
    } else {
      console.log('   ❌ Atomic booking function does not exist');
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'cars')
      .in('policyname', ['cars_select_public', 'cars_modify_admin']);

    if (policiesError) throw policiesError;

    const requiredPolicies = ['cars_select_public', 'cars_modify_admin'];
    const existingPolicies = policies.map(policy => policy.policyname);
    
    const missingPolicies = requiredPolicies.filter(policy => !existingPolicies.includes(policy));
    
    if (missingPolicies.length === 0) {
      console.log('   ✅ All required RLS policies exist');
    } else {
      console.log('   ❌ Missing RLS policies:', missingPolicies);
    }

    // 5. Check sample data
    console.log('\n5. Checking sample data...');
    const { data: sampleCar, error: sampleError } = await supabase
      .from('cars')
      .select('id, title, booking_status, price_in_paise, currency')
      .limit(1)
      .single();

    if (sampleError) {
      console.log('   ⚠️  Could not fetch sample car data:', sampleError.message);
    } else if (sampleCar) {
      console.log('   ✅ Sample car data retrieved successfully');
      console.log('      - Car ID:', sampleCar.id);
      console.log('      - Title:', sampleCar.title);
      console.log('      - Booking Status:', sampleCar.booking_status || 'Not set');
      console.log('      - Price in Paise:', sampleCar.price_in_paise || 'Not set');
      console.log('      - Currency:', sampleCar.currency || 'Not set');
    }

    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyStructure();