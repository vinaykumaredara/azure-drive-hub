import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewBookNowButton } from '@/components/NewBookNowButton';
import * as bookingIntentUtils from '@/utils/bookingIntentUtils';
import * as toast from '@/hooks/use-toast';

// Mock the useAuth hook
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    profileLoading: false,
  }),
}));

// Mock the useBookingFlow hook
jest.mock('@/hooks/useBookingFlow', () => ({
  useBookingFlow: () => ({
    isBookingModalOpen: false,
    openBookingModal: jest.fn(),
    closeBookingModal: jest.fn(),
  }),
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost/',
  pathname: '/',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('NewBookNowButton', () => {
  const mockCar = {
    id: 'car-123',
    title: 'Test Car',
    model: 'Model X',
    make: 'Test Make',
    year: 2023,
    image: 'test-image.jpg',
    images: ['test-image.jpg'],
    pricePerDay: 1000,
    location: 'Hyderabad',
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    rating: 4.5,
    reviewCount: 10,
    isAvailable: true,
    badges: ['Available'],
    thumbnail: 'test-thumbnail.jpg',
    bookingStatus: 'available',
    price_in_paise: 100000,
    image_urls: ['test-image.jpg'],
    image_paths: ['test-path'],
    status: 'published',
    isArchived: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should save pending intent and redirect when user is not authenticated', async () => {
    const savePendingIntentSpy = jest.spyOn(bookingIntentUtils, 'savePendingIntent');
    
    render(<NewBookNowButton car={mockCar} />);
    
    const bookNowButton = screen.getByText('Book Now');
    fireEvent.click(bookNowButton);
    
    expect(savePendingIntentSpy).toHaveBeenCalledWith({
      type: 'BOOK_CAR',
      carId: 'car-123',
    });
    
    expect(window.location.href).toBe('/auth?next=%2F');
  });

  it('should show toast when user is not authenticated', async () => {
    const toastSpy = jest.spyOn(toast, 'toast');
    
    render(<NewBookNowButton car={mockCar} />);
    
    const bookNowButton = screen.getByText('Book Now');
    fireEvent.click(bookNowButton);
    
    expect(toastSpy).toHaveBeenCalledWith({
      title: "Sign in required",
      description: "We'll resume your booking automatically after you sign in.",
    });
  });

  it('should show error toast when car is not available', async () => {
    const toastSpy = jest.spyOn(toast, 'toast');
    
    const unavailableCar = {
      ...mockCar,
      isAvailable: false,
      bookingStatus: 'booked',
    };
    
    render(<NewBookNowButton car={unavailableCar} />);
    
    const bookNowButton = screen.getByText('Book Now');
    fireEvent.click(bookNowButton);
    
    expect(toastSpy).toHaveBeenCalledWith({
      title: "Car Not Available",
      description: "This car is not available for booking.",
      variant: "destructive",
    });
  });
});