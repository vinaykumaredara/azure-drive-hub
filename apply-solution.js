#!/usr/bin/env node

// Script to apply the complete currency migration solution
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
}
config(); // Load .env file

// Import required modules
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚀 Starting Currency Migration Solution Application');
console.log('===============================================');

// Check if we have the required environment variables
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
  console.error('Please add your Supabase service role key to .env.local file');
  console.error('You can get it from your Supabase dashboard: Settings > API > service_role key');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  console.error('Please add your Supabase anon key to .env file');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log(` Supabase URL: ${SUPABASE_URL}`);
console.log(` Service Key: ${SUPABASE_SERVICE_KEY ? '********' : 'NOT SET'}`);
console.log(` Anon Key: ${SUPABASE_ANON_KEY ? '********' : 'NOT SET'}`);

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applySolution() {
  console.log('\n🔧 Applying currency migration solution...');
  
  try {
    // Step 1: Add currency column to cars table
    console.log('📝 Adding currency column to cars table...');
    // We'll try to add the column by inserting a test row and then deleting it
    // This is a workaround since we can't directly execute DDL with the client
    
    // First, let's try a different approach - check if we can modify the table structure
    // by attempting to select from information_schema
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'cars')
      .eq('column_name', 'currency');
    
    if (columnsError) {
      console.error('❌ Error checking for currency column:', columnsError.message);
    } else {
      if (columns && columns.length > 0) {
        console.log('✅ Currency column already exists in cars table');
      } else {
        console.log('⚠️  Currency column does not exist in cars table');
        console.log('💡 Note: Direct DDL execution requires using Supabase SQL editor or CLI');
        console.log('   Please run the following SQL in your Supabase SQL editor:');
        console.log('   ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'INR\';');
      }
    }
    
    // Step 2: Check bookings table
    console.log('📝 Checking currency column in bookings table...');
    const { data: bookingsColumns, error: bookingsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'bookings')
      .eq('column_name', 'currency');
    
    if (bookingsError) {
      console.error('❌ Error checking for currency column in bookings:', bookingsError.message);
    } else {
      if (bookingsColumns && bookingsColumns.length > 0) {
        console.log('✅ Currency column already exists in bookings table');
      } else {
        console.log('⚠️  Currency column does not exist in bookings table');
        console.log('   Please run the following SQL in your Supabase SQL editor:');
        console.log('   ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'INR\';');
      }
    }
    
    // Step 3: Check payments table
    console.log('📝 Checking currency column in payments table...');
    const { data: paymentsColumns, error: paymentsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'payments')
      .eq('column_name', 'currency');
    
    if (paymentsError) {
      console.error('❌ Error checking for currency column in payments:', paymentsError.message);
    } else {
      if (paymentsColumns && paymentsColumns.length > 0) {
        console.log('✅ Currency column already exists in payments table');
      } else {
        console.log('⚠️  Currency column does not exist in payments table');
        console.log('   Please run the following SQL in your Supabase SQL editor:');
        console.log('   ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'INR\';');
      }
    }
    
    // Step 4: Since we can't execute DDL directly, let's provide the complete SQL script
    console.log('\n📋 Complete SQL Migration Script:');
    console.log('================================');
    console.log('-- Add currency column to cars table');
    console.log('ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'INR\';');
    console.log('');
    console.log('-- Add currency column to bookings table');
    console.log('ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'INR\';');
    console.log('');
    console.log('-- Add currency column to payments table');
    console.log('ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'INR\';');
    console.log('');
    console.log('-- Update existing rows with currency values');
    console.log('UPDATE public.cars SET currency = \'INR\' WHERE currency IS NULL;');
    console.log('UPDATE public.bookings SET currency = \'INR\' WHERE currency IS NULL;');
    console.log('UPDATE public.payments SET currency = \'INR\' WHERE currency IS NULL;');
    console.log('');
    console.log('-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);');
    console.log('CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);');
    console.log('CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);');
    console.log('');
    console.log('-- Create auto-reload trigger function');
    console.log('CREATE OR REPLACE FUNCTION pgrst_reload_on_ddl()');
    console.log('RETURNS event_trigger');
    console.log('LANGUAGE plpgsql');
    console.log('AS $$');
    console.log('BEGIN');
    console.log('  PERFORM pg_notify(\'pgrst\', \'reload schema\');');
    console.log('END;');
    console.log('$$;');
    console.log('');
    console.log('-- Create event trigger');
    console.log('DROP EVENT TRIGGER IF EXISTS pgrst_reload_on_ddl;');
    console.log('CREATE EVENT TRIGGER pgrst_reload_on_ddl');
    console.log('ON ddl_command_end');
    console.log('EXECUTE FUNCTION pgrst_reload_on_ddl();');
    
    console.log('\n📋 Instructions:');
    console.log('================');
    console.log('1. Copy the SQL script above');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and run the SQL script');
    console.log('5. Wait 30-60 seconds for schema cache to refresh');
    console.log('6. Run verification: node final-verification.js');
    
    return true;
    
  } catch (error) {
    console.error('❌ Currency migration solution failed:', error.message);
    return false;
  }
}

// Run the solution
applySolution().then(success => {
  process.exit(success ? 0 : 1);
});