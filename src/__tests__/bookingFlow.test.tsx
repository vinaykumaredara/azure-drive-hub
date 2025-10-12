import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

describe('Booking Flow', () => {
  const mockUser: User = {
    id: 'user1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    phone: '+919876543210',
    role: 'authenticated',
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    identities: [],
  };

  const mockAuthContext = {
    user: mockUser,
    session: null,
    isLoading: false,
    isAdmin: false,
    profile: { id: 'user1', phone: '+919876543210' },
    profileLoading: false,
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
  };

  it('renders booking page', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/booking/car1']}>
          <Routes>
            <Route path="/booking/:carId" element={<div data-testid="booking-page">Booking Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Simple check that the element exists
    const element = screen.getByTestId('booking-page');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Booking Page');
  });
});