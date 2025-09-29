// Script to diagnose user dashboard image issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseUserDashboardImages() {
  try {
    console.log('🔍 Diagnosing user dashboard image issues...\n');
    
    // 1. Check if the required columns exist
    console.log('1. Checking database schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cars')
      .in('column_name', ['image_paths', 'image_urls']);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError.message);
      return;
    }

    const columnNames = columns.map(col => col.column_name);
    const hasImagePaths = columnNames.includes('image_paths');
    const hasImageUrls = columnNames.includes('image_urls');
    
    console.log(`   ✓ image_paths column: ${hasImagePaths ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✓ image_urls column: ${hasImageUrls ? 'FOUND' : 'MISSING'}`);
    
    if (!hasImagePaths || !hasImageUrls) {
      console.log('\n   🔧 FIX: Run the SQL migration to add missing columns:');
      console.log('   ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_paths text[] DEFAULT ARRAY[]::text[], ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];');
      return;
    }
    
    // 2. Check if there are any published cars
    console.log('\n2. Checking for published cars...');
    const { count, error: countError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (countError) {
      console.error('❌ Error counting published cars:', countError.message);
      return;
    }

    console.log(`   Found ${count} published cars`);
    
    if (count === 0) {
      console.log('   ⚠️  No published cars found. Add some cars through the admin dashboard.');
      return;
    }
    
    // 3. Check image data for a sample of cars
    console.log('\n3. Checking image data for sample cars...');
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, title, image_paths, image_urls')
      .eq('status', 'published')
      .limit(3);

    if (carsError) {
      console.error('❌ Error fetching cars:', carsError.message);
      return;
    }

    if (cars.length === 0) {
      console.log('   ⚠️  No cars with image data found.');
      return;
    }

    console.log(`   Analyzing ${cars.length} sample cars:`);
    
    cars.forEach((car, index) => {
      console.log(`\n   Car ${index + 1}: ${car.title} (ID: ${car.id})`);
      
      // Check image_paths
      if (car.image_paths && Array.isArray(car.image_paths) && car.image_paths.length > 0) {
        console.log(`     ✓ image_paths: ${car.image_paths.length} images`);
        car.image_paths.forEach((path, i) => {
          console.log(`       ${i + 1}. ${path}`);
        });
      } else {
        console.log('     ⚠️  image_paths: EMPTY or MISSING');
      }
      
      // Check image_urls
      if (car.image_urls && Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        console.log(`     ✓ image_urls: ${car.image_urls.length} images`);
        car.image_urls.forEach((url, i) => {
          console.log(`       ${i + 1}. ${url}`);
        });
      } else {
        console.log('     ⚠️  image_urls: EMPTY or MISSING');
      }
    });
    
    // 4. Validate image URLs
    console.log('\n4. Validating image URLs...');
    for (const car of cars) {
      if (car.image_urls && Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        console.log(`\n   Validating URLs for car: ${car.title}`);
        for (const [index, url] of car.image_urls.entries()) {
          try {
            // Simple validation - check if it looks like a valid URL
            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
              console.log(`     ✓ URL ${index + 1}: Valid format`);
            } else {
              console.log(`     ❌ URL ${index + 1}: Invalid format - ${url}`);
            }
          } catch (err) {
            console.log(`     ❌ URL ${index + 1}: Error validating - ${err.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Diagnosis complete!');
    console.log('\n🔧 If images still don\'t show in the user dashboard:');
    console.log('   1. Check browser console for JavaScript errors');
    console.log('   2. Verify image URLs are accessible');
    console.log('   3. Check browser network tab for failed image requests');
    console.log('   4. Ensure Supabase storage bucket permissions are correct');
    
  } catch (err) {
    console.error('Unexpected error during diagnosis:', err);
  }
}

diagnoseUserDashboardImages();