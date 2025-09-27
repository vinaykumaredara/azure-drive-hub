#!/usr/bin/env node

// Script to backup Supabase database
// This requires the SUPABASE_SERVICE_KEY environment variable to be set

import { createClient } from '@supabase/supabase-js';

// Configuration - using service key for admin access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or Service Key environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  console.error('You can get the service key from your Supabase project dashboard:');
  console.error('1. Go to your Supabase project dashboard');
  console.error('2. Navigate to Settings > API');
  console.error('3. Copy the service_role key (not the anon key)');
  console.error('4. Set it as SUPABASE_SERVICE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backupDatabase() {
  console.log('🔄 Backing up database...');
  
  try {
    // Export all tables
    const tables = ['cars', 'bookings', 'payments', 'users', 'profiles'];
    
    for (const table of tables) {
      console.log(`📥 Exporting ${table} table...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');
        
      if (error) {
        console.error(`❌ Error exporting ${table}:`, error.message);
        continue;
      }
      
      // Save to file
      const fs = await import('fs');
      const filename = `backup_${table}_${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`✅ ${table} exported to ${filename}`);
    }
    
    console.log('✅ Database backup completed');
  } catch (error) {
    console.error('❌ Database backup failed:', error.message);
  }
}

// Run the backup
backupDatabase();