// Script to check what columns exist in the cars table
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCarColumns() {
  try {
    console.log('Checking cars table columns...');
    
    // Try to get column information from information_schema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'cars')
      .in('column_name', ['image_paths', 'image_urls', 'image_path']);

    if (error) {
      console.error('Error fetching column information:', error);
      return;
    }

    console.log('Found columns in cars table:');
    data.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });

    // Also try a simple query to see what happens
    console.log('\nTrying to fetch a car with specific columns...');
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select('id, title, image_paths, image_urls')
      .limit(1);

    if (carError) {
      console.error('Error fetching car data:', carError);
    } else {
      console.log('Successfully fetched car data:', carData);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkCarColumns();