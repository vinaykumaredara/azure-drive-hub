#!/usr/bin/env node

// Script to check information schema for currency column
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkInformationSchema() {
  console.log('🔍 Checking information schema for currency column...');
  
  try {
    // Query information schema for currency column
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema='public' AND column_name='currency'
        ORDER BY table_name;
      `
    });
    
    if (error) {
      console.error('❌ Error querying information schema:', error.message);
      return false;
    }
    
    console.log('✅ Information schema query successful');
    console.log('📋 Currency column found in tables:');
    
    if (data && data.length > 0) {
      data.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  ❌ Currency column not found in any tables');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Information schema check failed:', error.message);
    return false;
  }
}

// Run the check
checkInformationSchema();