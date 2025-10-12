import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NewBookNowButton } from '@/components/NewBookNowButton';

// Mock the useBookingFlow hook
vi.mock('@/hooks/useBookingFlow', () => ({
  useBookingFlow: () => ({
    isBookingModalOpen: false,
    openBookingModal: vi.fn(),
    closeBookingModal: vi.fn()
  })
}));

// Mock the useAuth hook
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    profileLoading: false
  })
}));

// Mock the PhoneModal component
vi.mock('@/components/PhoneModal', () => ({
  PhoneModal: () => <div data-testid="phone-modal">Phone Modal</div>
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

delete (window as any).location;
(window as any).location = mockLocation;

describe('NewBookNowButton', () => {
  const mockCar = {
    id: 'car-123',
    title: 'Test Car',
    model: 'Model S',
    make: 'Tesla',
    year: 2022,
    image: 'test-image.jpg',
    pricePerDay: 100,
    location: 'Hyderabad',
    fuel: 'Electric',
    transmission: 'Automatic',
    seats: 5,
    rating: 4.8,
    reviewCount: 25,
    isAvailable: true,
    badges: ['Available', 'Verified']
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('should render the button with correct text', () => {
    render(<NewBookNowButton car={mockCar} />);
    
    const button = screen.getByText('Book Now');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should save pending intent and redirect when user is not authenticated', async () => {
    render(<NewBookNowButton car={mockCar} />);
    
    const button = screen.getByText('Book Now');
    fireEvent.click(button);
    
    await waitFor(() => {
      const saved = localStorage.getItem('pendingIntent');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.type).toBe('BOOK_CAR');
      expect(parsed.carId).toBe('car-123');
      
      // Check that the redirect URL contains the next parameter
      expect(window.location.href).toContain('/auth?next=');
    });
  });
});