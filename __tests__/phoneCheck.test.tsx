import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { CarCard } from '@/components/CarCard';
import { CarCardModern } from '@/components/CarCardModern';

// Mock the AuthProvider
const mockUseAuth = vi.fn();
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the useBooking hook
const mockUseBooking = vi.fn();
vi.mock('@/hooks/useBooking', () => ({
  useBooking: () => mockUseBooking(),
}));

// Mock the EnhancedBookingFlow component
vi.mock('@/components/EnhancedBookingFlow', () => ({
  EnhancedBookingFlow: ({ car, onClose, onBookingSuccess }: any) => (
    <div data-testid="enhanced-booking-flow">
      <button onClick={onClose}>Close</button>
      <button onClick={onBookingSuccess}>Success</button>
    </div>
  ),
}));

describe('Phone Number Check', () => {
  const mockCar = {
    id: '1',
    model: 'Test Car',
    image: 'test-image.jpg',
    rating: 4.5,
    reviewCount: 10,
    seats: 5,
    fuel: 'Petrol',
    transmission: 'Automatic',
    pricePerDay: 1000,
    location: 'Hyderabad',
    isAvailable: true,
    bookingStatus: null,
    status: 'published',
  };

  it('should redirect to auth when unauthenticated user clicks Book Now', () => {
    // Mock auth state - no user
    mockUseAuth.mockReturnValue({ 
      user: null,
      profile: null,
      profileLoading: false
    });
    
    // Mock booking hook
    const mockSaveDraftAndRedirect = vi.fn();
    mockUseBooking.mockReturnValue({
      saveDraftAndRedirect: mockSaveDraftAndRedirect,
    });

    // Render the component
    render(<CarCard car={mockCar} />);

    // Find and click the Book Now button
    const bookNowButton = screen.getByTestId('book-now-1');
    fireEvent.click(bookNowButton);

    // Check that saveDraftAndRedirect was called
    expect(mockSaveDraftAndRedirect).toHaveBeenCalled();
  });

  it('should redirect to profile when logged-in user without phone clicks Book Now', () => {
    // Mock auth state - user is logged in but no phone
    mockUseAuth.mockReturnValue({ 
      user: { id: 'user1' },
      profile: { id: 'user1', phone: null },
      profileLoading: false
    });
    
    // Mock booking hook
    const mockSaveDraftAndRedirect = vi.fn();
    mockUseBooking.mockReturnValue({
      saveDraftAndRedirect: mockSaveDraftAndRedirect,
    });

    // Render the component
    render(<CarCard car={mockCar} />);

    // Find and click the Book Now button
    const bookNowButton = screen.getByTestId('book-now-1');
    fireEvent.click(bookNowButton);

    // Check that saveDraftAndRedirect was called with redirectToProfile option
    expect(mockSaveDraftAndRedirect).toHaveBeenCalledWith(
      expect.anything(),
      { redirectToProfile: true }
    );
  });

  it('should open booking flow when logged-in user with phone clicks Book Now', () => {
    // Mock auth state - user is logged in with phone
    mockUseAuth.mockReturnValue({ 
      user: { id: 'user1' },
      profile: { id: 'user1', phone: '+919876543210' },
      profileLoading: false
    });
    
    // Mock booking hook
    mockUseBooking.mockReturnValue({
      saveDraftAndRedirect: vi.fn(),
    });

    // Render the component
    render(<CarCard car={mockCar} />);

    // Find and click the Book Now button
    const bookNowButton = screen.getByTestId('book-now-1');
    fireEvent.click(bookNowButton);

    // Check that the booking flow opens
    expect(screen.getByTestId('enhanced-booking-flow')).toBeInTheDocument();
  });

  it('should show alert when profile is still loading', () => {
    // Mock window.alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock auth state - user is logged in but profile still loading
    mockUseAuth.mockReturnValue({ 
      user: { id: 'user1' },
      profile: null,
      profileLoading: true
    });
    
    // Mock booking hook
    mockUseBooking.mockReturnValue({
      saveDraftAndRedirect: vi.fn(),
    });

    // Render the component
    render(<CarCard car={mockCar} />);

    // Find and click the Book Now button
    const bookNowButton = screen.getByTestId('book-now-1');
    fireEvent.click(bookNowButton);

    // Check that alert was called
    expect(mockAlert).toHaveBeenCalledWith('Loading user profile, please wait...');

    // Restore the alert mock
    mockAlert.mockRestore();
  });

  // Test CarCardModern component as well
  it('should redirect to auth when unauthenticated user clicks Book Now on CarCardModern', () => {
    // Mock auth state - no user
    mockUseAuth.mockReturnValue({ 
      user: null,
      profile: null,
      profileLoading: false
    });
    
    // Mock booking hook
    const mockSaveDraftAndRedirect = vi.fn();
    mockUseBooking.mockReturnValue({
      saveDraftAndRedirect: mockSaveDraftAndRedirect,
    });

    // Render the component
    render(<CarCardModern car={mockCar} />);

    // Find and click the Book Now button
    const bookNowButton = screen.getByTestId('book-now-1');
    fireEvent.click(bookNowButton);

    // Check that saveDraftAndRedirect was called
    expect(mockSaveDraftAndRedirect).toHaveBeenCalled();
  });
});