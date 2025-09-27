#!/usr/bin/env node

// Comprehensive verification script for currency migration
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function comprehensiveVerification() {
  console.log('🔍 Starting comprehensive verification of currency migration...');
  
  let allChecksPassed = true;
  
  // 1. Check information schema
  console.log('\n📋 1. Checking information schema for currency column...');
  try {
    const { data: schemaData, error: schemaError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema='public' AND column_name='currency'
        ORDER BY table_name;
      `
    });
    
    if (schemaError) {
      console.error('❌ Error querying information schema:', schemaError.message);
      allChecksPassed = false;
    } else {
      console.log('✅ Information schema query successful');
      if (schemaData && schemaData.length > 0) {
        console.log('📋 Currency column found in tables:');
        schemaData.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        console.log('❌ Currency column not found in any tables');
        allChecksPassed = false;
      }
    }
  } catch (error) {
    console.error('❌ Information schema check failed:', error.message);
    allChecksPassed = false;
  }
  
  // 2. Test REST endpoint
  console.log('\n🌐 2. Testing REST endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cars?select=currency&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ REST endpoint is working correctly');
      if (Array.isArray(data)) {
        console.log(`📋 Received ${data.length} records`);
        if (data.length > 0) {
          console.log('📋 Sample currency value:', data[0].currency || 'null');
        }
      }
    } else {
      console.error('❌ REST endpoint error:', response.status, response.statusText);
      console.error('📋 Error details:', JSON.stringify(data, null, 2));
      allChecksPassed = false;
    }
  } catch (error) {
    console.error('❌ REST endpoint verification failed:', error.message);
    allChecksPassed = false;
  }
  
  // 3. Test Supabase client
  console.log('\n🔌 3. Testing Supabase client...');
  try {
    const { data: clientData, error: clientError } = await supabase
      .from('cars')
      .select('currency')
      .limit(1);
      
    if (clientError) {
      console.error('❌ Supabase client error:', clientError.message);
      allChecksPassed = false;
    } else {
      console.log('✅ Supabase client is working correctly');
      if (clientData && clientData.length > 0) {
        console.log('📋 Sample currency value:', clientData[0].currency || 'null');
      } else {
        console.log('📋 No data returned');
      }
    }
  } catch (error) {
    console.error('❌ Supabase client verification failed:', error.message);
    allChecksPassed = false;
  }
  
  // 4. Check indexes
  console.log('\n🔍 4. Checking indexes...');
  try {
    const { data: indexesData, error: indexesError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('cars', 'bookings', 'payments') 
        AND indexname IN ('idx_cars_currency', 'idx_bookings_currency', 'idx_payments_currency');
      `
    });
    
    if (indexesError) {
      console.error('❌ Error checking indexes:', indexesError.message);
      allChecksPassed = false;
    } else {
      const indexNames = indexesData.map(row => row.indexname);
      console.log('📋 Found indexes:', indexNames.join(', ') || 'None');
      
      const expectedIndexes = ['idx_cars_currency', 'idx_bookings_currency', 'idx_payments_currency'];
      let allIndexesFound = true;
      expectedIndexes.forEach(index => {
        if (indexNames.includes(index)) {
          console.log(`✅ ${index} exists`);
        } else {
          console.log(`❌ ${index} missing`);
          allIndexesFound = false;
          allChecksPassed = false;
        }
      });
      
      if (allIndexesFound) {
        console.log('✅ All expected indexes found');
      }
    }
  } catch (error) {
    console.error('❌ Index check failed:', error.message);
    allChecksPassed = false;
  }
  
  // Summary
  console.log('\n📊 Verification Summary:');
  if (allChecksPassed) {
    console.log('✅ All verification checks passed! The currency migration was successful.');
  } else {
    console.log('❌ Some verification checks failed. Please review the errors above.');
  }
  
  return allChecksPassed;
}

// Run the comprehensive verification
comprehensiveVerification().then(success => {
  process.exit(success ? 0 : 1);
});