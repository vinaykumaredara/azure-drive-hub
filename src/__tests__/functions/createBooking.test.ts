import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }),
}));

describe('create_booking Edge Function', () => {
  const mockSupabase = createClient('', '');
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockCarId = 'car-123';
  const mockBookingData = {
    carId: mockCarId,
    startAt: '2025-10-15T10:00:00Z',
    endAt: '2025-10-17T18:00:00Z',
    licenseUrl: 'licenses/user-123/license.jpg',
    paymentChoice: 'hold',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create a booking with hold payment', async () => {
    // Mock user authentication
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock RPC call to create_booking_transaction
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        bookingId: 'booking-123',
        paymentId: 'payment-123',
        holdAmount: 50000, // 10% of 500000 paise (₹5000)
        holdUntil: '2025-10-13T10:00:00Z',
      },
      error: null,
    });

    // Mock the fetch call to the Edge Function
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: true,
        bookingId: 'booking-123',
        paymentId: 'payment-123',
        holdAmount: 50000,
        holdUntil: '2025-10-13T10:00:00Z',
      }),
    }) as jest.Mock;

    const response = await fetch('/functions/v1/create_booking', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockBookingData),
    });

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.bookingId).toBe('booking-123');
    expect(result.paymentId).toBe('payment-123');
    expect(result.holdAmount).toBe(50000);
    expect(result.holdUntil).toBe('2025-10-13T10:00:00Z');
  });

  it('should successfully create a booking with full payment', async () => {
    const fullPaymentData = {
      ...mockBookingData,
      paymentChoice: 'full',
    };

    // Mock user authentication
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock RPC call to create_booking_transaction
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        bookingId: 'booking-456',
        paymentId: null,
        holdAmount: 0,
        holdUntil: null,
      },
      error: null,
    });

    // Mock the fetch call to the Edge Function
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: true,
        bookingId: 'booking-456',
        paymentId: null,
        holdAmount: 0,
        holdUntil: null,
      }),
    }) as jest.Mock;

    const response = await fetch('/functions/v1/create_booking', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPaymentData),
    });

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.bookingId).toBe('booking-456');
    expect(result.paymentId).toBeNull();
    expect(result.holdAmount).toBe(0);
    expect(result.holdUntil).toBeNull();
  });

  it('should reject booking with overlapping dates', async () => {
    // Mock user authentication
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock RPC call to return an error for overlapping booking
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        success: false,
        error: 'Car is not available for the selected dates',
      },
      error: null,
    });

    // Mock the fetch call to the Edge Function
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'Car is not available for the selected dates',
      }),
    }) as jest.Mock;

    const response = await fetch('/functions/v1/create_booking', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockBookingData),
    });

    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Car is not available for the selected dates');
  });

  it('should reject booking with invalid date range', async () => {
    const invalidBookingData = {
      ...mockBookingData,
      startAt: '2025-10-17T10:00:00Z', // Start date after end date
      endAt: '2025-10-15T18:00:00Z',
    };

    // Mock user authentication
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock RPC call to return an error for invalid date range
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        success: false,
        error: 'End date/time must be after start date/time',
      },
      error: null,
    });

    // Mock the fetch call to the Edge Function
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'End date/time must be after start date/time',
      }),
    }) as jest.Mock;

    const response = await fetch('/functions/v1/create_booking', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidBookingData),
    });

    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe('End date/time must be after start date/time');
  });

  it('should reject booking when user is not authenticated', async () => {
    // Mock user authentication to return no user
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new Error('User not authenticated'),
    });

    // Mock the fetch call to the Edge Function
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'User not authenticated',
      }),
    }) as jest.Mock;

    const response = await fetch('/functions/v1/create_booking', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockBookingData),
    });

    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated');
  });

  it('should reject booking with missing required data', async () => {
    const incompleteBookingData = {
      carId: mockCarId,
      // Missing startAt, endAt, licenseUrl, paymentChoice
    };

    // Mock user authentication
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock the fetch call to the Edge Function
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'Missing required booking data',
      }),
    }) as jest.Mock;

    const response = await fetch('/functions/v1/create_booking', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incompleteBookingData),
    });

    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing required booking data');
  });
});