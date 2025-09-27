import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSampleCars() {
  console.log('=== Checking Sample Cars ===\n');
  
  try {
    // Get sample cars
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, image_urls, image_paths, published, status')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log('Sample cars:');
    data.forEach((car, index) => {
      console.log(`\nCar ${index + 1}:`);
      console.log(`  ID: ${car.id}`);
      console.log(`  Title: ${car.title}`);
      console.log(`  Published: ${car.published}`);
      console.log(`  Status: ${car.status}`);
      console.log(`  Image URLs: ${JSON.stringify(car.image_urls)}`);
      console.log(`  Image Paths: ${JSON.stringify(car.image_paths)}`);
    });
    
    // Check bucket settings
    console.log('\n=== Checking Storage Bucket ===');
    // We'll need to check this through the Supabase dashboard or API
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSampleCars();