import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import BookingPage from '@/pages/Booking';
import type { User } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  functions: {
    invoke: vi.fn()
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock useAuth
const mockUser: User = {
  id: 'user1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@example.com',
  phone: '+919876543210',
  role: 'authenticated',
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  identities: [],
};

const mockAuthContext = {
  user: mockUser,
  session: null,
  isLoading: false,
  isAdmin: false,
  profile: { id: 'user1', phone: '+919876543210' },
  profileLoading: false,
  refreshProfile: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
};

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock car data
    mockSupabase.single.mockResolvedValue({
      data: {
        id: '1',
        title: 'Test Car',
        make: 'Tesla',
        model: 'Model S',
        year: 2023,
        price_per_day: 1000,
        service_charge: 50,
        location_city: 'Hyderabad',
        status: 'active',
        image_urls: ['https://example.com/car.jpg'],
        created_at: new Date().toISOString()
      },
      error: null
    });
    
    // Mock payment creation
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        paymentUrl: 'https://payment.example.com/pay',
        orderId: 'order123'
      },
      error: null
    });
  });

  it('completes the full booking flow', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/booking/1']}>
          <Routes>
            <Route path="/booking/:carId" element={<BookingPage />} />
            <Route path="/booking-success/:id" element={<div>Booking Success</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for car data to load
    await waitFor(() => {
      expect(screen.getByText('Test Car')).toBeInTheDocument();
    });

    // Step 1: Phone (already provided in profile, should skip to dates)
    // Step 2: Select dates and times
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const pickupDate = screen.getByLabelText('Pickup Date');
    const returnDate = screen.getByLabelText('Return Date');

    fireEvent.change(pickupDate, { target: { value: tomorrow.toISOString().split('T')[0] } });
    fireEvent.change(returnDate, { target: { value: dayAfter.toISOString().split('T')[0] } });

    // Click Continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Step 3: License upload
    // Mock file upload
    const file = new File(['dummy content'], 'license.jpg', { type: 'image/jpeg' });
    const licenseInput = screen.getByText('Upload License');
    // We can't directly test file upload in this simplified test

    // For now, let's just click continue assuming license is uploaded
    fireEvent.click(continueButton);

    // Step 4: Terms and payment options
    const termsCheckbox = screen.getByLabelText(/I accept the/);
    fireEvent.click(termsCheckbox);

    // Select full payment
    const fullPaymentButton = screen.getByText('Full Payment');
    fireEvent.click(fullPaymentButton);

    // Click Confirm Booking
    const confirmButton = screen.getByText('Confirm Booking');
    fireEvent.click(confirmButton);

    // Wait for payment processing
    await waitFor(() => {
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-booking', expect.any(Object));
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Booking Created')).toBeInTheDocument();
    });
  });

  it('persists booking state across steps', async () => {
    // Mock existing booking state
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'bookingState') {
        return JSON.stringify({
          step: 'dates',
          phoneNumber: '+919876543210',
          pickupDate: '',
          returnDate: '',
          pickupTime: '10:00',
          returnTime: '18:00',
          licenseUploaded: false,
          licensePath: null,
          termsAccepted: false,
          payMode: 'full'
        });
      }
      return null;
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/booking/1']}>
          <Routes>
            <Route path="/booking/:carId" element={<BookingPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Should start at dates step (from persisted state)
    await waitFor(() => {
      expect(screen.getByLabelText('Pickup Date')).toBeInTheDocument();
    });

    // Verify state was saved
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('bookingState', expect.stringContaining('dates'));
  });
});