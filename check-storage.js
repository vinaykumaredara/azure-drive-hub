// Check storage bucket configuration
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkStorage() {
  console.log('=== Storage Bucket Check ===');
  
  try {
    // Try to list files in the bucket
    console.log('1. Checking if cars-photos bucket exists and is accessible...');
    const { data, error } = await supabase.storage.from('cars-photos').list('', {
      limit: 1
    });
    
    if (error) {
      console.error('❌ Error accessing bucket:', error);
      return;
    }
    
    console.log('✅ Bucket is accessible');
    
    // Check a sample file if exists
    if (data && data.length > 0) {
      console.log('2. Checking sample file accessibility...');
      const fileName = data[0].name;
      const { data: publicUrlData } = supabase.storage.from('cars-photos').getPublicUrl(fileName);
      
      if (publicUrlData?.publicUrl) {
        console.log('✅ Public URL generated:', publicUrlData.publicUrl);
        
        // Test if URL is accessible
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(publicUrlData.publicUrl, { 
            method: 'HEAD', 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('✅ Public URL is accessible (Status:', response.status, ')');
            console.log('✅ Content-Type:', response.headers.get('content-type'));
          } else {
            console.log('❌ Public URL not accessible (Status:', response.status, ')');
          }
        } catch (err) {
          console.log('❌ Error accessing public URL:', err.message);
        }
      }
    } else {
      console.log('⚠ No files found in bucket');
    }
    
    console.log('\n=== Manual Verification Steps ===');
    console.log('1. Log into Supabase Dashboard');
    console.log('2. Go to Storage > cars-photos bucket');
    console.log('3. Check bucket policy allows public read access');
    console.log('4. Verify CORS settings allow all domains (*)');
    
  } catch (err) {
    console.error('Error during storage check:', err);
  }
}

checkStorage();