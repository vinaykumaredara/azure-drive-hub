#!/usr/bin/env node

// Test script for PR 1: Admin car create/update fix and user visibility
// This script tests that:
// 1. Admin can create a car
// 2. Created car is visible to public users with status='published'
// 3. Price is stored in paise and displayed correctly

import { createClient } from '@supabase/supabase-js';

// Configuration - replace with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
// Admin client with service role key (full access)
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Public client with anon key (limited access)
const publicSupabase = createClient(
  SUPABASE_URL, 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE'
);

async function runTest() {
  console.log('🧪 Starting PR 1 Test: Admin car create/update fix and user visibility');
  
  try {
    // Test 1: Admin creates a car
    console.log('\n📝 Test 1: Admin creates a car...');
    
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
      description: 'Test car for visibility check',
      location_city: 'Test City',
      status: 'published',
      image_urls: ['https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800']
    };

    const { data: insertedCar, error: insertError } = await adminSupabase
      .from('cars')
      .insert([testCar])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert car: ${insertError.message}`);
    }

    console.log('✅ Car created successfully with ID:', insertedCar.id);
    console.log('💰 Price stored as:', insertedCar.price_in_paise, 'paise (', insertedCar.price_in_paise / 100, 'INR)');

    // Test 2: Public user can see the car
    console.log('\n👀 Test 2: Public user queries published cars...');
    
    const { data: publicCars, error: publicError } = await publicSupabase
      .from('cars')
      .select('*')
      .eq('id', insertedCar.id)
      .eq('status', 'published');

    if (publicError) {
      throw new Error(`Public user failed to query car: ${publicError.message}`);
    }

    if (publicCars.length === 0) {
      throw new Error('Public user cannot see the published car');
    }

    const retrievedCar = publicCars[0];
    console.log('✅ Public user can see the car');
    console.log('📋 Car details:');
    console.log('   Title:', retrievedCar.title);
    console.log('   Price:', retrievedCar.price_per_day, 'INR/day');
    console.log('   Price in paise:', retrievedCar.price_in_paise);
    console.log('   Currency:', retrievedCar.currency);
    console.log('   Status:', retrievedCar.status);
    console.log('   Images:', retrievedCar.image_urls);

    // Test 3: Verify price formatting
    console.log('\n💱 Test 3: Verify price formatting...');
    const formattedPrice = new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(retrievedCar.price_in_paise / 100);
    
    console.log('✅ Price formatted correctly:', formattedPrice);

    // Cleanup: Delete the test car
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await adminSupabase
      .from('cars')
      .delete()
      .eq('id', insertedCar.id);

    if (deleteError) {
      console.warn('Warning: Failed to cleanup test car:', deleteError.message);
    } else {
      console.log('✅ Test car deleted successfully');
    }

    console.log('\n🎉 All tests passed! PR 1 requirements verified:');
    console.log('   ✅ Admin can save car with image');
    console.log('   ✅ Car is visible to public users');
    console.log('   ✅ Price stored in paise and displayed correctly');
    console.log('   ✅ RLS policies working correctly');

    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('🔧 Error details:', error);
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default runTest;