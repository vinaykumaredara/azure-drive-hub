// Legacy data handling script
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

// Fallback image URL
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

async function handleLegacyData() {
  console.log('=== Legacy Data Handling Script ===\n');
  
  try {
    // Fetch all cars with image URLs
    console.log('1. Fetching all cars with image URLs...');
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null);
    
    if (error) throw error;
    
    console.log(`✅ Found ${cars.length} cars with image URLs`);
    
    let problematicCars = [];
    
    // Check each car's image URLs
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n--- Checking Car ${i + 1}: ${car.title} (${car.id}) ---`);
      
      if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        let hasIssues = false;
        let validUrls = [];
        
        for (let j = 0; j < car.image_urls.length; j++) {
          const url = car.image_urls[j];
          console.log(`  Image ${j + 1}: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
          
          try {
            // Test if URL is accessible
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              method: 'HEAD', 
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              // Check if it's actually an image
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image')) {
                console.log('    ✅ Accessible and is an image');
                validUrls.push(url);
              } else {
                console.log('    ❌ Accessible but not an image (Content-Type:', contentType, ')');
                hasIssues = true;
              }
            } else {
              console.log('    ❌ Not accessible (Status:', response.status, ')');
              hasIssues = true;
            }
          } catch (err) {
            console.log('    ❌ Error testing accessibility:', err.message);
            hasIssues = true;
          }
        }
        
        if (hasIssues) {
          problematicCars.push({
            id: car.id,
            title: car.title,
            image_urls: car.image_urls,
            validUrls: validUrls
          });
        }
      } else {
        console.log('  ❌ No valid image URLs found');
        problematicCars.push({
          id: car.id,
          title: car.title,
          image_urls: car.image_urls,
          validUrls: []
        });
      }
    }
    
    console.log('\n=== Problematic Cars Summary ===');
    if (problematicCars.length > 0) {
      console.log(`Found ${problematicCars.length} cars with issues:`);
      problematicCars.forEach((car, index) => {
        console.log(`  ${index + 1}. ${car.title} (${car.id})`);
        console.log(`     Valid URLs: ${car.validUrls.length}/${car.image_urls.length}`);
      });
      
      console.log('\n=== Recommended Actions ===');
      console.log('1. For cars with some invalid URLs:');
      console.log('   - Replace invalid URLs with fallback image');
      console.log('   - Consider re-uploading those images');
      console.log('2. For cars with all invalid URLs:');
      console.log('   - Replace entire array with fallback image');
      console.log('   - Notify admin for manual re-upload');
      
      // Generate repair script
      console.log('\n=== Repair Script ===');
      console.log('// Run this in Supabase SQL editor to fix problematic cars:');
      problematicCars.forEach((car, index) => {
        if (car.validUrls.length === 0) {
          // All URLs are invalid, replace with fallback
          console.log(`UPDATE cars SET image_urls = ARRAY['${FALLBACK_IMAGE}']::TEXT[] WHERE id = '${car.id}';`);
        } else if (car.validUrls.length < car.image_urls.length) {
          // Some URLs are invalid, keep only valid ones
          const validUrlsString = car.validUrls.map(url => `'${url}'`).join(', ');
          console.log(`UPDATE cars SET image_urls = ARRAY[${validUrlsString}]::TEXT[] WHERE id = '${car.id}';`);
        }
      });
    } else {
      console.log('✅ No problematic cars found! All image URLs are valid.');
    }
    
  } catch (err) {
    console.error('Error during legacy data handling:', err);
  }
}

handleLegacyData();