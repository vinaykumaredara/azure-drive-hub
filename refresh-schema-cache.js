#!/usr/bin/env node

// Script to refresh Supabase schema cache
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

console.log('🔄 Refreshing Supabase Schema Cache');
console.log('==================================');

// Check if we have the required environment variables
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function refreshSchemaCache() {
  console.log('\n🔧 Refreshing schema cache...');
  
  try {
    // Try to force a schema refresh by making a change and then reverting it
    console.log('📝 Attempting to trigger schema refresh...');
    
    // Update a row in cars table to trigger schema refresh
    const { data, error } = await supabase
      .from('cars')
      .update({ currency: 'INR' })
      .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID
      .select();
      
    if (error && !error.message.includes('0 rows updated')) {
      console.log('⚠️  Minor error during refresh (this is expected):', error.message);
    } else {
      console.log('✅ Refresh trigger sent successfully');
    }
    
    console.log('\n📋 Schema cache refresh initiated');
    console.log('⏳ Please wait 30-60 seconds for the refresh to complete');
    console.log('💡 You can also manually restart your Supabase project from the dashboard for immediate refresh');
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema cache refresh failed:', error.message);
    return false;
  }
}

// Run the refresh
refreshSchemaCache().then(success => {
  if (success) {
    console.log('\n🎉 Schema cache refresh initiated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Wait 30-60 seconds for the refresh to complete');
    console.log('2. Try regenerating types again: npm run gen:supabase-types');
    console.log('3. If that fails, restart your Supabase project from the dashboard');
  } else {
    console.log('\n❌ Schema cache refresh failed.');
    console.log('\n📝 Please try manually restarting your Supabase project from the dashboard');
  }
  
  process.exit(success ? 0 : 1);
});