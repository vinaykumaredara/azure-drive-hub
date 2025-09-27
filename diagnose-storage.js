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

async function diagnoseStorage() {
  try {
    console.log('\n=== Storage Bucket Diagnostics ===');
    
    // Check storage buckets
    console.log('\n1. Checking storage buckets...');
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
    
    // Check cars-photos bucket specifically
    const carsBucket = buckets.find(b => b.name === 'cars-photos');
    if (carsBucket) {
      console.log(`\n2. Cars-photos bucket details:`);
      console.log(`   Public: ${carsBucket.public}`);
      console.log(`   Created: ${carsBucket.created_at}`);
      console.log(`   Updated: ${carsBucket.updated_at}`);
    } else {
      console.log(`\n2. Cars-photos bucket not found!`);
    }
    
    // Try to list objects in the bucket
    console.log('\n3. Listing objects in cars-photos bucket...');
    const { data: objects, error: objectsError } = await supabase
      .storage
      .from('cars-photos')
      .list('', { limit: 5 });
    
    if (objectsError) {
      console.error('Error listing objects:', objectsError);
    } else {
      console.log(`Found ${objects.length} objects:`);
      objects.forEach(obj => {
        console.log(`- ${obj.name} (${obj.id})`);
      });
      
      // Try to get public URL for first object
      if (objects.length > 0) {
        const firstObject = objects[0];
        console.log(`\n4. Testing public URL for ${firstObject.name}...`);
        
        const { data: publicUrlData } = supabase.storage
          .from('cars-photos')
          .getPublicUrl(firstObject.name);
        
        console.log(`   Public URL: ${publicUrlData?.publicUrl || 'None'}`);
        
        // Try to create signed URL
        console.log(`\n5. Testing signed URL for ${firstObject.name}...`);
        const { data: signedData, error: signedError } = await supabase.storage
          .from('cars-photos')
          .createSignedUrl(firstObject.name, 60); // 1 minute TTL
        
        if (signedError) {
          console.error('Error creating signed URL:', signedError);
        } else {
          console.log(`   Signed URL: ${signedData?.signedUrl || 'None'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Storage diagnostics error:', error);
  }
}

diagnoseStorage();