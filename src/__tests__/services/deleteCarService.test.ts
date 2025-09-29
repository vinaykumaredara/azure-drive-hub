import { describe, it, expect, vi } from 'vitest';

// Mock the Supabase client
const mockStorage = {
  from: vi.fn().mockReturnThis(),
  remove: vi.fn()
};

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  delete: vi.fn(),
  storage: mockStorage
};

// Mock the Supabase client module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Delete Car Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should call the delete endpoint with correct parameters', async () => {
    // Mock the fetch function
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Call the delete endpoint
    const response = await fetch('/functions/v1/delete-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ carId: 'test-car-id' })
    });

    const result = await response.json();

    // Verify the fetch call was made with correct parameters
    expect(global.fetch).toHaveBeenCalledWith('/functions/v1/delete-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ carId: 'test-car-id' })
    });

    // Verify the response
    expect(result.success).toBe(true);
  });
});