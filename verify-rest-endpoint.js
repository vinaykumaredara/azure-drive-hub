#!/usr/bin/env node

// Script to verify the REST endpoint is working correctly
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyRestEndpoint() {
  console.log('🔍 Verifying REST endpoint for currency column...');
  
  try {
    // Test the REST endpoint directly
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
      console.log('📋 Sample response:', JSON.stringify(data, null, 2));
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ Currency data received:', data[0].currency || 'null');
      } else {
        console.log('⚠️  No data returned or empty array');
      }
    } else {
      console.error('❌ REST endpoint error:', response.status, response.statusText);
      console.error('📋 Error details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ REST endpoint verification failed:', error.message);
  }
  
  try {
    // Also test with Supabase client
    console.log('\n🔍 Testing with Supabase client...');
    const { data, error } = await supabase
      .from('cars')
      .select('currency')
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase client error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase client is working correctly');
    if (data && data.length > 0) {
      console.log('📋 Sample data:', data[0]);
    } else {
      console.log('⚠️  No data returned');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase client verification failed:', error.message);
    return false;
  }
}

// Run the verification
verifyRestEndpoint();