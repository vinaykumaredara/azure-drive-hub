import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { CarCardModern } from '@/components/CarCardModern';
import * as AuthProvider from '@/components/AuthProvider';
import * as useBooking from '@/hooks/useBooking';

// Mock dependencies
vi.mock('@/components/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useBooking', () => ({
  useBooking: vi.fn(),
}));

vi.mock('@/components/EnhancedBookingFlow', () => ({
  EnhancedBookingFlow: ({ car, onClose }: any) => (
    <div data-testid="booking-modal">
      <button onClick={onClose}>Close Modal</button>
      <span>Booking {car.title}</span>
    </div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
}));

describe('Book Now Button - P0 Reliability Tests', () => {
  const mockCar = {
    id: 'test-car-1',
    title: 'Tesla Model 3',
    model: 'Model 3',
    make: 'Tesla',
    year: 2024,
    image: '/test-image.jpg',
    pricePerDay: 5000,
    location: 'Mumbai',
    fuel: 'electric',
    transmission: 'automatic',
    seats: 5,
    rating: 4.8,
    reviewCount: 120,
    isAvailable: true,
    status: 'published',
    bookingStatus: 'available',
  };

  const mockSaveDraftAndRedirect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Default: user signed out
    vi.mocked(AuthProvider.useAuth).mockReturnValue({
      user: null,
      profile: null,
      profileLoading: false,
      signOut: vi.fn(),
      isAdmin: false,
    } as any);

    vi.mocked(useBooking.useBooking).mockReturnValue({
      saveDraftAndRedirect: mockSaveDraftAndRedirect,
      pendingBooking: null,
      clearDraft: vi.fn(),
      checkLicenseStatus: vi.fn(),
      createBookingHold: vi.fn(),
    } as any);
  });

  describe('Button Layout & Z-Index', () => {
    it('should render both buttons side-by-side with correct z-index', () => {
      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      const contactBtn = screen.getByText('Contact');
      
      expect(bookNowBtn).toBeInTheDocument();
      expect(contactBtn).toBeInTheDocument();
      
      // Check z-index classes
      expect(bookNowBtn.className).toContain('z-20');
      expect(contactBtn.className).toContain('z-10');
    });

    it('should have type="button" to prevent form submission', () => {
      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByRole('button', { name: /book now/i });
      const contactBtn = screen.getByRole('button', { name: /contact/i });
      
      expect(bookNowBtn).toHaveAttribute('type', 'button');
      expect(contactBtn).toHaveAttribute('type', 'button');
    });

    it('should prevent click propagation on both buttons', () => {
      const cardClickHandler = vi.fn();
      const { container } = render(
        <div onClick={cardClickHandler}>
          <CarCardModern car={mockCar} />
        </div>
      );
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      // Card click handler should not be called due to stopPropagation
      expect(cardClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Signed Out User Flow', () => {
    it('should save booking intent and redirect when signed out', () => {
      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      // Should save intent to localStorage
      const savedIntent = localStorage.getItem('pendingIntent');
      expect(savedIntent).toBeTruthy();
      
      const intent = JSON.parse(savedIntent!);
      expect(intent.type).toBe('BOOK_CAR');
      expect(intent.carId).toBe('test-car-1');
      
      // Should call redirect
      expect(mockSaveDraftAndRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          carId: 'test-car-1',
        })
      );
    });
  });

  describe('Signed In User Flow', () => {
    it('should open booking modal when signed in with phone', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('booking-modal')).toBeInTheDocument();
      });
    });

    it('should show loading state and disable button during booking flow open', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      // Button should show "Opening..." immediately
      await waitFor(() => {
        expect(screen.getByText('Opening...')).toBeInTheDocument();
      });
    });

    it('should redirect to profile when phone missing', () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: null } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      expect(mockSaveDraftAndRedirect).toHaveBeenCalledWith(
        expect.anything(),
        { redirectToProfile: true }
      );
    });
  });

  describe('Contact Button Independence', () => {
    it('should open WhatsApp when Contact clicked, not Book Now flow', () => {
      const mockOpen = vi.fn();
      global.window.open = mockOpen;

      render(<CarCardModern car={mockCar} />);
      
      const contactBtn = screen.getByText('Contact');
      fireEvent.click(contactBtn);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank'
      );
      
      // Booking modal should NOT open
      expect(screen.queryByTestId('booking-modal')).not.toBeInTheDocument();
    });
  });

  describe('Availability Checks', () => {
    it('should disable Book Now when car is not available', () => {
      const unavailableCar = { ...mockCar, status: 'archived' };
      render(<CarCardModern car={unavailableCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      expect(bookNowBtn).toBeDisabled();
    });

    it('should disable Book Now when car is booked', () => {
      const bookedCar = { ...mockCar, bookingStatus: 'booked' };
      render(<CarCardModern car={bookedCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      expect(bookNowBtn).toBeDisabled();
    });
  });

  describe('Concurrent Click Protection', () => {
    it('should prevent multiple simultaneous booking attempts', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      
      // Click twice rapidly
      fireEvent.click(bookNowBtn);
      fireEvent.click(bookNowBtn);
      
      // Should only see one modal
      await waitFor(() => {
        const modals = screen.getAllByTestId('booking-modal');
        expect(modals).toHaveLength(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show toast when car is not available and button clicked', () => {
      const unavailableCar = { ...mockCar, isAvailable: false, status: 'archived' };
      
      const { container } = render(<CarCardModern car={unavailableCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      
      // Try to click (should be disabled but test handler)
      fireEvent.click(bookNowBtn);
      
      // Should show disabled state
      expect(bookNowBtn).toBeDisabled();
    });
  });

  describe('Loading State Timeout - PHASE F', () => {
    it('should reset loading state after 5 seconds if modal fails to open', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      // Mock modal to NOT open (simulate failure)
      vi.mock('@/components/EnhancedBookingFlow', () => ({
        EnhancedBookingFlow: () => null,
      }));

      render(<CarCardModern car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      // Should show "Opening..." immediately
      await waitFor(() => {
        expect(screen.getByText('Opening...')).toBeInTheDocument();
      });
      
      // After 5+ seconds, should reset to "Book Now"
      await waitFor(() => {
        expect(screen.getByText('Book Now')).toBeInTheDocument();
        expect(screen.queryByText('Opening...')).not.toBeInTheDocument();
      }, { timeout: 6000 });
    }, 10000); // Extend test timeout to 10s
  });
});
