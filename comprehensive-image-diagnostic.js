import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function comprehensiveImageDiagnostic() {
  console.log('=== RP Cars - Comprehensive Image Diagnostic ===\n');
  
  try {
    // 1. Check project configuration
    console.log('1. Project Configuration:');
    console.log(`   Supabase URL: ${supabaseUrl}`);
    console.log(`   Anon Key: ${supabaseAnonKey ? 'Present' : 'Missing'}`);
    console.log(`   Service Role Key: ${supabaseServiceRoleKey ? 'Present' : 'Missing'}\n`);
    
    // 2. Check storage buckets
    console.log('2. Storage Buckets:');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) {
      console.error('   Error fetching buckets:', bucketsError);
    } else {
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    }
    
    // 3. Check cars-photos bucket details
    console.log('\n3. Cars-Photos Bucket Details:');
    const carsBucket = buckets?.find(b => b.name === 'cars-photos');
    if (carsBucket) {
      console.log(`   Name: ${carsBucket.name}`);
      console.log(`   Public: ${carsBucket.public}`);
      
      // List some files
      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('cars-photos')
        .list('', { limit: 5 });
        
      if (filesError) {
        console.error('   Error listing files:', filesError);
      } else {
        console.log(`   Sample files (${files.length} found):`);
        files.forEach(file => {
          console.log(`     - ${file.name}`);
        });
      }
    } else {
      console.log('   Cars-photos bucket not found!');
    }
    
    // 4. Check sample cars
    console.log('\n4. Sample Cars:');
    const { data: cars, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id, title, image_urls, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (carsError) {
      console.error('   Error fetching cars:', carsError);
    } else {
      console.log(`   Found ${cars.length} cars:`);
      for (const car of cars) {
        console.log(`\n   Car: ${car.title} (${car.id})`);
        console.log(`     Status: ${car.status}`);
        console.log(`     Created: ${car.created_at}`);
        console.log(`     Image URLs: ${JSON.stringify(car.image_urls)}`);
        
        // Check each image URL
        if (car.image_urls && car.image_urls.length > 0) {
          for (let i = 0; i < car.image_urls.length; i++) {
            const url = car.image_urls[i];
            console.log(`     Image ${i + 1}:`);
            console.log(`       URL: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
            
            // Check if it's a placeholder
            const isPlaceholder = url.includes('unsplash.com') || url.includes('placeholder');
            console.log(`       Type: ${isPlaceholder ? 'Placeholder' : 'Uploaded Image'}`);
            
            // If it's an uploaded image, check if we can access it
            if (!isPlaceholder) {
              try {
                // Try to access the image
                const response = await fetch(url, { method: 'HEAD' });
                console.log(`       Access: ${response.status} ${response.statusText}`);
              } catch (accessError) {
                console.log(`       Access Error: ${accessError.message}`);
              }
            }
          }
        } else {
          console.log('     No images');
        }
      }
    }
    
    // 5. Test image upload and URL generation
    console.log('\n5. Image Upload Test:');
    try {
      // Create a simple test image (1x1 pixel PNG in base64)
      const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const testImageBuffer = Buffer.from(testImageData, 'base64');
      const testFile = new File([testImageBuffer], 'test-image.png', { type: 'image/png' });
      
      const fileName = `test-${Date.now()}.png`;
      
      // Upload test image
      console.log('   Uploading test image...');
      const { error: uploadError } = await supabaseAdmin.storage
        .from('cars-photos')
        .upload(fileName, testFile);
        
      if (uploadError) {
        console.error('   Upload Error:', uploadError);
      } else {
        console.log('   Upload successful');
        
        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('cars-photos')
          .getPublicUrl(fileName);
          
        console.log(`   Public URL: ${publicUrlData.publicUrl}`);
        
        // Test if we can access the image
        try {
          const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          console.log(`   Access Test: ${response.status} ${response.statusText}`);
        } catch (accessError) {
          console.log(`   Access Test Error: ${accessError.message}`);
        }
        
        // Clean up - delete the test file
        await supabaseAdmin.storage
          .from('cars-photos')
          .remove([fileName]);
        console.log('   Test file cleaned up');
      }
    } catch (testError) {
      console.error('   Test Error:', testError);
    }
    
    console.log('\n=== Diagnostic Complete ===');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

comprehensiveImageDiagnostic();