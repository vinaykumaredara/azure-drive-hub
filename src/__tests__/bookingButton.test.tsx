import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CarCardModern } from '@/components/CarCardModern';
import { AuthContext } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useBooking
const mockSaveDraftAndRedirect = vi.fn();
vi.mock('@/hooks/useBooking', () => ({
  useBooking: () => ({
    saveDraftAndRedirect: mockSaveDraftAndRedirect,
    pendingBooking: null,
    clearDraft: vi.fn(),
    checkLicenseStatus: vi.fn(),
    createBookingHold: vi.fn(),
  }),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('Booking Button', () => {
  const mockCar = {
    id: '1',
    title: 'Test Car',
    model: 'Model S',
    make: 'Tesla',
    year: 2023,
    image: 'https://example.com/car.jpg',
    images: ['https://example.com/car.jpg'],
    pricePerDay: 1000,
    location: 'Hyderabad',
    fuel: 'electric',
    transmission: 'automatic',
    seats: 5,
    rating: 4.5,
    reviewCount: 10,
    isAvailable: true,
    badges: ['Available', 'Verified'],
    status: 'published',
    bookingStatus: undefined,
  };

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

  beforeEach(() => {
    mockNavigate.mockReset();
    mockSaveDraftAndRedirect.mockReset();
    mockSessionStorage.setItem.mockReset();
  });

  it('navigates to booking page when user is logged in and has phone', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    const bookButton = screen.getByTestId('bookNow');
    fireEvent.click(bookButton);
    
    // Check that navigate was called with the correct URL
    expect(mockNavigate).toHaveBeenCalledWith('/booking/1');
  });

  it('calls saveDraftAndRedirect when user is not logged in', () => {
    const noUserContext = {
      ...mockAuthContext,
      user: null,
      profile: null,
    };
    
    render(
      <AuthContext.Provider value={noUserContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    const bookButton = screen.getByTestId('bookNow');
    fireEvent.click(bookButton);
    
    // Check that saveDraftAndRedirect was called
    expect(mockSaveDraftAndRedirect).toHaveBeenCalled();
  });
});