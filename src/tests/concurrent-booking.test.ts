import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Concurrent Booking Test', () => {
  let testCarId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    });

    if (userError) {
      console.error('Error creating test user:', userError);
      return;
    }

    testUserId = userData.user?.id || '';

    // Create a test car
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .insert({
        title: 'Concurrent Test Car',
        make: 'Toyota',
        model: 'Corolla',
        year: 2023,
        seats: 5,
        fuel_type: 'petrol',
        transmission: 'automatic',
        price_per_day: 3000,
        price_in_paise: 300000,
        currency: 'INR',
        description: 'Test car for concurrent booking',
        location_city: 'Test City',
        status: 'published',
        image_urls: ['https://example.com/test-car.jpg'],
        booking_status: 'available'
      })
      .select()
      .single();

    if (carError) {
      console.error('Error creating test car:', carError);
      return;
    }

    testCarId = carData.id;
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

  it('should only allow one successful booking when called concurrently', async () => {
    // Make two concurrent booking requests
    const booking1 = supabase.rpc('book_car_atomic', { car_id: testCarId });
    const booking2 = supabase.rpc('book_car_atomic', { car_id: testCarId });

    // Wait for both requests to complete
    const [result1, result2] = await Promise.all([booking1, booking2]);

    // One should succeed and one should fail
    const successCount = [result1, result2].filter(result => 
      result.data && (result.data as any).success
    ).length;

    const failureCount = [result1, result2].filter(result => 
      result.error || (result.data && !(result.data as any).success)
    ).length;

    // Exactly one should succeed and one should fail
    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Verify the car is marked as booked
    const { data: carData } = await supabase
      .from('cars')
      .select('booking_status')
      .eq('id', testCarId)
      .single();

    expect(carData?.booking_status).toBe('booked');

    // Verify audit log was created
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'book_car')
      .limit(1);

    expect(auditLogs).toHaveLength(1);
  });
});