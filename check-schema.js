import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSchema() {
  try {
    console.log('Checking cars table schema...');
    
    // Get table info
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log('Sample car data:', data?.[0] || 'No data');
    
    // Check table columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'cars')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return;
    }
    
    console.log('\nCars table columns:');
    columns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
    // Check storage buckets
    console.log('\nChecking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error fetching buckets:', bucketsError);
      return;
    }
    
    console.log('Storage buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public})`);
    });
    
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkSchema();