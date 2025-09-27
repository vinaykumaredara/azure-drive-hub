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

async function checkTables() {
  try {
    console.log('Checking available tables...');
    
    // List all tables
    const { data: tables, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('Error fetching tables:', error);
      // Try alternative method
      await checkCarsTable();
      return;
    }
    
    console.log('Available tables:');
    tables.forEach(table => {
      console.log(`- ${table.tablename}`);
    });
    
    // Check cars table specifically
    await checkCarsTable();
    
  } catch (error) {
    console.error('Tables check error:', error);
  }
}

async function checkCarsTable() {
  try {
    console.log('\nChecking cars table structure...');
    
    // Try to get column info using a different approach
    const { data, error } = await supabase.rpc('get_columns_info', {
      table_name: 'cars'
    });
    
    if (error) {
      console.error('Error getting column info:', error);
      // Let's try to fetch a car and see what fields it has
      await fetchSampleCar();
      return;
    }
    
    console.log('Cars table columns:', data);
  } catch (error) {
    console.error('Cars table check error:', error);
  }
}

async function fetchSampleCar() {
  try {
    console.log('\nFetching sample car data...');
    
    // Try to fetch a car with all fields
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching sample car:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Sample car fields:');
      const car = data[0];
      Object.keys(car).forEach(key => {
        console.log(`- ${key}:`, typeof car[key]);
        if (Array.isArray(car[key])) {
          console.log(`  Array length: ${car[key].length}`);
          if (car[key].length > 0) {
            console.log(`  First item:`, car[key][0]);
          }
        } else if (typeof car[key] === 'object' && car[key] !== null) {
          console.log(`  Object keys:`, Object.keys(car[key]));
        }
      });
    } else {
      console.log('No cars found in database');
    }
  } catch (error) {
    console.error('Sample car fetch error:', error);
  }
}

checkTables();