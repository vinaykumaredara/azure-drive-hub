import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BookingProvider, useBooking } from '@/contexts/BookingContext';

// Mock the booking intent utilities
vi.mock('@/utils/bookingIntentUtils', () => ({
  getPendingIntent: vi.fn(),
  clearPendingIntent: vi.fn(),
  resumePendingIntent: vi.fn()
}));

// Mock useAuth hook
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-123' }
  })
}));

// Test component that uses the booking context
const TestComponent: React.FC = () => {
  const { isReady, isResuming, attemptResume } = useBooking();
  
  return (
    <div>
      <span data-testid="isReady">{isReady.toString()}</span>
      <span data-testid="isResuming">{isResuming.toString()}</span>
      <button data-testid="attemptResume" onClick={() => attemptResume()}>
        Attempt Resume
      </button>
    </div>
  );
};

describe('BookingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide context values', () => {
    const mockOpenBookingModal = vi.fn();
    const mockCloseBookingModal = vi.fn();
    
    const { getByTestId } = render(
      <BookingProvider 
        openBookingModal={mockOpenBookingModal}
        closeBookingModal={mockCloseBookingModal}
        isBookingModalOpen={false}
      >
        <TestComponent />
      </BookingProvider>
    );

    expect(getByTestId('isReady')).toBeInTheDocument();
    expect(getByTestId('isResuming')).toBeInTheDocument();
    expect(getByTestId('attemptResume')).toBeInTheDocument();
  });

  it('should set isReady to true when mounted', async () => {
    const mockOpenBookingModal = vi.fn();
    const mockCloseBookingModal = vi.fn();
    
    const { getByTestId } = render(
      <BookingProvider 
        openBookingModal={mockOpenBookingModal}
        closeBookingModal={mockCloseBookingModal}
        isBookingModalOpen={false}
      >
        <TestComponent />
      </BookingProvider>
    );

    await waitFor(() => {
      expect(getByTestId('isReady')).toHaveTextContent('true');
    });
  });
});