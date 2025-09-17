const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as in the client.ts file
const SUPABASE_URL = "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSchema() {
  console.log('Checking if booking_status column exists...');
  
  try {
    // Try to query the booking_status column
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, booking_status')
      .limit(1);
      
    if (error) {
      console.log('Error querying booking_status column:', error);
      console.log('This confirms the column is missing from the database schema.');
      
      // Let's check what columns actually exist by selecting all
      const { data: sampleData, error: sampleError } = await supabase
        .from('cars')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.log('Error getting car data:', sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log('Available columns in cars table:');
        Object.keys(sampleData[0]).forEach(key => {
          console.log(`- ${key}`);
        });
      }
    } else {
      console.log('Success! booking_status column exists.');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSchema();