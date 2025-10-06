import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client first
const mockSupabase = {
  functions: {
    invoke: vi.fn()
  }
};

// Mock react-router-dom
const mockNavigate = vi.fn();

// Mock AuthProvider
const mockUseAuth = vi.fn();

// Mock toast
const mockToast = vi.fn();

// Now set up the mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast
}));

// Now import the module under test after mocks are set up
const { useBooking } = await import('@/hooks/useBooking');

describe('Booking Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
  });

  describe('saveDraftAndRedirect', () => {
    it('should save draft to sessionStorage and navigate to auth with correct next param', () => {
      // Setup
      mockUseAuth.mockReturnValue({ user: null });
      
      // Create the hook
      const { saveDraftAndRedirect } = useBooking();
      
      // Test data
      const draft = {
        carId: 'test-car-id',
        pickup: { date: '2023-01-01', time: '10:00' },
        return: { date: '2023-01-02', time: '18:00' },
        addons: { driver: false, gps: true },
        totals: { subtotal: 1000, serviceCharge: 100, total: 1100 }
      };
      
      // Execute
      saveDraftAndRedirect(draft);
      
      // Assertions
      const savedDraft = sessionStorage.getItem('pendingBooking');
      expect(savedDraft).toBeTruthy();
      
      const parsedDraft = JSON.parse(savedDraft!);
      expect(parsedDraft).toEqual(draft);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth?next=%2F');
    });
    
    it('should set redirectToProfile flag when options.redirectToProfile is true', () => {
      // Setup
      mockUseAuth.mockReturnValue({ user: null });
      
      // Create the hook
      const { saveDraftAndRedirect } = useBooking();
      
      // Test data
      const draft = {
        carId: 'test-car-id',
        pickup: { date: '2023-01-01', time: '10:00' },
        return: { date: '2023-01-02', time: '18:00' },
        addons: { driver: false, gps: true },
        totals: { subtotal: 1000, serviceCharge: 100, total: 1100 }
      };
      
      // Execute
      saveDraftAndRedirect(draft, { redirectToProfile: true });
      
      // Assertions
      const savedDraft = sessionStorage.getItem('pendingBooking');
      expect(savedDraft).toBeTruthy();
      
      const redirectToProfileFlag = sessionStorage.getItem('redirectToProfileAfterLogin');
      expect(redirectToProfileFlag).toBe('true');
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth?next=%2F');
    });
  });
});