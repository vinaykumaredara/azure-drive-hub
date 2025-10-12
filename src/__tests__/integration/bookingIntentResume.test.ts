import { getPendingIntent, savePendingIntent, clearPendingIntent } from '@/utils/bookingIntentUtils';

describe('Booking Intent Resume Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve booking intent', () => {
    const intent = { type: 'BOOK_CAR' as const, carId: 'test-car-123' };
    
    // Save intent
    savePendingIntent(intent);
    
    // Retrieve intent
    const retrieved = getPendingIntent();
    
    expect(retrieved).toBeTruthy();
    expect(retrieved?.type).toBe('BOOK_CAR');
    expect(retrieved?.carId).toBe('test-car-123');
    expect(retrieved?.ts).toBeDefined();
  });

  it('should clear booking intent', () => {
    const intent = { type: 'BOOK_CAR' as const, carId: 'test-car-123' };
    
    // Save intent
    savePendingIntent(intent);
    
    // Verify it exists
    expect(getPendingIntent()).toBeTruthy();
    
    // Clear intent
    clearPendingIntent();
    
    // Verify it's cleared
    expect(getPendingIntent()).toBeNull();
  });

  it('should handle multiple save operations', () => {
    const intent1 = { type: 'BOOK_CAR' as const, carId: 'car-1' };
    const intent2 = { type: 'BOOK_CAR' as const, carId: 'car-2' };
    
    // Save first intent
    savePendingIntent(intent1);
    let retrieved = getPendingIntent();
    expect(retrieved?.carId).toBe('car-1');
    
    // Save second intent (should overwrite)
    savePendingIntent(intent2);
    retrieved = getPendingIntent();
    expect(retrieved?.carId).toBe('car-2');
  });
});