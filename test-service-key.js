#!/usr/bin/env node

// Script to test Supabase connection with service key
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

console.log('🔍 Testing Supabase Connection with Service Key');
console.log('============================================');

// Check if we have the required environment variables
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log(` Supabase URL: ${SUPABASE_URL}`);
console.log(` Service Key: ${SUPABASE_SERVICE_KEY ? '********' : 'NOT SET'}`);

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
  console.log('\n🔧 Testing connection...');
  
  try {
    // Try to fetch a simple row from cars table
    const { data, error } = await supabase
      .from('cars')
      .select('id')
      .limit(1);
      
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      console.log('💡 This might be due to schema cache issues');
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📋 Found ${data ? data.length : 0} cars in the database`);
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed with exception:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Connection test passed! Your service key is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Follow the manual migration instructions in MANUAL_MIGRATION_INSTRUCTIONS.md');
    console.log('2. Apply the SQL migration in your Supabase SQL Editor');
    console.log('3. Wait for schema cache to refresh');
    console.log('4. Run verification: node final-verification.js');
  } else {
    console.log('\n❌ Connection test failed.');
    console.log('\n📝 Please check:');
    console.log('1. That your service key is correct in .env.local');
    console.log('2. That your Supabase project is not paused or suspended');
    console.log('3. That you have network connectivity to Supabase');
  }
  
  process.exit(success ? 0 : 1);
});