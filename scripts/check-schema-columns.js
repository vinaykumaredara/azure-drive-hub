#!/usr/bin/env node

// Script to check if required columns exist in cars table
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchemaColumns() {
  console.log('🔍 Checking cars table schema...');
  
  try {
    // Try to select all columns from cars table to see which ones exist
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying cars table:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const car = data[0];
      console.log('✅ Successfully queried cars table');
      console.log('📋 Available columns:');
      
      // Check for specific columns
      const requiredColumns = [
        'id', 'title', 'make', 'model', 'year', 'seats', 'fuel_type', 
        'transmission', 'price_per_day', 'status', 'image_urls', 'created_at',
        'price_in_paise', 'currency', 'booking_status'
      ];
      
      requiredColumns.forEach(column => {
        if (column in car) {
          console.log(`  ✅ ${column}: ${typeof car[column]}`);
        } else {
          console.log(`  ❌ ${column}: MISSING`);
        }
      });
      
      // Show all available columns
      console.log('\n📋 All available columns:');
      Object.keys(car).forEach(key => {
        console.log(`  ${key}: ${typeof car[key]}`);
      });
    } else {
      console.log('⚠️  No cars found in the table');
    }
    
    console.log('\n✅ Schema check completed');
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

// Run the check
checkSchemaColumns();