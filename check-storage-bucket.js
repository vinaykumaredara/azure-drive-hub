import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkStorageBucket() {
  console.log('=== Checking Storage Bucket ===\n');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Error fetching buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });
    
    // Check if cars-photos bucket exists and is public
    const carsBucket = buckets.find(b => b.name === 'cars-photos');
    if (carsBucket) {
      console.log(`\nCars bucket found: ${carsBucket.name}`);
      console.log(`Public: ${carsBucket.public}`);
      
      // List files in the bucket
      const { data: files, error: filesError } = await supabase
        .storage
        .from('cars-photos')
        .list('', {
          limit: 10,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (filesError) {
        console.error('Error listing files:', filesError);
      } else {
        console.log(`\nFiles in bucket (${files.length} found):`);
        files.forEach(file => {
          console.log(`  - ${file.name} (${file.id})`);
        });
      }
    } else {
      console.log('\nCars-photos bucket not found!');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStorageBucket();