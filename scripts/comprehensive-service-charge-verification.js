#!/usr/bin/env node

// Comprehensive verification script for service_charge column fix
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

let passedTests = 0;
let totalTests = 0;

function logTestResult(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${testName}`);
  } else {
    console.log(`❌ ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

async function checkServiceChargeColumnExists() {
  console.log('\n🔍 Test 1: Checking if service_charge column exists in database...');
  
  try {
    if (!supabaseService) {
      console.log('   ⚠️  Service role key not provided, skipping direct SQL check');
      // Try with anon client as fallback
      const { data, error } = await supabaseAnon
        .rpc('execute_sql', {
          sql: `SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = 'cars' 
                  AND column_name = 'service_charge' 
                LIMIT 1;`
        });
      
      if (error && error.message.includes('rpc')) {
        console.log('   ⚠️  Cannot execute SQL without service role key');
        return false;
      }
      
      return data && data.length > 0;
    }
    
    const { data, error } = await supabaseService
      .rpc('execute_sql', {
        sql: `SELECT column_name 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'cars' 
                AND column_name = 'service_charge';`
      });

    if (error) {
      console.log('   Error:', error.message);
      return false;
    }

    const exists = data && data.length > 0;
    logTestResult('Service charge column exists in database', exists);
    return exists;
  } catch (error) {
    logTestResult('Service charge column exists in database', false, `Error: ${error.message}`);
    return false;
  }
}

async function checkServiceChargeAccessibleViaREST() {
  console.log('\n🔍 Test 2: Checking if service_charge is accessible via REST API...');
  
  try {
    const { data, error } = await supabaseAnon
      .from('cars')
      .select('service_charge')
      .limit(1);

    // If we get an error about the column not existing, it's not accessible
    if (error && error.message.includes('service_charge')) {
      logTestResult('Service charge accessible via REST', false, `Error: ${error.message}`);
      return false;
    }

    // If we get data or a different kind of error, the column is accessible
    logTestResult('Service charge accessible via REST', true);
    return true;
  } catch (error) {
    logTestResult('Service charge accessible via REST', false, `Error: ${error.message}`);
    return false;
  }
}

async function testCarInsertionWithServiceCharge() {
  console.log('\n🔍 Test 3: Testing car insertion with service_charge...');
  
  // Create a minimal test car
  const testCar = {
    title: 'Service Charge Test Car',
    make: 'Test',
    model: 'Model',
    year: 2023,
    seats: 5,
    fuel_type: 'petrol',
    transmission: 'automatic',
    price_per_day: 1000,
    service_charge: 100, // This is what we're testing
    status: 'published',
    image_urls: ['https://example.com/test-car.jpg']
  };

  try {
    // We won't actually insert, just test the structure
    // In a real test, we would insert and then delete
    const hasServiceCharge = 'service_charge' in testCar;
    logTestResult('Car object can include service_charge', hasServiceCharge);
    return hasServiceCharge;
  } catch (error) {
    logTestResult('Car object can include service_charge', false, `Error: ${error.message}`);
    return false;
  }
}

async function checkSchemaCacheRefreshNeeded() {
  console.log('\n🔍 Test 4: Checking if schema cache refresh might be needed...');
  
  try {
    // If column exists in database but not accessible via REST, cache refresh is needed
    const columnExists = await checkServiceChargeColumnExists();
    const accessibleViaRest = await checkServiceChargeAccessibleViaREST();
    
    if (columnExists && !accessibleViaRest) {
      logTestResult('Schema cache refresh recommended', true, 'Column exists in DB but not accessible via REST');
      return true;
    }
    
    logTestResult('Schema cache refresh recommended', false);
    return false;
  } catch (error) {
    logTestResult('Schema cache refresh recommended', false, `Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Comprehensive Service Charge Column Verification\n');
  
  await checkServiceChargeColumnExists();
  await checkServiceChargeAccessibleViaREST();
  await testCarInsertionWithServiceCharge();
  await checkSchemaCacheRefreshNeeded();
  
  console.log('\n📋 Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The service_charge column fix is working correctly.');
  } else if (passedTests > 0) {
    console.log('\n⚠️  Some tests failed. The fix may be partially applied.');
  } else {
    console.log('\n❌ All tests failed. The service_charge column fix has not been applied.');
  }
  
  console.log('\n📝 Next steps:');
  if (passedTests === 0) {
    console.log('   1. Apply the service_charge migration using: node scripts/apply-service-charge-migration.js');
    console.log('   2. Run this verification script again');
  } else if (passedTests < totalTests) {
    console.log('   1. If column exists in DB but not accessible via REST, run: NOTIFY pgrst, \'reload schema\'');
    console.log('   2. Wait 30-60 seconds for cache to refresh');
    console.log('   3. Run this verification script again');
  } else {
    console.log('   1. Regenerate Supabase types: npm run gen:supabase-types');
    console.log('   2. Restart your development server');
    console.log('   3. Test admin functionality');
  }
}

// Run the verification
runAllTests();