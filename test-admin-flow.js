#!/usr/bin/env node

// Script to test the admin flow by creating a test car
import { createClient } from '@supabase/supabase-js';

// Configuration - using service key for admin access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or Service Key environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAdminFlow() {
  console.log('🧪 Testing admin flow by creating a test car...');
  
  // Test car data
  const testCar = {
    title: 'Test Car - ' + Date.now(),
    make: 'Maruti',
    model: 'Swift',
    year: 2023,
    seats: 5,
    fuel_type: 'petrol',
    transmission: 'manual',
    price_per_day: 2500,
    price_in_paise: 250000, // 2500 INR in paise
    currency: 'INR',
    description: 'Test car for admin flow verification',
    location_city: 'Test City',
    status: 'published',
    image_urls: ['https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800'],
    booking_status: 'available'
  };
  
  try {
    // Create the test car
    console.log('📝 Creating test car...');
    const { data: insertedCar, error: insertError } = await supabase
      .from('cars')
      .insert([testCar])
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Failed to create test car:', insertError.message);
      console.error('📋 Error details:', JSON.stringify(insertError, null, 2));
      return false;
    }
    
    console.log('✅ Test car created successfully');
    console.log('📋 Car ID:', insertedCar.id);
    console.log('📋 Currency:', insertedCar.currency);
    console.log('📋 Price in paise:', insertedCar.price_in_paise);
    
    // Verify the car exists with correct currency
    console.log('\n🔍 Verifying test car data...');
    const { data: verifiedCar, error: verifyError } = await supabase
      .from('cars')
      .select('id, title, currency, price_in_paise, image_urls')
      .eq('id', insertedCar.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Failed to verify test car:', verifyError.message);
      return false;
    }
    
    console.log('✅ Test car verified successfully');
    console.log('📋 Verified currency:', verifiedCar.currency);
    console.log('📋 Verified price in paise:', verifiedCar.price_in_paise);
    console.log('📋 Verified image URLs:', verifiedCar.image_urls?.length || 0);
    
    // Test querying with anon key
    console.log('\n🌐 Testing with anon key...');
    const anonSupabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: anonData, error: anonError } = await anonSupabase
      .from('cars')
      .select('id, title, currency, price_in_paise')
      .eq('id', insertedCar.id)
      .single();
      
    if (anonError) {
      console.error('❌ Failed to query with anon key:', anonError.message);
      return false;
    }
    
    console.log('✅ Anon key query successful');
    console.log('📋 Anon currency:', anonData.currency);
    
    // Clean up - delete the test car
    console.log('\n🧹 Cleaning up test car...');
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', insertedCar.id);
      
    if (deleteError) {
      console.warn('⚠️  Warning: Failed to cleanup test car:', deleteError.message);
    } else {
      console.log('✅ Test car deleted successfully');
    }
    
    console.log('\n🎉 Admin flow test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Admin flow test failed:', error.message);
    return false;
  }
}

// Run the test
testAdminFlow().then(success => {
  process.exit(success ? 0 : 1);
});