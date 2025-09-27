#!/usr/bin/env node

// Script to rollback the service_charge column migration (USE WITH CAUTION)
import { createClient } from '@supabase/supabase-js';

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

// Rollback SQL to remove service_charge column
const rollbackSQL = `
-- Remove service_charge column from cars table
ALTER TABLE public.cars 
DROP COLUMN IF EXISTS service_charge;

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
`;

async function rollbackServiceChargeMigration() {
  console.log('⚠️  Rolling back service_charge column migration...\n');
  console.log('🚨 THIS WILL REMOVE THE service_charge COLUMN FROM YOUR DATABASE');
  console.log('🚨 ALL DATA IN THIS COLUMN WILL BE LOST');
  console.log('🚨 ONLY USE THIS IF THE MIGRATION CAUSED ISSUES\n');
  
  // Get confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Type "CONFIRM" to proceed with rollback: ', async (answer) => {
    if (answer !== 'CONFIRM') {
      console.log('❌ Rollback cancelled');
      rl.close();
      return;
    }

    rl.close();
    
    try {
      // Execute the rollback SQL
      console.log('🔧 Executing rollback SQL...');
      const { data, error } = await supabase
        .rpc('execute_sql', {
          sql: rollbackSQL
        });

      if (error) {
        console.error('❌ Rollback failed:', error.message);
        process.exit(1);
      }

      console.log('✅ Rollback executed successfully');
      console.log('📋 Result:', data);
      
      // Wait a bit for the schema cache to refresh
      console.log('\n⏳ Waiting for schema cache to refresh...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify the column was removed
      console.log('\n🔍 Verifying service_charge column was removed...');
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

      if (!verificationData || verificationData.length === 0) {
        console.log('✅ service_charge column successfully removed from cars table');
      } else {
        console.log('⚠️ service_charge column still exists in information_schema');
        console.log('   This might be due to schema cache delay. Try again in a minute.');
      }

      console.log('\n🎉 Service charge migration rollback completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Regenerate Supabase types: npm run gen:supabase-types');
      console.log('2. Restart your development server');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      process.exit(1);
    }
  });
}

// Run the rollback
rollbackServiceChargeMigration();