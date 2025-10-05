import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/components/AuthProvider';
import AdminDashboard from '@/pages/AdminDashboard';

// Enhanced mocks for integration testing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
        update: vi.fn(() => Promise.resolve({ data: [], error: null })),
        delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://example.com/file.jpg' }, error: null }))
      }))
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() })
}));

// Get access to the mocked supabase for test manipulation
const { supabase: mockSupabase } = await vi.importMock('@/integrations/supabase/client') as any;

// Test utilities for integration tests
const createIntegrationWrapper = (initialEntries?: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries || ['/']}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data for integration tests
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@test.com',
  is_admin: true,
  full_name: 'Test Admin'
};

const mockCars = [
  {
    id: '1',
    title: 'Honda City',
    make: 'Honda',
    model: 'City',
    year: 2023,
    seats: 5,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    price_per_day: 2500,
    location_city: 'Mumbai',
    status: 'active',
    image_urls: ['https://example.com/car1.jpg']
  },
  {
    id: '2',
    title: 'Toyota Innova',
    make: 'Toyota',
    model: 'Innova',
    year: 2022,
    seats: 7,
    fuel_type: 'Diesel',
    transmission: 'Manual',
    price_per_day: 3500,
    location_city: 'Delhi',
    status: 'active',
    image_urls: ['https://example.com/car2.jpg']
  }
];

const mockLicenses = [
  {
    id: 'license-1',
    user_id: 'user-1',
    verified: null,
    ocr_confidence: 0.95,
    ocr_text: 'DRIVER LICENSE\nJOHN DOE\nEXP: 12/25/2026',
    expires_at: '2026-12-25',
    created_at: '2024-01-15T10:00:00Z',
    users: { full_name: 'John Doe', phone: '+919999999999' }
  }
];

const mockPromoCodes = [
  {
    id: 'promo-1',
    code: 'SAVE20',
    discount_percent: 20,
    discount_flat: null,
    active: true,
    valid_from: '2024-01-01',
    valid_to: '2024-12-31',
    usage_limit: 100,
    created_at: '2024-01-01T00:00:00Z'
  }
];

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Dashboard Integration', () => {
    it('should load admin dashboard with all sections', async () => {
      // Mock admin authentication
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockAdminUser } },
        error: null
      });

      // Mock data fetching
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: () => ({
              order: () => Promise.resolve({ data: mockCars, error: null })
            })
          };
        }
        if (table === 'licenses') {
          return {
            select: () => ({
              order: () => Promise.resolve({ data: mockLicenses, error: null })
            })
          };
        }
        if (table === 'promo_codes') {
          return {
            select: () => ({
              order: () => Promise.resolve({ data: mockPromoCodes, error: null })
            })
          };
        }
        return {
          select: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        };
      });

      const Wrapper = createIntegrationWrapper(['/admin']);

      render(
        <Wrapper>
          <AdminDashboard />
        </Wrapper>
      );

      // Verify admin dashboard loads
      expect(screen.getByText('Azure Drive Hub Admin')).toBeInTheDocument();
      
      // Check for navigation items
      expect(screen.getByText('Car Management')).toBeInTheDocument();
      expect(screen.getByText('License Management')).toBeInTheDocument();
      expect(screen.getByText('Promo Codes')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should navigate between admin sections', async () => {
      const user = userEvent.setup();
      const Wrapper = createIntegrationWrapper(['/admin']);

      render(
        <Wrapper>
          <AdminDashboard />
        </Wrapper>
      );

      // Navigate to Car Management
      const carManagementButton = screen.getByText('Car Management');
      await user.click(carManagementButton);

      // Should show car management interface
      await waitFor(() => {
        expect(screen.getByText('Car Management')).toBeInTheDocument();
      });
    });
  });

  describe('Promo Code Flow Integration', () => {
    it('should validate promo codes end-to-end', async () => {
      const user = userEvent.setup();

      // Mock successful promo validation
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          valid: true,
          discount_percent: 20,
          discount_flat: null,
          message: 'Valid promo code'
        }],
        error: null
      });

      const mockOnPromoApplied = vi.fn();
      const mockOnPromoRemoved = vi.fn();

      const Wrapper = createIntegrationWrapper();

      const { PromoCodeInput } = await import('@/components/PromoCodeInput');

      render(
        <Wrapper>
          <PromoCodeInput
            onPromoApplied={mockOnPromoApplied}
            onPromoRemoved={mockOnPromoRemoved}
            totalAmount={1000}
          />
        </Wrapper>
      );

      // Enter promo code
      const input = screen.getByPlaceholderText('Enter promo code');
      await user.type(input, 'SAVE20');

      // Apply promo code
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);

      // Verify promo code validation was called
      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_promo_code', {
          code_input: 'SAVE20'
        });
      });

      // Verify callback was called with correct discount
      await waitFor(() => {
        expect(mockOnPromoApplied).toHaveBeenCalledWith(200, 'SAVE20');
      });
    });

    it('should handle invalid promo codes gracefully', async () => {
      const user = userEvent.setup();

      // Mock invalid promo code response
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          valid: false,
          discount_percent: null,
          discount_flat: null,
          message: 'Invalid promo code'
        }],
        error: null
      });

      const mockOnPromoApplied = vi.fn();
      const mockOnPromoRemoved = vi.fn();

      const Wrapper = createIntegrationWrapper();

      const { PromoCodeInput } = await import('@/components/PromoCodeInput');

      render(
        <Wrapper>
          <PromoCodeInput
            onPromoApplied={mockOnPromoApplied}
            onPromoRemoved={mockOnPromoRemoved}
            totalAmount={1000}
          />
        </Wrapper>
      );

      // Enter invalid promo code
      const input = screen.getByPlaceholderText('Enter promo code');
      await user.type(input, 'INVALID');

      // Apply promo code
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Invalid promo code')).toBeInTheDocument();
      });

      // Callback should not be called
      expect(mockOnPromoApplied).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Features Integration', () => {
    it('should set up real-time subscriptions correctly', async () => {
      const mockChannel = {
        on: vi.fn(() => ({ subscribe: vi.fn() })),
        subscribe: vi.fn(),
        unsubscribe: vi.fn()
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const Wrapper = createIntegrationWrapper(['/admin']);

      render(
        <Wrapper>
          <AdminDashboard />
        </Wrapper>
      );

      // Verify real-time channels are set up
      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: 'Network error' } })
        })
      }));

      const Wrapper = createIntegrationWrapper(['/admin']);

      render(
        <Wrapper>
          <AdminDashboard />
        </Wrapper>
      );

      // Should still render without crashing
      expect(screen.getByText('Azure Drive Hub Admin')).toBeInTheDocument();
    });

    it('should handle authentication errors', async () => {
      // Mock auth error
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Authentication failed' }
      });

      const Wrapper = createIntegrationWrapper(['/admin']);

      render(
        <Wrapper>
          <AdminDashboard />
        </Wrapper>
      );

      // Should handle gracefully
      expect(screen.getByText('Azure Drive Hub Admin')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should render large lists efficiently', async () => {
      // Create large mock dataset
      const largeCarsData = Array.from({ length: 100 }, (_, i) => ({
        id: `car-${i}`,
        title: `Test Car ${i}`,
        make: 'Honda',
        model: 'City',
        year: 2023,
        seats: 5,
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        price_per_day: 2500,
        location_city: 'Mumbai',
        status: 'active',
        image_urls: [`https://example.com/car${i}.jpg`]
      }));

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          order: () => Promise.resolve({ data: largeCarsData, error: null })
        })
      }));

      const startTime = performance.now();

      const Wrapper = createIntegrationWrapper(['/admin']);

      render(
        <Wrapper>
          <AdminDashboard />
        </Wrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
    });
  });
});

describe('Component State Management', () => {
  it('should maintain state consistency across re-renders', async () => {
    const user = userEvent.setup();
    const Wrapper = createIntegrationWrapper();

    const { PromoCodeInput } = await import('@/components/PromoCodeInput');

    const mockOnPromoApplied = vi.fn();
    const mockOnPromoRemoved = vi.fn();

    const { rerender } = render(
      <Wrapper>
        <PromoCodeInput
          onPromoApplied={mockOnPromoApplied}
          onPromoRemoved={mockOnPromoRemoved}
          totalAmount={1000}
        />
      </Wrapper>
    );

    // Enter some text
    const input = screen.getByPlaceholderText('Enter promo code');
    await user.type(input, 'TEST');

    // Re-render with different props
    rerender(
      <Wrapper>
        <PromoCodeInput
          onPromoApplied={mockOnPromoApplied}
          onPromoRemoved={mockOnPromoRemoved}
          totalAmount={2000}
        />
      </Wrapper>
    );

    // Input should maintain its value
    expect(input).toHaveValue('TEST');
  });
});