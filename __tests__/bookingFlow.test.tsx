import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Booking Flow', () => {
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

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('CarCard Component', () => {
    it('should call saveDraftAndRedirect when Book Now is clicked and user is not logged in', async () => {
      // Mock auth state - no user
      mockUseAuth.mockReturnValue({ user: null });
      
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

      // Wait for the mock function to be called
      await waitFor(() => {
        expect(mockSaveDraftAndRedirect).toHaveBeenCalled();
      });

      // Check that the draft contains the expected data
      expect(mockSaveDraftAndRedirect).toHaveBeenCalledWith({
        carId: '1',
        pickup: { date: '', time: '' },
        return: { date: '', time: '' },
        addons: {},
        totals: { subtotal: 0, serviceCharge: 0, total: 0 },
      });
    });

    it('should open booking flow modal when Book Now is clicked and user is logged in', async () => {
      // Mock auth state - user is logged in
      mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
      
      // Mock booking hook
      mockUseBooking.mockReturnValue({
        saveDraftAndRedirect: vi.fn(),
      });

      // Render the component
      render(<CarCard car={mockCar} />);

      // Find and click the Book Now button
      const bookNowButton = screen.getByTestId('book-now-1');
      fireEvent.click(bookNowButton);

      // Wait for the booking flow to appear
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-booking-flow')).toBeInTheDocument();
      });
    });

    it('should show alert when car is not available', async () => {
      // Mock window.alert
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock auth state - user is logged in
      mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
      
      // Mock booking hook
      mockUseBooking.mockReturnValue({
        saveDraftAndRedirect: vi.fn(),
      });

      // Render the component with an unavailable car
      const unavailableCar = { ...mockCar, bookingStatus: 'booked' };
      render(<CarCard car={unavailableCar} />);

      // Find and click the Book Now button
      const bookNowButton = screen.getByTestId('book-now-1');
      fireEvent.click(bookNowButton);

      // Check that alert was called
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('This car is not available.');
      });

      // Restore the alert mock
      mockAlert.mockRestore();
    });
  });

  describe('CarCardModern Component', () => {
    it('should call saveDraftAndRedirect when Book Now is clicked and user is not logged in', async () => {
      // Mock auth state - no user
      mockUseAuth.mockReturnValue({ user: null });
      
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

      // Wait for the mock function to be called
      await waitFor(() => {
        expect(mockSaveDraftAndRedirect).toHaveBeenCalled();
      });

      // Check that the draft contains the expected data
      expect(mockSaveDraftAndRedirect).toHaveBeenCalledWith({
        carId: '1',
        pickup: { date: '', time: '' },
        return: { date: '', time: '' },
        addons: {},
        totals: { subtotal: 0, serviceCharge: 0, total: 0 },
      });
    });

    it('should open booking flow modal when Book Now is clicked and user is logged in', async () => {
      // Mock auth state - user is logged in
      mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
      
      // Mock booking hook
      mockUseBooking.mockReturnValue({
        saveDraftAndRedirect: vi.fn(),
      });

      // Render the component
      render(<CarCardModern car={mockCar} />);

      // Find and click the Book Now button
      const bookNowButton = screen.getByTestId('book-now-1');
      fireEvent.click(bookNowButton);

      // Wait for the booking flow to appear
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-booking-flow')).toBeInTheDocument();
      });
    });

    it('should show alert when car is not available', async () => {
      // Mock window.alert
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock auth state - user is logged in
      mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
      
      // Mock booking hook
      mockUseBooking.mockReturnValue({
        saveDraftAndRedirect: vi.fn(),
      });

      // Render the component with an unavailable car
      const unavailableCar = { ...mockCar, bookingStatus: 'booked' };
      render(<CarCardModern car={unavailableCar} />);

      // Find and click the Book Now button
      const bookNowButton = screen.getByTestId('book-now-1');
      fireEvent.click(bookNowButton);

      // Check that alert was called
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('This car is not available.');
      });

      // Restore the alert mock
      mockAlert.mockRestore();
    });
  });
});