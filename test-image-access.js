import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Create Supabase clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testImageAccess() {
  try {
    console.log('\n=== Image Access Test ===');
    
    // Create a simple test file
    const testContent = 'This is a test file for image access verification';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    console.log(`\n1. Uploading test file: ${testFileName}`);
    
    // Upload test file
    const { error: uploadError } = await supabaseAdmin.storage
      .from('cars-photos')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }
    
    console.log('Upload successful');
    
    // Try to get public URL
    console.log('\n2. Getting public URL...');
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('cars-photos')
      .getPublicUrl(testFileName);
    
    console.log('Public URL:', publicUrlData?.publicUrl || 'None');
    
    // Try to create signed URL
    console.log('\n3. Creating signed URL...');
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('cars-photos')
      .createSignedUrl(testFileName, 60); // 1 minute TTL
    
    if (signedError) {
      console.error('Signed URL error:', signedError);
    } else {
      console.log('Signed URL:', signedData?.signedUrl || 'None');
    }
    
    // Clean up - delete the test file
    console.log('\n4. Cleaning up test file...');
    const { error: deleteError } = await supabaseAdmin.storage
      .from('cars-photos')
      .remove([testFileName]);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log('Test file deleted successfully');
    }
    
  } catch (error) {
    console.error('Image access test error:', error);
  }
}

testImageAccess();