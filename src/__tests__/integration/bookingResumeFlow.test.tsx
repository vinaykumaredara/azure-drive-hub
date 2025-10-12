import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBookingResume } from '@/hooks/useBookingResume';
import * as AuthProvider from '@/components/AuthProvider';
import { bookingIntentStorage } from '@/utils/bookingIntent';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/components/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          abortSignal: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('Booking Resume Flow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Resume on Auth Change', () => {
    it('should resume booking when user signs in', async () => {
      // Setup: Save intent as if user clicked Book Now while signed out
      bookingIntentStorage.save({
        type: 'BOOK_CAR',
        carId: 'car-123',
        timestamp: Date.now(),
      });

      // Mock: User initially not signed in
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: null,
        profile: null,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      const { result, rerender } = renderHook(() => useBookingResume());

      expect(result.current.resumedCar).toBeNull();
      expect(result.current.isResuming).toBe(false);

      // Mock: Car fetch will succeed
      const mockCar = {
        id: 'car-123',
        title: 'Tesla Model 3',
        model: 'Model 3',
        make: 'Tesla',
        price_per_day: 5000,
        price_in_paise: 500000,
        seats: 5,
        fuel_type: 'electric',
        transmission: 'automatic',
        image_urls: ['/test-image.jpg'],
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            abortSignal: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
            })),
          })),
        })),
      } as any);

      // Simulate: User signs in
      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      rerender();

      // Wait for async resume
      await waitFor(() => {
        expect(result.current.resumedCar).toBeTruthy();
      }, { timeout: 3000 });

      expect(result.current.resumedCar?.id).toBe('car-123');
      expect(result.current.resumedCar?.title).toBe('Tesla Model 3');
      
      // Intent should be cleared to prevent loops
      expect(bookingIntentStorage.get()).toBeNull();
    });

    it('should handle concurrent resume attempts with lock', async () => {
      bookingIntentStorage.save({
        type: 'BOOK_CAR',
        carId: 'car-456',
        timestamp: Date.now(),
      });

      const mockCar = {
        id: 'car-456',
        title: 'BMW X5',
        model: 'X5',
        make: 'BMW',
        price_per_day: 8000,
        seats: 5,
        fuel_type: 'diesel',
        transmission: 'automatic',
        image_urls: ['/bmw.jpg'],
      };

      let fetchCount = 0;
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            abortSignal: vi.fn(() => ({
              single: vi.fn().mockImplementation(() => {
                fetchCount++;
                return Promise.resolve({ data: mockCar, error: null });
              }),
            })),
          })),
        })),
      } as any);

      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      const { result } = renderHook(() => useBookingResume());

      // Trigger custom event multiple times rapidly
      window.dispatchEvent(new CustomEvent('bookingIntentSaved'));
      window.dispatchEvent(new CustomEvent('bookingIntentSaved'));
      window.dispatchEvent(new CustomEvent('bookingIntentSaved'));

      await waitFor(() => {
        expect(result.current.resumedCar).toBeTruthy();
      }, { timeout: 3000 });

      // Should only fetch once due to lock mechanism
      expect(fetchCount).toBe(1);
    });

    it('should handle expired intent gracefully', async () => {
      // Save intent with old timestamp (expired)
      const expiredIntent = {
        type: 'BOOK_CAR' as const,
        carId: 'car-789',
        timestamp: Date.now() - 3700000, // 61 minutes ago (expired)
      };
      localStorage.setItem('pendingIntent', JSON.stringify(expiredIntent));

      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      const { result } = renderHook(() => useBookingResume());

      await waitFor(() => {
        // Should clear intent and not resume
        expect(bookingIntentStorage.get()).toBeNull();
        expect(result.current.resumedCar).toBeNull();
      });
    });

    it('should handle car not found error', async () => {
      bookingIntentStorage.save({
        type: 'BOOK_CAR',
        carId: 'non-existent-car',
        timestamp: Date.now(),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            abortSignal: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Car not found' } 
              }),
            })),
          })),
        })),
      } as any);

      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      const { result } = renderHook(() => useBookingResume());

      await waitFor(() => {
        expect(result.current.resumedCar).toBeNull();
        // Intent should be cleared even on error
        expect(bookingIntentStorage.get()).toBeNull();
      });
    });
  });

  describe('CustomEvent Listener', () => {
    it('should respond to bookingIntentSaved event', async () => {
      const mockCar = {
        id: 'car-event-test',
        title: 'Event Car',
        model: 'Test',
        make: 'Test',
        price_per_day: 3000,
        seats: 4,
        fuel_type: 'petrol',
        transmission: 'manual',
        image_urls: ['/test.jpg'],
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            abortSignal: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockCar, error: null }),
            })),
          })),
        })),
      } as any);

      vi.mocked(AuthProvider.useAuth).mockReturnValue({
        user: { id: 'user-1' } as any,
        profile: { id: 'user-1', phone: '+911234567890' } as any,
        profileLoading: false,
        signOut: vi.fn(),
        isAdmin: false,
      } as any);

      const { result } = renderHook(() => useBookingResume());

      // Save intent
      bookingIntentStorage.save({
        type: 'BOOK_CAR',
        carId: 'car-event-test',
        timestamp: Date.now(),
      });

      // Event should be dispatched by bookingIntentStorage.save()
      await waitFor(() => {
        expect(result.current.resumedCar).toBeTruthy();
      }, { timeout: 3000 });

      expect(result.current.resumedCar?.id).toBe('car-event-test');
    });
  });
});
