import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CarCard } from '@/components/CarCard';
import { EmptyCarState } from '@/components/EmptyCarState';
import { CarTravelingLoader } from '@/components/LoadingAnimations';
import { PromoCodeInput } from '@/components/PromoCodeInput';

// Mock modules
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '1',
              code: 'TEST10',
              discount_percent: 10,
              active: true
            },
            error: null
          }))
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: [{
        valid: true,
        discount_percent: 10,
        discount_flat: null,
        message: 'Valid promo code'
      }],
      error: null
    }))
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() })
}));

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockCar = {
  id: '1',
  model: 'Honda City',
  image: 'https://example.com/car.jpg',
  rating: 4.5,
  reviewCount: 120,
  seats: 5,
  fuel: 'Petrol',
  transmission: 'Automatic',
  pricePerDay: 2500,
  location: 'Mumbai',
  isAvailable: true,
  badges: ['Popular', 'Clean']
};

describe('CarCard Component', () => {
  const Wrapper = createWrapper();

  it('renders car information correctly', () => {
    render(
      <Wrapper>
        <CarCard car={mockCar} />
      </Wrapper>
    );

    expect(screen.getByText('Honda City')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
    expect(screen.getByText('5 seats')).toBeInTheDocument();
    expect(screen.getByText('Petrol')).toBeInTheDocument();
    expect(screen.getByText('Automatic')).toBeInTheDocument();
  });

  it('displays badges correctly', () => {
    render(
      <Wrapper>
        <CarCard car={mockCar} />
      </Wrapper>
    );

    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(screen.getByText('Clean')).toBeInTheDocument();
  });

  it('shows unavailable state when car is not available', () => {
    const unavailableCar = { ...mockCar, isAvailable: false };
    
    render(
      <Wrapper>
        <CarCard car={unavailableCar} />
      </Wrapper>
    );

    expect(screen.getByText('Not Available')).toBeInTheDocument();
  });
});

describe('EmptyCarState Component', () => {
  const Wrapper = createWrapper();

  it('renders empty state message', () => {
    render(
      <Wrapper>
        <EmptyCarState />
      </Wrapper>
    );

    // Updated to match the actual component text
    expect(screen.getByText('🚗 Our Cars Are Busy!')).toBeInTheDocument();
  });

  it('displays contact options', () => {
    render(
      <Wrapper>
        <EmptyCarState />
      </Wrapper>
    );

    expect(screen.getByText('WhatsApp Us')).toBeInTheDocument();
    expect(screen.getByText('Call +91 99999 00000')).toBeInTheDocument();
  });
});

describe('CarTravelingLoader Component', () => {
  it('renders loading animation with default message', () => {
    render(<CarTravelingLoader />);
    
    expect(screen.getByText('Loading your perfect ride...')).toBeInTheDocument();
  });

  it('renders loading animation with custom message', () => {
    render(<CarTravelingLoader message="Finding your car..." />);
    
    expect(screen.getByText('Finding your car...')).toBeInTheDocument();
  });

  it('displays status indicators', () => {
    render(<CarTravelingLoader />);
    
    // Test that the loading animation renders
    expect(screen.getByText('Loading your perfect ride...')).toBeInTheDocument();
    expect(screen.getByText('Connecting you with premium vehicle experiences')).toBeInTheDocument();
  });
});

describe('PromoCodeInput Component', () => {
  const mockOnPromoApplied = vi.fn();
  const mockOnPromoRemoved = vi.fn();
  const Wrapper = createWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders promo code input form', () => {
    render(
      <Wrapper>
        <PromoCodeInput
          onPromoApplied={mockOnPromoApplied}
          onPromoRemoved={mockOnPromoRemoved}
          totalAmount={1000}
        />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText('Enter promo code')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('validates and applies promo code', async () => {
    render(
      <Wrapper>
        <PromoCodeInput
          onPromoApplied={mockOnPromoApplied}
          onPromoRemoved={mockOnPromoRemoved}
          totalAmount={1000}
        />
      </Wrapper>
    );

    const input = screen.getByPlaceholderText('Enter promo code');
    const applyButton = screen.getByText('Apply');

    fireEvent.change(input, { target: { value: 'TEST10' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnPromoApplied).toHaveBeenCalledWith(100, 'TEST10');
    });
  });
});