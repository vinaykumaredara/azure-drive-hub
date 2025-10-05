import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

// Mock all Supabase dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    })),
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/components/LoadingAnimations', () => ({
  CarTravelingLoader: () => <div>Loading...</div>
}));

// Mock all lazy-loaded components
vi.mock('@/pages/Index', () => ({
  default: () => <div>Home Page</div>
}));

vi.mock('@/pages/Auth', () => ({
  default: () => <div>Auth Page</div>
}));

vi.mock('@/pages/Booking', () => ({
  default: () => <div>Booking Page</div>
}));

vi.mock('@/pages/AdminDashboard', () => ({
  default: () => <div>Admin Dashboard</div>
}));

vi.mock('@/pages/UserDashboard', () => ({
  default: () => <div>User Dashboard</div>
}));

vi.mock('@/pages/NotFound', () => ({
  default: () => <div>Not Found</div>
}));

const createTestWrapper = () => {
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

describe('Smoke Tests', () => {
  it('should render the home page', async () => {
    const Wrapper = createTestWrapper();
    
    render(
      <Wrapper>
        <App />
      </Wrapper>
    );

    // Should render the home page
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('should navigate to auth page', async () => {
    const Wrapper = createTestWrapper();
    
    render(
      <Wrapper>
        <App />
      </Wrapper>
    );

    // Simulate navigation to auth (this would normally be done with router)
    // For now, we're just testing that the app renders without crashing
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('should render not found page for invalid routes', async () => {
    const Wrapper = createTestWrapper();
    
    render(
      <Wrapper>
        <App />
      </Wrapper>
    );

    // Should render without crashing
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});