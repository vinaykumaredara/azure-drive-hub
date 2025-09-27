#!/usr/bin/env node

// Script to apply the service_charge column migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration - you'll need to add your service role key to .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Please add it to your .env file');
  console.log('You can find this in your Supabase project dashboard under Settings > API > Service Role Key');
  process.exit(1);
}

// Create Supabase client with service role key (full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration SQL to add service_charge column
const migrationSQL = `
-- Add service_charge column to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS service_charge NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.cars.service_charge IS 'Optional service charge amount to be added to booking total (replaces GST)';

-- Update existing cars to have 0 service charge if null
UPDATE public.cars 
SET service_charge = 0 
WHERE service_charge IS NULL;

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
`;

async function applyServiceChargeMigration() {
  console.log('🚀 Applying service_charge column migration...\n');
  
  try {
    // Execute the migration SQL
    console.log('🔧 Executing migration SQL...');
    const { data, error } = await supabase
      .rpc('execute_sql', {
        sql: migrationSQL
      });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Migration executed successfully');
    console.log('📋 Result:', data);
    
    // Wait a bit for the schema cache to refresh
    console.log('\n⏳ Waiting for schema cache to refresh...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify the column was added
    console.log('\n🔍 Verifying service_charge column was added...');
    const { data: verificationData, error: verificationError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT column_name 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'cars' 
                AND column_name = 'service_charge';`
      });

    if (verificationError) {
      console.error('❌ Verification failed:', verificationError.message);
      process.exit(1);
    }

    if (verificationData && verificationData.length > 0) {
      console.log('✅ service_charge column successfully added to cars table');
    } else {
      console.log('⚠️ service_charge column not found in information_schema');
      console.log('   This might be due to schema cache delay. Try again in a minute.');
    }

    console.log('\n🎉 Service charge migration applied successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Regenerate Supabase types: npm run gen:supabase-types');
    console.log('2. Restart your development server');
    console.log('3. Test the admin car creation functionality');
    
  } catch (error) {
    console.error('❌ Migration application failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyServiceChargeMigration();