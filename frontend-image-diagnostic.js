import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and keys
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function frontendImageDiagnostic() {
  console.log('=== Frontend Image Diagnostic ===\n');
  
  try {
    // Simulate how the frontend fetches cars
    console.log('1. Fetching cars as frontend would...');
    const { data, error } = await supabase
      .from('cars')
      .select(`
        id,
        title,
        make,
        model,
        year,
        seats,
        fuel_type,
        transmission,
        price_per_day,
        price_per_hour,
        description,
        location_city,
        status,
        image_urls,
        created_at,
        price_in_paise,
        currency,
        booking_status,
        booked_by,
        booked_at
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('   Fetch Error:', error);
      return;
    }
    
    console.log(`   Found ${data.length} published cars`);
    
    // Process images like the frontend does
    console.log('\n2. Processing images like frontend...');
    for (const car of data) {
      console.log(`\n   Car: ${car.title} (${car.id})`);
      
      if (car.image_urls?.length) {
        console.log(`     Raw image URLs: ${JSON.stringify(car.image_urls)}`);
        
        // Process each image URL like the frontend does
        const processedImages = car.image_urls.map((url, index) => {
          console.log(`     Processing image ${index + 1}:`);
          console.log(`       Raw URL: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
          
          // Check if it's already a full URL
          const isFullUrl = url.startsWith('http');
          console.log(`       Is full URL: ${isFullUrl}`);
          
          if (isFullUrl) {
            console.log(`       Using as-is`);
            return url;
          } else {
            console.log(`       Would convert to public/signed URL`);
            // In frontend, this would call getPublicOrSignedUrl(url)
            return url; // Just return as-is for this test
          }
        });
        
        console.log(`     Processed images: ${JSON.stringify(processedImages)}`);
      } else {
        console.log('     No images');
      }
    }
    
    console.log('\n=== Diagnostic Complete ===');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

frontendImageDiagnostic();