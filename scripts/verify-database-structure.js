#!/usr/bin/env node

// Script to verify database structure and perform required checks
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

async function verifyDatabaseStructure() {
  console.log('🔍 Verifying database structure...\n');
  
  try {
    // Step 2: Check if required columns exist in cars table
    console.log('📋 Checking cars table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT column_name FROM information_schema.columns 
              WHERE table_name='cars' AND column_name IN ('price_in_paise','currency');`
      });

    if (columnsError) {
      console.log('⚠️  Error checking columns:', columnsError.message);
    } else {
      console.log('✅ Cars table columns check:');
      console.log(columns);
    }

    // Step 3: Check RLS policies
    console.log('\n🛡️  Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
              FROM pg_policies 
              WHERE tablename IN ('cars', 'users', 'system_settings', 'audit_logs')
              ORDER BY tablename, policyname;`
      });

    if (policiesError) {
      console.log('⚠️  Error checking policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies:');
      console.log(policies);
    }

    // Step 6: Check if rpcars2025@gmail.com is admin
    console.log('\n👤 Checking admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT id, email, is_admin FROM public.users 
              WHERE email = 'rpcars2025@gmail.com';`
      });

    if (adminError) {
      console.log('⚠️  Error checking admin user:', adminError.message);
    } else {
      console.log('✅ Admin user check:');
      console.log(adminUser);
    }

    // Step 9: Check recent cars
    console.log('\n🚗 Checking recent cars...');
    const { data: recentCars, error: carsError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT * FROM public.cars ORDER BY created_at DESC LIMIT 3;`
      });

    if (carsError) {
      console.log('⚠️  Error checking recent cars:', carsError.message);
    } else {
      console.log('✅ Recent cars:');
      console.log(recentCars);
    }

    // Step 9: Check recent audit logs
    console.log('\n📝 Checking recent audit logs...');
    const { data: auditLogs, error: auditLogsError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT * FROM public.audit_logs ORDER BY timestamp DESC LIMIT 5;`
      });

    if (auditLogsError) {
      console.log('⚠️  Error checking audit logs:', auditLogsError.message);
    } else {
      console.log('✅ Recent audit logs:');
      console.log(auditLogs);
    }

    console.log('\n🎉 Database verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyDatabaseStructure();