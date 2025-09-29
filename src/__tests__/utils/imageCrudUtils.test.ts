import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  storage: {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn().mockReturnThis(),
    getPublicUrl: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis()
  }
};

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock carImageUtils
vi.mock('@/utils/carImageUtils', () => ({
  resolveCarImageUrl: vi.fn((src) => src || 'https://example.com/fallback.jpg')
}));

describe('Image CRUD Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('should append images instead of replacing when updating a car', async () => {
    // Mock the Supabase response for fetching current car
    mockSupabase.select.mockImplementationOnce(() => ({
      eq: vi.fn().mockResolvedValueOnce({
        data: {
          image_urls: ['https://example.com/old1.jpg', 'https://example.com/old2.jpg'],
          image_paths: ['cars/1/old1.jpg', 'cars/1/old2.jpg']
        },
        error: null
      })
    }));

    // Mock the Supabase response for updating the car
    mockSupabase.update.mockImplementationOnce(() => ({
      eq: vi.fn().mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValueOnce({
          single: vi.fn().mockResolvedValueOnce({
            data: {
              id: '1',
              image_urls: [
                'https://example.com/old1.jpg',
                'https://example.com/old2.jpg',
                'https://example.com/new1.jpg'
              ],
              image_paths: [
                'cars/1/old1.jpg',
                'cars/1/old2.jpg',
                'cars/1/new1.jpg'
              ]
            },
            error: null
          })
        })
      }))
    }));

    // Mock storage upload
    mockSupabase.storage.upload.mockResolvedValueOnce({ error: null });
    mockSupabase.storage.getPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://example.com/new1.jpg' }
    });

    // Import the function to test
    const { updateCarWithImages } = await import('@/utils/imageCrudUtils');

    // Create mock file
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

    // Call the function
    const result = await updateCarWithImages('1', { title: 'Test Car' }, [mockFile], false);

    // Verify the result
    expect(result).toBeDefined();
    expect(result.image_urls).toHaveLength(3);
    expect(result.image_urls).toContain('https://example.com/old1.jpg');
    expect(result.image_urls).toContain('https://example.com/old2.jpg');
    expect(result.image_urls).toContain('https://example.com/new1.jpg');
  });

  it('should remove specific images when requested', async () => {
    // Mock the Supabase response for fetching current car
    mockSupabase.select.mockImplementationOnce(() => ({
      eq: vi.fn().mockResolvedValueOnce({
        data: {
          image_urls: ['https://example.com/old1.jpg', 'https://example.com/old2.jpg'],
          image_paths: ['cars/1/old1.jpg', 'cars/1/old2.jpg']
        },
        error: null
      })
    }));

    // Mock the Supabase response for updating the car
    mockSupabase.update.mockImplementationOnce(() => ({
      eq: vi.fn().mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValueOnce({
          single: vi.fn().mockResolvedValueOnce({
            data: {
              id: '1',
              image_urls: ['https://example.com/old2.jpg'],
              image_paths: ['cars/1/old2.jpg']
            },
            error: null
          })
        })
      }))
    }));

    // Mock storage remove
    mockSupabase.storage.remove.mockResolvedValueOnce({ error: null });

    // Import the function to test
    const { updateCarWithImages } = await import('@/utils/imageCrudUtils');

    // Call the function with specific images to remove
    const result = await updateCarWithImages(
      '1', 
      { title: 'Test Car' }, 
      [], 
      false, 
      ['https://example.com/old1.jpg']
    );

    // Verify the result
    expect(result).toBeDefined();
    expect(result.image_urls).toHaveLength(1);
    expect(result.image_urls).toContain('https://example.com/old2.jpg');
    expect(result.image_urls).not.toContain('https://example.com/old1.jpg');
  });
});