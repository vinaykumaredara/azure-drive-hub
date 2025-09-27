import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyBucketPublic() {
  console.log('=== Azure Drive Hub - Bucket Public Verification ===\n');
  
  try {
    // Check if the cars-photos bucket exists and is public
    const { data: buckets, error: bucketError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.error('Error fetching buckets:', bucketError);
      return;
    }
    
    const carsPhotosBucket = buckets.find(bucket => bucket.name === 'cars-photos');
    
    if (!carsPhotosBucket) {
      console.log('❌ cars-photos bucket not found!');
      console.log('Please create the bucket in your Supabase dashboard.');
      return;
    }
    
    console.log(`Bucket Name: ${carsPhotosBucket.name}`);
    console.log(`Is Public: ${carsPhotosBucket.public ? '✅ Yes' : '❌ No'}`);
    console.log(`Created At: ${carsPhotosBucket.created_at}`);
    
    if (!carsPhotosBucket.public) {
      console.log('\n🔧 To fix this:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to Storage → buckets');
      console.log('3. Find the "cars-photos" bucket');
      console.log('4. Click on the bucket name');
      console.log('5. Go to Settings tab');
      console.log('6. Enable "Public bucket" toggle');
      console.log('7. Save changes');
    } else {
      console.log('\n✅ The cars-photos bucket is correctly configured as public!');
      
      // Test public access by uploading and accessing a test file
      console.log('\n🧪 Testing public access...');
      await testPublicAccess();
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

async function testPublicAccess() {
  try {
    // Create a small test file
    const testContent = 'This is a test file to verify public access';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-public-access-${Date.now()}.txt`;
    
    // Upload test file
    console.log('Uploading test file...');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('cars-photos')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError.message);
      return;
    }
    
    console.log('✅ Test file uploaded successfully');
    
    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('cars-photos')
      .getPublicUrl(testFileName);
    
    if (!publicUrlData?.publicUrl) {
      console.error('❌ Failed to get public URL for test file');
      // Clean up and return
      await supabaseAdmin.storage.from('cars-photos').remove([testFileName]);
      return;
    }
    
    console.log('🔗 Public URL:', publicUrlData.publicUrl);
    
    // Test accessing the file
    console.log('Testing public access...');
    const response = await fetch(publicUrlData.publicUrl);
    
    if (response.status === 200) {
      console.log('✅ Public access test PASSED! The bucket is correctly configured.');
    } else {
      console.log(`❌ Public access test FAILED! Status: ${response.status}`);
      console.log('The bucket may not be properly configured as public.');
    }
    
    // Clean up test file
    console.log('Cleaning up test file...');
    await supabaseAdmin.storage.from('cars-photos').remove([testFileName]);
    console.log('✅ Test file cleaned up');
    
  } catch (err) {
    console.error('Error during public access test:', err);
  }
}

// Run the verification
verifyBucketPublic();