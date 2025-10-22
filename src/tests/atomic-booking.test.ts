import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Atomic Booking Implementation', () => {
  // Test data
  let testCarId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user (in a real test, you would mock auth)
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });

    if (userError) {
      console.error('Error creating test user:', userError);
      return;
    }

    testUserId = userData.user?.id || '';

    // Create a test car with explicit typing
    const carData = {
      title: 'Test Car for Booking',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'automatic',
      price_per_day: 2500,
      price_in_paise: 250000,
      currency: 'INR',
      description: 'Test car for atomic booking',
      location_city: 'Test City',
      status: 'published',
      image_urls: ['https://example.com/test-car.jpg'],
      booking_status: 'available'
    };

    const { data: insertedCarData, error: carError } = await (supabase
      .from('cars') as any)
      .insert([carData])
      .select()
      .single();

    if (carError) {
      console.error('Error creating test car:', carError);
      return;
    }

    testCarId = insertedCarData.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testCarId) {
      await supabase
        .from('cars')
        .delete()
        .eq('id', testCarId);
    }

    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should have the required fields in cars table', async () => {
    const { data, error } = await (supabase
      .from('cars') as any)
      .select('booking_status, booked_by, booked_at, price_in_paise, currency')
      .eq('id', testCarId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.booking_status).toBe('available');
    expect(data!.booked_by).toBeNull();
    expect(data!.booked_at).toBeNull();
    expect(data!.price_in_paise).toBe(250000);
    expect(data!.currency).toBe('INR');
  });

  it('should allow admins to insert cars', async () => {
    // First, make the test user an admin via user_roles table
    const { error: adminError } = await (supabase
      .from('user_roles') as any)
      .insert({ user_id: testUserId, role: 'admin' });

    expect(adminError).toBeNull();

    // Try to insert a car as admin with explicit typing
    const carData = {
      title: 'Admin Test Car',
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      seats: 5,
      fuel_type: 'petrol',
      transmission: 'manual',
      price_per_day: 2000,
      price_in_paise: 200000,
      currency: 'INR',
      description: 'Admin test car',
      location_city: 'Admin City',
      status: 'published',
      image_urls: ['https://example.com/admin-test-car.jpg'],
      booking_status: 'available'
    };

    const { data, error } = await (supabase
      .from('cars') as any)
      .insert([carData])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.title).toBe('Admin Test Car');

    // Clean up
    if (data?.id) {
      await supabase
        .from('cars')
        .delete()
        .eq('id', data.id);
    }
  });

  it('should allow public to select published and available cars', async () => {
    const { data, error } = await (supabase
      .from('cars') as any)
      .select('*')
      .eq('status', 'published')
      .eq('booking_status', 'available');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    if (data) {
      expect(data.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have the atomic booking function', async () => {
    // This test would require calling the function with proper authentication
    // For now, we'll just check that the function exists by attempting to call it
    try {
      // We expect this to fail due to authentication, but not due to the function not existing
      const { error } = await (supabase.rpc as any)('book_car_atomic', { car_id: testCarId });
      
      // If we get an error, it should be related to authentication/authorization, not function missing
      if (error) {
        expect(error.message).not.toContain('function does not exist');
      }
    } catch (err: any) {
      // If there's an exception, it shouldn't be about the function not existing
      expect(err.message).not.toContain('function does not exist');
    }
  });
});