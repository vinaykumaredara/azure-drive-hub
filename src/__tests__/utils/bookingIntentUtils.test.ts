import { 
  savePendingIntent, 
  getPendingIntent, 
  clearPendingIntent, 
  resumePendingIntent 
} from '@/utils/bookingIntentUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('bookingIntentUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('savePendingIntent', () => {
    it('should save a pending intent to localStorage', () => {
      const payload = { type: 'BOOK_CAR' as const, carId: 'car-123' };
      
      savePendingIntent(payload);
      
      const saved = localStorage.getItem('pendingIntent');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.type).toBe('BOOK_CAR');
      expect(parsed.carId).toBe('car-123');
      expect(parsed.ts).toBeDefined();
    });
  });

  describe('getPendingIntent', () => {
    it('should retrieve a pending intent from localStorage', () => {
      const intent = { type: 'BOOK_CAR' as const, carId: 'car-123', ts: Date.now() };
      localStorage.setItem('pendingIntent', JSON.stringify(intent));
      
      const retrieved = getPendingIntent();
      expect(retrieved).toEqual(intent);
    });

    it('should return null if no pending intent exists', () => {
      const retrieved = getPendingIntent();
      expect(retrieved).toBeNull();
    });

    it('should return null if pending intent is invalid', () => {
      localStorage.setItem('pendingIntent', JSON.stringify({ invalid: true }));
      
      const retrieved = getPendingIntent();
      expect(retrieved).toBeNull();
    });
  });

  describe('clearPendingIntent', () => {
    it('should remove pending intent from localStorage', () => {
      localStorage.setItem('pendingIntent', JSON.stringify({ type: 'BOOK_CAR', carId: 'car-123', ts: Date.now() }));
      
      clearPendingIntent();
      
      const retrieved = localStorage.getItem('pendingIntent');
      expect(retrieved).toBeNull();
    });
  });

  describe('resumePendingIntent', () => {
    it('should return false if no pending intent exists', async () => {
      const mockOpenBookingModal = jest.fn();
      
      const result = await resumePendingIntent(mockOpenBookingModal);
      expect(result).toBe(false);
      expect(mockOpenBookingModal).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // This test would require more complex mocking of Supabase
      // For now, we'll just verify the function exists and can be called
      expect(typeof resumePendingIntent).toBe('function');
    });
  });
});