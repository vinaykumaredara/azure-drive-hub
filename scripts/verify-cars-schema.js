#!/usr/bin/env node

// Script to verify cars table schema
import { createClient } from '@supabase/supabase-js';

// Configuration - using anon key for public access testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

// Create Supabase client with anon key (public access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyCarsSchema() {
  console.log('🔍 Verifying cars table schema...');
  
  try {
    // Check information_schema for cars columns
    const { data: columns, error: columnsError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'cars'
        ORDER BY ordinal_position
      `
    });

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return;
    }

    console.log('\n📋 Cars Table Columns:');
    console.log('=====================');
    columns.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${column.column_default ? `(default: ${column.column_default})` : ''}`);
    });

    // Check indexes
    const { data: indexes, error: indexesError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'cars' AND indexname LIKE 'idx_cars_%'
      `
    });

    if (indexesError) {
      console.error('Error fetching indexes:', indexesError);
      return;
    }

    console.log('\n🔗 Cars Table Indexes:');
    console.log('=====================');
    indexes.forEach(index => {
      console.log(`${index.indexname}: ${index.indexdef}`);
    });

    // Check if audit_logs table exists
    const { data: auditLogs, error: auditLogsError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs'
        ORDER BY ordinal_position
      `
    });

    if (auditLogsError) {
      console.log('\n⚠️  audit_logs table does not exist yet');
    } else {
      console.log('\n📝 Audit Logs Table Columns:');
      console.log('===========================');
      auditLogs.forEach(column => {
        console.log(`${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // Check if booking_status column exists and has data
    const { data: sampleData, error: sampleError } = await supabase
      .from('cars')
      .select('id, title, booking_status')
      .limit(5);

    if (sampleError) {
      console.log('\n❌ Error querying booking_status column:', sampleError.message);
    } else {
      console.log('\n✅ booking_status column exists and is accessible');
      console.log('Sample data:');
      sampleData.forEach(car => {
        console.log(`  ${car.title}: ${car.booking_status}`);
      });
    }

    console.log('\n✅ Schema verification completed');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyCarsSchema();