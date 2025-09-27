#!/usr/bin/env node

// Script to check if booking_status column exists
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
}
config(); // Load .env file

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Checking booking_status Column');
console.log('===============================');

// Check if we have the required environment variables
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkBookingStatusColumn() {
  console.log('\n🔧 Checking if booking_status column exists...');
  
  try {
    // Try to select the booking_status column specifically
    const { data, error } = await supabase
      .from('cars')
      .select('booking_status')
      .limit(1);
      
    if (error) {
      console.log('❌ Error querying booking_status column:', error.message);
      
      // Check if the error is specifically about the column not existing
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        console.log('❌ The booking_status column does not exist in the cars table');
        console.log('\n💡 Solution: Run the atomic booking migration script in your Supabase SQL Editor');
        console.log('   File: supabase/migrations/20250917020000_complete_atomic_booking_implementation.sql');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ The booking_status column exists in the cars table');
    
    if (data && data.length > 0) {
      console.log('📋 Sample booking_status value:', data[0].booking_status || 'null');
    } else {
      console.log('⚠️  No cars found in the table');
    }
    
    console.log('\n✅ booking_status column check completed');
    return true;
    
  } catch (error) {
    console.error('❌ booking_status column check failed:', error.message);
    return false;
  }
}

// Run the check
checkBookingStatusColumn().then(success => {
  if (success) {
    console.log('\n🎉 The booking_status column exists!');
    console.log('💡 You can now proceed with admin functionality testing');
  } else {
    console.log('\n⚠️  The booking_status column is missing');
    console.log('📝 Please apply the atomic booking migration to your database');
    console.log('   1. Open supabase/migrations/20250917020000_complete_atomic_booking_implementation.sql');
    console.log('   2. Copy the contents');
    console.log('   3. Paste and run in your Supabase SQL Editor');
    console.log('   4. Wait for schema cache to refresh');
    console.log('   5. Run this script again to verify');
  }
  
  process.exit(success ? 0 : 1);
});