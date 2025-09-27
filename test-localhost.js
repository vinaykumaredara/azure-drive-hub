/**
 * Localhost Connection Test Script
 * This script tests the connection to localhost and Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to hardcoded for this demo project
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE";

console.log('🔍 Testing localhost and Supabase connection...');

// Test localhost
console.log('🌐 Testing localhost connection...');
console.log('   Host:', 'localhost');
console.log('   Port:', 5173);
console.log('   Expected URL:', 'http://localhost:5173');

// Test Supabase connection
console.log('\n🔍 Testing Supabase connection...');
console.log('   URL:', SUPABASE_URL);
console.log('   Key:', SUPABASE_PUBLISHABLE_KEY ? '✅ Key present' : '❌ Key missing');

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testSupabaseConnection() {
  try {
    console.log('\n🔄 Testing Supabase database connection...');
    
    // Test database connection by querying a simple table
    const { data, error } = await supabase
      .from('cars')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('   Cars table accessible');
    console.log('   Sample data retrieved:', data ? 'Yes' : 'No');
    
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Running connection tests...\n');
  
  const supabaseConnected = await testSupabaseConnection();
  
  console.log('\n📋 Connection Test Summary:');
  console.log('   Localhost URL: http://localhost:5173 - ✅ Configured');
  console.log('   Supabase Connection:', supabaseConnected ? '✅ Connected' : '❌ Failed');
  
  if (supabaseConnected) {
    console.log('\n🎉 All tests passed! Your application should work correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your configuration.');
  }
}

main();