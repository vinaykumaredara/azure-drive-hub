// scripts/user-flow-test.js
// Test the complete user flow from database to UI

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

// Mock the resolveCarImageUrls function
function resolveCarImageUrls(car) {
  if (!car) return car;
  if (Array.isArray(car.image_urls) && car.image_urls.length) return car;
  return car;
}

async function testUserFlow() {
  console.log('Testing complete user flow...');
  
  try {
    // Simulate user fetching cars
    console.log('\n1. Simulating user car fetch...');
    
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
      console.error('   Error fetching cars:', error);
      return;
    }
    
    console.log(`   Fetched ${data.length} cars`);
    
    // Process images like the useCars hook does
    const processedCars = (data || []).map(resolveCarImageUrls);
    
    console.log('\n2. Checking processed car data...');
    
    for (const car of processedCars) {
      console.log(`   \n   Car: ${car.title} (${car.id})`);
      
      if (!Array.isArray(car.image_urls) || car.image_urls.length === 0) {
        console.log('     ⚠ No images found');
        continue;
      }
      
      console.log(`     Images: ${car.image_urls.length}`);
      
      for (let i = 0; i < car.image_urls.length; i++) {
        const url = car.image_urls[i];
        const isValid = typeof url === 'string' && url.length > 0 && url.startsWith('http');
        console.log(`     Image ${i + 1}: ${isValid ? '✓' : '✗'} ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
        
        if (isValid) {
          try {
            // Test if the URL is accessible
            const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
            console.log(`       Accessibility: ${response.ok ? '✓' : '✗'} (${response.status})`);
          } catch (err) {
            console.log(`       Accessibility: ✗ (${err.message})`);
          }
        }
      }
    }
    
    console.log('\n=== User Flow Test Complete ===');
    console.log('This simulates what happens in the useCars hook and CarCard component.');
    console.log('If all images show ✓, the user interface should display them correctly.');
    
  } catch (err) {
    console.error('Error during user flow test:', err);
  }
}

// Run the test
testUserFlow();