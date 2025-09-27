#!/usr/bin/env node

// Script to apply currency column migration
// This requires the SUPABASE_SERVICE_KEY environment variable to be set

import { createClient } from '@supabase/supabase-js';

// Configuration - using service key for admin access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or Service Key environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  console.error('You can get the service key from your Supabase project dashboard:');
  console.error('1. Go to your Supabase project dashboard');
  console.error('2. Navigate to Settings > API');
  console.error('3. Copy the service_role key (not the anon key)');
  console.error('4. Set it as SUPABASE_SERVICE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyCurrencyMigration() {
  console.log('🔄 Applying currency column migration...');
  
  try {
    // Add currency column to cars table
    console.log('📝 Adding currency column to cars table...');
    const { error: carsError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE public.cars 
        ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
      `
    });
    
    if (carsError) {
      console.error('❌ Error adding currency column to cars:', carsError.message);
    } else {
      console.log('✅ Currency column added to cars table');
    }
    
    // Add currency column to bookings table
    console.log('📝 Adding currency column to bookings table...');
    const { error: bookingsError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE public.bookings 
        ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
      `
    });
    
    if (bookingsError) {
      console.error('❌ Error adding currency column to bookings:', bookingsError.message);
    } else {
      console.log('✅ Currency column added to bookings table');
    }
    
    // Add currency column to payments table
    console.log('📝 Adding currency column to payments table...');
    const { error: paymentsError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE public.payments 
        ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
      `
    });
    
    if (paymentsError) {
      console.error('❌ Error adding currency column to payments:', paymentsError.message);
    } else {
      console.log('✅ Currency column added to payments table');
    }
    
    // Update existing rows with currency value
    console.log('📝 Updating existing rows with currency values...');
    const { error: updateCarsError } = await supabase.rpc('execute_sql', {
      query: `
        UPDATE public.cars 
        SET currency = 'INR' 
        WHERE currency IS NULL;
      `
    });
    
    if (updateCarsError) {
      console.error('❌ Error updating cars with currency values:', updateCarsError.message);
    } else {
      console.log('✅ Existing cars updated with currency values');
    }
    
    // Create indexes
    console.log('📝 Creating indexes for better performance...');
    const { error: indexError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);
        CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
        CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);
      `
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    console.log('✅ Currency migration applied successfully');
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
    
  } catch (error) {
    console.error('❌ Currency migration failed:', error.message);
  }
}

// Run the migration
applyCurrencyMigration();