// PHASE F: Integration test for booking resume with modal prefetching
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBookingResume } from '@/hooks/useBookingResume';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          abortSignal: vi.fn(() => ({
            single: vi.fn(() => 
              Promise.resolve({
                data: {
                  id: 'test-car-1',
                  title: 'Test Car',
                  model: 'Test Model',
                  pricePerDay: 5000,
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  },
}));

// Mock EnhancedBookingFlow
vi.mock('@/components/EnhancedBookingFlow', () => ({
  EnhancedBookingFlow: vi.fn(),
}));

// Mock AuthProvider
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { phone: '+911234567890' },
    profileLoading: false,
  }),
}));

describe('Booking Resume with Prefetch - PHASE D', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should prefetch EnhancedBookingFlow before resuming booking', async () => {
    // Save a pending intent
    localStorage.setItem('pendingIntent', JSON.stringify({
      type: 'BOOK_CAR',
      carId: 'test-car-1',
      timestamp: Date.now(),
    }));

    // Track dynamic imports
    const importSpy = vi.spyOn(console, 'debug');

    const { result } = renderHook(() => useBookingResume());

    await waitFor(() => {
      // Check that prefetch log was called
      expect(importSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BookingResume] Prefetching booking modal...')
      );
    }, { timeout: 3000 });

    importSpy.mockRestore();
  });

  it('should fetch car details after prefetching modal', async () => {
    localStorage.setItem('pendingIntent', JSON.stringify({
      type: 'BOOK_CAR',
      carId: 'test-car-1',
      timestamp: Date.now(),
    }));

    const { result } = renderHook(() => useBookingResume());

    await waitFor(() => {
      // Verify supabase query was called
      expect(supabase.from).toHaveBeenCalledWith('cars');
    }, { timeout: 3000 });
  });

  it('should clear intent after successful resume', async () => {
    localStorage.setItem('pendingIntent', JSON.stringify({
      type: 'BOOK_CAR',
      carId: 'test-car-1',
      timestamp: Date.now(),
    }));

    const { result } = renderHook(() => useBookingResume());

    await waitFor(() => {
      const intent = localStorage.getItem('pendingIntent');
      // Intent should be cleared after successful resume
      expect(intent).toBeNull();
    }, { timeout: 5000 });
  });

  it('should handle prefetch errors gracefully', async () => {
    // Mock import to fail
    const originalImport = (global as any).import;
    (global as any).import = vi.fn(() => Promise.reject(new Error('Failed to load module')));

    localStorage.setItem('pendingIntent', JSON.stringify({
      type: 'BOOK_CAR',
      carId: 'test-car-1',
      timestamp: Date.now(),
    }));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useBookingResume());

    await waitFor(() => {
      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Restore
    (global as any).import = originalImport;
    consoleErrorSpy.mockRestore();
  });
});
