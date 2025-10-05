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

async function diagnoseCarImages() {
  try {
    console.log('\n=== Car Images Diagnostics ===');
    
    // Fetch a few cars with images
    console.log('\n1. Fetching cars with images...');
    const { data: cars, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id, title, image_urls, status')
      .not('image_urls', 'is', null)
      .limit(3);
    
    if (carsError) {
      console.error('Error fetching cars:', carsError);
      return;
    }
    
    console.log(`Found ${cars.length} cars with images:`);
    
    for (const car of cars) {
      console.log(`\n--- Car: ${car.title} (${car.id}) ---`);
      console.log(`Status: ${car.status}`);
      console.log(`Image URLs:`, car.image_urls);
      
      if (car.image_urls && car.image_urls.length > 0) {
        for (let i = 0; i < car.image_urls.length; i++) {
          const imageUrl = car.image_urls[i];
          console.log(`\nImage ${i + 1}: ${imageUrl}`);
          
          // Determine if it's a full URL or a path
          if (imageUrl.startsWith('http')) {
            console.log('  Type: Full URL');
            
            // Try to fetch it with anon client
            try {
              console.log('  Testing with anon client...');
              const response = await fetch(imageUrl);
              console.log(`  Status: ${response.status} ${response.statusText}`);
              
              if (response.ok) {
                const contentType = response.headers.get('content-type');
                console.log(`  Content-Type: ${contentType}`);
              }
            } catch (fetchError) {
              console.error('  Fetch error:', fetchError.message);
            }
          } else {
            console.log('  Type: File path');
            
            // Try to get public URL
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('cars-photos')
              .getPublicUrl(imageUrl);
            
            console.log(`  Public URL: ${publicUrlData?.publicUrl || 'None'}`);
            
            // Try to fetch the public URL
            if (publicUrlData?.publicUrl) {
              try {
                console.log('  Testing public URL...');
                const response = await fetch(publicUrlData.publicUrl);
                console.log(`  Status: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                  const contentType = response.headers.get('content-type');
                  console.log(`  Content-Type: ${contentType}`);
                }
              } catch (fetchError) {
                console.error('  Fetch error:', fetchError.message);
              }
            }
            
            // Try to create signed URL
            console.log('  Creating signed URL...');
            const { data: signedData, error: signedError } = await supabaseAdmin.storage
              .from('cars-photos')
              .createSignedUrl(imageUrl, 60); // 1 minute TTL
            
            if (signedError) {
              console.error('  Signed URL error:', signedError.message);
            } else {
              console.log(`  Signed URL: ${signedData?.signedUrl || 'None'}`);
              
              // Try to fetch the signed URL
              if (signedData?.signedUrl) {
                try {
                  console.log('  Testing signed URL...');
                  const response = await fetch(signedData.signedUrl);
                  console.log(`  Status: ${response.status} ${response.statusText}`);
                  
                  if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    console.log(`  Content-Type: ${contentType}`);
                  }
                } catch (fetchError) {
                  console.error('  Fetch error:', fetchError.message);
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Car images diagnostics error:', error);
  }
}

// Call the function only once
diagnoseCarImages();