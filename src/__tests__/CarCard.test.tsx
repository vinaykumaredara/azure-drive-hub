// PHASE F: Test coverage for CarCard component (mirrors CarCardModern tests)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CarCard } from '@/components/CarCard';
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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('CarCard - Book Now Button Reliability', () => {
  const mockCar = {
    id: 'test-car-1',
    title: 'Tesla Model 3',
    model: 'Model 3',
    make: 'Tesla',
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

  describe('PHASE C: Timeout and Loading State', () => {
    it('should show loading state when Book Now clicked', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCard car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      // Should show "Opening..." immediately
      await waitFor(() => {
        expect(screen.getByText('Opening...')).toBeInTheDocument();
      });
    });

    it('should reset loading state after 5 seconds timeout', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCard car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      fireEvent.click(bookNowBtn);
      
      // Should show "Opening..."
      await waitFor(() => {
        expect(screen.getByText('Opening...')).toBeInTheDocument();
      });
      
      // After 5+ seconds, should reset
      await waitFor(() => {
        expect(screen.getByText('Book Now')).toBeInTheDocument();
        expect(screen.queryByText('Opening...')).not.toBeInTheDocument();
      }, { timeout: 6000 });
    }, 10000);

    it('should prevent concurrent booking attempts', async () => {
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      render(<CarCard car={mockCar} />);
      
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

  describe('PHASE A+B: Button Layout', () => {
    it('should render buttons side-by-side with flex layout', () => {
      render(<CarCard car={mockCar} />);
      
      const bookNowBtn = screen.getByText('Book Now');
      const contactBtn = screen.getByText('Contact');
      
      expect(bookNowBtn).toBeInTheDocument();
      expect(contactBtn).toBeInTheDocument();
    });

    it('should have emergency inline styles for pointer events', () => {
      render(<CarCard car={mockCar} />);
      
      const bookNowBtn = screen.getByTestId(`book-now-${mockCar.id}`);
      
      // Check inline styles exist
      expect(bookNowBtn).toHaveStyle({ zIndex: '10000', pointerEvents: 'auto' });
    });
  });

  describe('Contact Button Independence', () => {
    it('should open WhatsApp when Contact clicked, not Book Now flow', () => {
      const mockOpen = vi.fn();
      global.window.open = mockOpen;

      render(<CarCard car={mockCar} />);
      
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

  describe('Signed Out User Flow', () => {
    it('should save booking intent and redirect when signed out', () => {
      render(<CarCard car={mockCar} />);
      
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
});
