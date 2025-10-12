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

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

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

describe('CarCardModern', () => {
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

  const mockProfile = { id: 'user1', phone: '+919876543210' };
  const mockAuthContext = {
    user: mockUser,
    session: null,
    isLoading: false,
    isAdmin: false,
    profile: mockProfile,
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

  it('renders car information correctly', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('Tesla Model S')).toBeInTheDocument();
    expect(screen.getByText('(2023)')).toBeInTheDocument();
    expect(screen.getByText('Hyderabad')).toBeInTheDocument();
    expect(screen.getByText('₹1,000/day')).toBeInTheDocument();
    // Since we're mocking ImageCarousel, we won't check for specific image elements
  });

  it('shows correct badges', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('shows car specifications', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('Seats: 5')).toBeInTheDocument();
    expect(screen.getByText('electric')).toBeInTheDocument();
    expect(screen.getByText('automatic')).toBeInTheDocument();
  });

  it('handles book now click when available', () => {
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

  it('disables book button when not available', () => {
    // Create a car that's not available by setting status to something other than published
    const unavailableCar = { 
      ...mockCar, 
      isAvailable: false,
      status: 'unpublished' // This will make isPublished false
    };
    
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <CarCardModern car={unavailableCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    const bookButton = screen.getByTestId('bookNow');
    expect(bookButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('toggles save button', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    const saveButton = screen.getByLabelText('Save car');
    expect(saveButton).toBeInTheDocument();
    
    fireEvent.click(saveButton);
    // After clicking, the heart should be filled (we can check the class or color)
    const heartIcon = saveButton.querySelector('svg');
    expect(heartIcon).toBeInTheDocument();
  });
  
  it('redirects to login when user is not logged in', () => {
    // Mock no user
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
    
    // Check that navigate was called
    expect(mockNavigate).toHaveBeenCalled();
  });
  
  it('redirects to profile when user has no phone number', () => {
    // Mock user without phone
    const noPhoneContext = {
      ...mockAuthContext,
      profile: { id: 'user1', phone: undefined },
    };
    
    render(
      <AuthContext.Provider value={noPhoneContext}>
        <MemoryRouter>
          <CarCardModern car={mockCar} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    const bookButton = screen.getByTestId('bookNow');
    fireEvent.click(bookButton);
    
    // Check that saveDraftAndRedirect was called with redirectToProfile option
    expect(mockSaveDraftAndRedirect).toHaveBeenCalledWith(
      expect.any(Object),
      { redirectToProfile: true }
    );
  });
});