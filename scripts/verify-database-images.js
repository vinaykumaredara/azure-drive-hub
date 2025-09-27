// scripts/verify-database-images.js
// Verify that cars in the database have proper image URLs

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function verifyDatabaseImages() {
  console.log('Verifying database image URLs...');
  
  try {
    // Fetch all cars with image_urls
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, title, image_urls');
    
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    
    console.log(`Found ${cars.length} cars in database`);
    
    let validCars = 0;
    let invalidCars = 0;
    
    for (const car of cars) {
      console.log(`\nCar: ${car.title} (${car.id})`);
      
      if (!Array.isArray(car.image_urls) || car.image_urls.length === 0) {
        console.log('  ⚠ No images found');
        invalidCars++;
        continue;
      }
      
      let allValid = true;
      for (let i = 0; i < car.image_urls.length; i++) {
        const url = car.image_urls[i];
        console.log(`  Image ${i + 1}: ${url}`);
        
        if (typeof url !== 'string' || url.length === 0) {
          console.log(`    ✗ Invalid URL (empty or not string)`);
          allValid = false;
        } else if (!url.startsWith('http')) {
          console.log(`    ✗ Invalid URL (not HTTP)`);
          allValid = false;
        } else {
          console.log(`    ✓ Valid HTTP URL`);
        }
      }
      
      if (allValid) {
        validCars++;
      } else {
        invalidCars++;
      }
    }
    
    console.log(`\n=== Verification Complete ===`);
    console.log(`Valid cars: ${validCars}`);
    console.log(`Invalid cars: ${invalidCars}`);
    console.log(`Total cars: ${cars.length}`);
    
    if (invalidCars === 0) {
      console.log(`\n✓ All cars have valid image URLs!`);
      console.log(`The image display issue should now be fixed.`);
    } else {
      console.log(`\n⚠ Some cars have invalid image URLs.`);
      console.log(`Run the repair script to fix them.`);
    }
    
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

// Run the verification
verifyDatabaseImages();