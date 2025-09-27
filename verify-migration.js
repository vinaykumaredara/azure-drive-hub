import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// If we still don't have the URL, let's try to get it from another source
if (!supabaseUrl) {
  console.log('⚠️  Supabase URL not found in environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL in your .env.local file');
  console.log('You can find your Supabase URL in your Supabase dashboard: Settings > API > Project URL');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service key');
  console.log('Please set SUPABASE_SERVICE_KEY in your .env.local file');
  console.log('You can find your service key in your Supabase dashboard: Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  try {
    // 1. Check if currency columns exist in cars table
    console.log('1. Checking cars table structure...');
    const { data: carsStructure, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .limit(1);

    if (carsError) {
      console.error('❌ Error fetching cars structure:', carsError.message);
      return;
    }

    console.log('✅ Cars table accessible');
    
    // 2. Check if booking-related columns exist
    console.log('\n2. Checking booking-related columns...');
    const { data: bookingData, error: bookingError } = await supabase
      .from('cars')
      .select('booking_status, booked_by, booked_at')
      .limit(1);

    if (bookingError) {
      console.error('❌ Error accessing booking columns:', bookingError.message);
      return;
    }

    console.log('✅ Booking-related columns exist');
    
    // 3. Check if currency columns exist
    console.log('\n3. Checking currency columns...');
    const { data: currencyData, error: currencyError } = await supabase
      .from('cars')
      .select('price_in_paise, currency')
      .limit(1);

    if (currencyError) {
      console.error('❌ Error accessing currency columns:', currencyError.message);
      return;
    }

    console.log('✅ Currency columns exist');
    
    // 4. Check bookings table currency columns
    console.log('\n4. Checking bookings table currency columns...');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount_in_paise, currency')
      .limit(1);

    if (bookingsError) {
      console.error('❌ Error accessing bookings currency columns:', bookingsError.message);
      return;
    }

    console.log('✅ Bookings currency columns exist');
    
    // 5. Check payments table currency columns
    console.log('\n5. Checking payments table currency columns...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount_in_paise, currency')
      .limit(1);

    if (paymentsError) {
      console.error('❌ Error accessing payments currency columns:', paymentsError.message);
      return;
    }

    console.log('✅ Payments currency columns exist');
    
    // 6. Check if audit_logs table exists
    console.log('\n6. Checking audit_logs table...');
    const { data: auditLogsData, error: auditLogsError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);

    if (auditLogsError) {
      console.error('❌ Error accessing audit_logs table:', auditLogsError.message);
      return;
    }

    console.log('✅ Audit_logs table exists');
    
    // 7. Test inserting a record with currency values
    console.log('\n7. Testing currency column insertion...');
    const testCar = {
      name: 'Test Car',
      price_in_paise: 500000, // 5000 INR in paise
      currency: 'INR',
      status: 'published'
    };

    const { data: insertedCar, error: insertError } = await supabase
      .from('cars')
      .insert(testCar)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test car with currency:', insertError.message);
      return;
    }

    console.log('✅ Successfully inserted car with currency values');
    console.log('   Inserted car ID:', insertedCar.id);
    
    // 8. Clean up test record
    console.log('\n8. Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', insertedCar.id);

    if (deleteError) {
      console.error('❌ Error deleting test car:', deleteError.message);
      return;
    }

    console.log('✅ Test record cleaned up');
    
    console.log('\n🎉 All migration verifications passed!');
    console.log('\n📋 Summary of verified features:');
    console.log('   • Currency columns added to cars, bookings, and payments tables');
    console.log('   • Booking status functionality implemented');
    console.log('   • Audit logs table created');
    console.log('   • All new columns are functional');
    console.log('   • Database schema is properly updated');
    
  } catch (error) {
    console.error('❌ Unexpected error during verification:', error.message);
  }
}

verifyMigration();