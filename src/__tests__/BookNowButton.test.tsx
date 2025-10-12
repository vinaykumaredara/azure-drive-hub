import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CarCardModern } from '@/components/CarCardModern';
import { bookingIntentManager } from '@/utils/bookingIntentManager';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/components/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    profile: null,
    profileLoading: false
  }))
}));

vi.mock('@/hooks/useBooking', () => ({
  useBooking: vi.fn(() => ({
    saveDraftAndRedirect: vi.fn()
  }))
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

const mockCar = {
  id: 'test-car-1',
  title: 'Test Car',
  model: 'Model S',
  make: 'Tesla',
  year: 2023,
  image: '/test-image.jpg',
  images: ['/test-image.jpg'],
  pricePerDay: 5000,
  location: 'Mumbai',
  fuel: 'Electric',
  transmission: 'Automatic',
  seats: 5,
  rating: 4.5,
  reviewCount: 100,
  isAvailable: true,
  status: 'published'
};

describe('Book Now Button', () => {
  beforeEach(() => {
    bookingIntentManager.clearIntent();
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CarCardModern car={mockCar} />
      </BrowserRouter>
    );
  };

  it('should render Book Now and Contact buttons', () => {
    renderComponent();
    
    expect(screen.getByText('Book Now')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('should have proper z-index and pointer-events on buttons', () => {
    renderComponent();
    
    const bookBtn = screen.getByText('Book Now');
    const contactBtn = screen.getByText('Contact');
    
    expect(bookBtn).toHaveClass('z-20');
    expect(bookBtn).toHaveClass('pointer-events-auto');
    expect(contactBtn).toHaveClass('z-10');
    expect(contactBtn).toHaveClass('pointer-events-auto');
  });

  it('should prevent click propagation on Book Now', () => {
    renderComponent();
    
    const bookBtn = screen.getByText('Book Now');
    const stopPropagationSpy = vi.fn();
    
    bookBtn.addEventListener('click', (e) => {
      stopPropagationSpy();
      e.stopPropagation();
    });
    
    fireEvent.click(bookBtn);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should save intent for logged-out user', () => {
    renderComponent();
    
    const bookBtn = screen.getByText('Book Now');
    fireEvent.click(bookBtn);
    
    const intent = bookingIntentManager.getIntent();
    expect(intent).toBeTruthy();
    expect(intent?.carId).toBe('test-car-1');
    expect(intent?.type).toBe('BOOK_CAR');
  });

  it('should not allow multiple simultaneous booking attempts', async () => {
    renderComponent();
    
    const bookBtn = screen.getByText('Book Now');
    
    // Rapid triple-click
    fireEvent.click(bookBtn);
    fireEvent.click(bookBtn);
    fireEvent.click(bookBtn);
    
    // Should only save one intent
    const intent = bookingIntentManager.getIntent();
    expect(intent).toBeTruthy();
    
    // Verify lock mechanism prevents duplicates
    expect(bookingIntentManager.isLocked()).toBe(false);
  });
});
