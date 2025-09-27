#!/usr/bin/env node

// Script to verify currency column migration status
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyCurrencyMigration() {
  console.log('🔍 Verifying currency column migration status...');
  
  try {
    // Check if currency column exists in cars table
    console.log('\n📋 Checking cars table...');
    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('currency')
      .limit(1);

    if (carsError && carsError.message.includes("column") && carsError.message.includes("does not exist")) {
      console.log('❌ Currency column does not exist in cars table');
    } else if (carsError) {
      console.error('❌ Error querying cars table:', carsError.message);
    } else {
      console.log('✅ Currency column exists in cars table');
      if (carsData && carsData.length > 0) {
        console.log('   Sample currency value:', carsData[0].currency);
      }
    }
    
    // Check if currency column exists in bookings table
    console.log('\n📋 Checking bookings table...');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('currency')
      .limit(1);

    if (bookingsError && bookingsError.message.includes("column") && bookingsError.message.includes("does not exist")) {
      console.log('❌ Currency column does not exist in bookings table');
    } else if (bookingsError) {
      console.error('❌ Error querying bookings table:', bookingsError.message);
    } else {
      console.log('✅ Currency column exists in bookings table');
      if (bookingsData && bookingsData.length > 0) {
        console.log('   Sample currency value:', bookingsData[0].currency);
      }
    }
    
    // Check if currency column exists in payments table
    console.log('\n📋 Checking payments table...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('currency')
      .limit(1);

    if (paymentsError && paymentsError.message.includes("column") && paymentsError.message.includes("does not exist")) {
      console.log('❌ Currency column does not exist in payments table');
    } else if (paymentsError) {
      console.error('❌ Error querying payments table:', paymentsError.message);
    } else {
      console.log('✅ Currency column exists in payments table');
      if (paymentsData && paymentsData.length > 0) {
        console.log('   Sample currency value:', paymentsData[0].currency);
      }
    }
    
    // Check if indexes exist
    console.log('\n📋 Checking indexes...');
    const { data: indexesData, error: indexesError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('cars', 'bookings', 'payments') 
        AND indexname IN ('idx_cars_currency', 'idx_bookings_currency', 'idx_payments_currency');
      `
    });
    
    if (indexesError) {
      console.error('❌ Error checking indexes:', indexesError.message);
    } else {
      const indexNames = indexesData.map(row => row.indexname);
      console.log('   Found indexes:', indexNames.join(', ') || 'None');
      
      const expectedIndexes = ['idx_cars_currency', 'idx_bookings_currency', 'idx_payments_currency'];
      expectedIndexes.forEach(index => {
        if (indexNames.includes(index)) {
          console.log(`   ✅ ${index} exists`);
        } else {
          console.log(`   ❌ ${index} missing`);
        }
      });
    }
    
    console.log('\n✅ Currency migration verification completed');
  } catch (error) {
    console.error('❌ Currency migration verification failed:', error.message);
  }
}

// Run the verification
verifyCurrencyMigration();