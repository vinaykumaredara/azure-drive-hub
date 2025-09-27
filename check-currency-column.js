#!/usr/bin/env node

// Script to check if currency column exists in cars table
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCurrencyColumn() {
  console.log('🔍 Checking if currency column exists in cars table...');
  
  try {
    // Try to select the currency column specifically
    const { data, error } = await supabase
      .from('cars')
      .select('currency')
      .limit(1);

    if (error) {
      console.error('❌ Error querying currency column:', error.message);
      
      // Check if the error is specifically about the column not existing
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        console.log('❌ The currency column does not exist in the cars table');
        return false;
      }
      
      return;
    }

    console.log('✅ The currency column exists in the cars table');
    
    if (data && data.length > 0) {
      console.log('📋 Sample currency value:', data[0].currency);
    } else {
      console.log('⚠️  No cars found in the table');
    }
    
    console.log('\n✅ Currency column check completed');
    return true;
  } catch (error) {
    console.error('❌ Currency column check failed:', error.message);
    return false;
  }
}

// Run the check
checkCurrencyColumn();