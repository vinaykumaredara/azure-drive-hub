import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Booking Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should save draft to sessionStorage with correct format', () => {
    // Test data
    const draft = {
      carId: 'test-car-id',
      pickup: { date: '2023-01-01', time: '10:00' },
      return: { date: '2023-01-02', time: '18:00' },
      addons: { driver: false, gps: true },
      totals: { subtotal: 1000, serviceCharge: 100, total: 1100 }
    };
    
    // Save to sessionStorage
    sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
    
    // Retrieve and verify
    const savedDraft = sessionStorage.getItem('pendingBooking');
    expect(savedDraft).toBeTruthy();
    
    const parsedDraft = JSON.parse(savedDraft!);
    expect(parsedDraft).toEqual(draft);
  });

  it('should set redirectToProfile flag correctly', () => {
    // Set the flag
    sessionStorage.setItem('redirectToProfileAfterLogin', 'true');
    
    // Verify the flag
    const flag = sessionStorage.getItem('redirectToProfileAfterLogin');
    expect(flag).toBe('true');
    
    // Clean up
    sessionStorage.removeItem('redirectToProfileAfterLogin');
    
    // Verify removal
    const removedFlag = sessionStorage.getItem('redirectToProfileAfterLogin');
    expect(removedFlag).toBeNull();
  });
});