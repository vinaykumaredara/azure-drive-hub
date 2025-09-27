#!/usr/bin/env node

// Script to rollback currency column migration
// This requires the SUPABASE_SERVICE_KEY environment variable to be set

import { createClient } from '@supabase/supabase-js';

// Configuration - using service key for admin access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or Service Key environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function rollbackCurrencyMigration() {
  console.log('🔄 Rolling back currency column migration...');
  
  try {
    // Drop indexes first
    console.log('📝 Dropping indexes...');
    const { error: dropIndexError } = await supabase.rpc('execute_sql', {
      query: `
        DROP INDEX IF EXISTS idx_cars_currency;
        DROP INDEX IF EXISTS idx_bookings_currency;
        DROP INDEX IF EXISTS idx_payments_currency;
      `
    });
    
    if (dropIndexError) {
      console.error('❌ Error dropping indexes:', dropIndexError.message);
    } else {
      console.log('✅ Indexes dropped successfully');
    }
    
    // Drop currency column from payments table
    console.log('📝 Dropping currency column from payments table...');
    const { error: dropPaymentsError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE public.payments 
        DROP COLUMN IF EXISTS currency;
      `
    });
    
    if (dropPaymentsError) {
      console.error('❌ Error dropping currency column from payments:', dropPaymentsError.message);
    } else {
      console.log('✅ Currency column dropped from payments table');
    }
    
    // Drop currency column from bookings table
    console.log('📝 Dropping currency column from bookings table...');
    const { error: dropBookingsError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE public.bookings 
        DROP COLUMN IF EXISTS currency;
      `
    });
    
    if (dropBookingsError) {
      console.error('❌ Error dropping currency column from bookings:', dropBookingsError.message);
    } else {
      console.log('✅ Currency column dropped from bookings table');
    }
    
    // Drop currency column from cars table
    console.log('📝 Dropping currency column from cars table...');
    const { error: dropCarsError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE public.cars 
        DROP COLUMN IF EXISTS currency;
      `
    });
    
    if (dropCarsError) {
      console.error('❌ Error dropping currency column from cars:', dropCarsError.message);
    } else {
      console.log('✅ Currency column dropped from cars table');
    }
    
    console.log('🔄 Now refreshing schema cache...');
    
    // Refresh schema cache
    const { error: notifyError } = await supabase.rpc('execute_sql', {
      query: "NOTIFY pgrst, 'reload schema';"
    });
    
    if (notifyError) {
      console.error('❌ Error refreshing schema cache:', notifyError.message);
      console.log('⚠️  Please manually restart your Supabase project from the dashboard');
    } else {
      console.log('✅ Schema cache refresh initiated');
      console.log('⏳ Please wait 30-60 seconds for the schema cache to refresh completely');
    }
    
    console.log('✅ Currency migration rolled back successfully');
    
  } catch (error) {
    console.error('❌ Currency migration rollback failed:', error.message);
  }
}

// Run the rollback
rollbackCurrencyMigration();