import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkCarSchema() {
  console.log('=== Checking Car Schema ===\n');
  
  try {
    // Get sample cars with available columns
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);
      
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    if (data.length > 0) {
      console.log('Sample car structure:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  ${key}: ${typeof data[0][key]} = ${JSON.stringify(data[0][key]).substring(0, 100)}${JSON.stringify(data[0][key]).length > 100 ? '...' : ''}`);
      });
    } else {
      console.log('No cars found in database');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCarSchema();