#!/usr/bin/env node

// Script to specifically check if service_charge column exists in cars table
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkServiceChargeColumn() {
  console.log('🔍 Checking for service_charge column in cars table...');
  
  try {
    // Try to select just the service_charge column
    const { data, error } = await supabase
      .from('cars')
      .select('service_charge')
      .limit(1);

    if (error && error.message.includes('service_charge')) {
      console.log('❌ service_charge column does not exist in the schema cache');
      console.log('   Error:', error.message);
      return false;
    }

    if (error) {
      console.log('⚠️  Other error occurred:', error.message);
      return false;
    }

    console.log('✅ service_charge column exists in the schema');
    return true;
  } catch (error) {
    console.error('❌ Failed to check service_charge column:', error.message);
    return false;
  }
}

// Also check via information_schema
async function checkViaInformationSchema() {
  console.log('\n🔍 Checking via information_schema...');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cars')
      .eq('column_name', 'service_charge');

    if (error) {
      console.error('❌ Error querying information_schema:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ service_charge column exists in database');
      return true;
    } else {
      console.log('❌ service_charge column does not exist in database');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check information_schema:', error.message);
    return false;
  }
}

// Run the checks
async function runChecks() {
  console.log('🔍 Checking service_charge column existence...\n');
  
  const schemaCheck = await checkServiceChargeColumn();
  const infoSchemaCheck = await checkViaInformationSchema();
  
  console.log('\n📋 Summary:');
  console.log(`   Schema cache check: ${schemaCheck ? '✅ Exists' : '❌ Missing'}`);
  console.log(`   Database check: ${infoSchemaCheck ? '✅ Exists' : '❌ Missing'}`);
  
  if (!schemaCheck && infoSchemaCheck) {
    console.log('\n💡 Recommendation: The column exists in database but not in schema cache.');
    console.log('   Run: NOTIFY pgrst, \'reload schema\' to refresh the cache.');
  }
}

// Run the checks
runChecks();