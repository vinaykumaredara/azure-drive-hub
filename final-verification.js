#!/usr/bin/env node

// Final verification script for currency migration
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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Final Verification of Currency Migration');
console.log('==========================================');

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalVerification() {
  let allPassed = true;
  
  console.log('\n1. Checking if currency column exists in cars table...');
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('currency')
      .limit(1);
      
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ Currency column does not exist in cars table');
      allPassed = false;
    } else if (error) {
      console.log('❌ Error querying cars table:', error.message);
      allPassed = false;
    } else {
      console.log('✅ Currency column exists in cars table');
    }
  } catch (error) {
    console.log('❌ Error checking cars table:', error.message);
    allPassed = false;
  }
  
  console.log('\n2. Checking if currency column exists in bookings table...');
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('currency')
      .limit(1);
      
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ Currency column does not exist in bookings table');
      allPassed = false;
    } else if (error) {
      console.log('❌ Error querying bookings table:', error.message);
      allPassed = false;
    } else {
      console.log('✅ Currency column exists in bookings table');
    }
  } catch (error) {
    console.log('❌ Error checking bookings table:', error.message);
    allPassed = false;
  }
  
  console.log('\n3. Checking if currency column exists in payments table...');
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('currency')
      .limit(1);
      
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ Currency column does not exist in payments table');
      allPassed = false;
    } else if (error) {
      console.log('❌ Error querying payments table:', error.message);
      allPassed = false;
    } else {
      console.log('✅ Currency column exists in payments table');
    }
  } catch (error) {
    console.log('❌ Error checking payments table:', error.message);
    allPassed = false;
  }
  
  console.log('\n4. Testing REST endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cars?select=currency&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ REST endpoint is working correctly');
    } else if (response.status === 400) {
      const data = await response.json();
      if (data.message && data.message.includes('column') && data.message.includes('does not exist')) {
        console.log('❌ REST endpoint error: currency column does not exist');
        allPassed = false;
      } else {
        console.log('❌ REST endpoint error:', response.status, response.statusText);
        allPassed = false;
      }
    } else {
      console.log('❌ REST endpoint error:', response.status, response.statusText);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ REST endpoint verification failed:', error.message);
    allPassed = false;
  }
  
  console.log('\n📊 Final Verification Summary:');
  console.log('==============================');
  if (allPassed) {
    console.log('✅ All checks passed! The currency migration has been successfully applied.');
    console.log('\n📋 Next steps:');
    console.log('1. Regenerate Supabase types: npm run gen:supabase-types');
    console.log('2. Build your application: npm run build');
    console.log('3. Deploy to your hosting platform');
  } else {
    console.log('❌ Some checks failed. The currency migration has not been applied yet.');
    console.log('\n📋 To apply the migration:');
    console.log('1. Get your Supabase service role key from the dashboard');
    console.log('2. Add it to .env.local file as SUPABASE_SERVICE_KEY');
    console.log('3. Run: node apply-solution.js');
    console.log('4. Wait 30-60 seconds for schema cache to refresh');
    console.log('5. Run this verification script again');
  }
  
  return allPassed;
}

// Run the verification
finalVerification().then(success => {
  process.exit(success ? 0 : 1);
});