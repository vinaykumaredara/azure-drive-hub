#!/usr/bin/env node

// Script to refresh PostgREST schema cache by sending NOTIFY command
import { createClient } from '@supabase/supabase-js';

// Configuration - using service key for admin access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or Service Key environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function refreshSchemaCache() {
  console.log('🔄 Refreshing PostgREST schema cache...');
  
  try {
    // Send NOTIFY command to reload schema
    const { error } = await supabase.rpc('execute_sql', {
      query: "NOTIFY pgrst, 'reload schema';"
    });

    if (error) {
      console.error('❌ Error sending NOTIFY command:', error.message);
      
      // Try alternative approach - restart the project
      console.log('🔄 Trying alternative approach: project restart...');
      console.log('⚠️  Manual restart required: Please restart your Supabase project from the dashboard');
      return;
    }

    console.log('✅ NOTIFY command sent successfully');
    console.log('⏳ Please wait 30-60 seconds for the schema cache to refresh');
    console.log('✅ Schema cache refresh initiated');
  } catch (error) {
    console.error('❌ Schema cache refresh failed:', error.message);
    console.log('⚠️  Manual restart required: Please restart your Supabase project from the dashboard');
  }
}

// Run the refresh
refreshSchemaCache();