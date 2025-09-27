#!/usr/bin/env node

// Simple script to check if service_charge column exists
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking for service_charge column...');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

// Create Supabase client with service role key (full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkColumn() {
  try {
    // Try to select the service_charge column
    const { data, error } = await supabase
      .from('cars')
      .select('service_charge')
      .limit(1);

    if (error && error.message.includes('service_charge')) {
      console.log('❌ service_charge column does not exist');
      console.log('Error:', error.message);
      return false;
    }

    console.log('✅ service_charge column exists and is accessible');
    return true;
  } catch (error) {
    console.log('❌ Error checking column:', error.message);
    return false;
  }
}

// Run the check
checkColumn().then(result => {
  if (!result) {
    console.log('\n📝 To fix this issue:');
    console.log('1. Apply the service_charge migration');
    console.log('2. Run: NOTIFY pgrst, \'reload schema\' in SQL editor');
  }
});