// Simple script to check Supabase database connection
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as in the project
const SUPABASE_URL = "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE";

console.log('Attempting to connect to Supabase database...');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test the connection
async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to get the current timestamp from the database
    const { data, error } = await supabase.rpc('now');
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('Current database time:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n✅ Connection test completed successfully!');
  } else {
    console.log('\n❌ Connection test failed!');
  }
});