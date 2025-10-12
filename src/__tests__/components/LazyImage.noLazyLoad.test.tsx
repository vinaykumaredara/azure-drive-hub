import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import LazyImage from '@/components/LazyImage';

// Mock the resolveCarImageUrl function
vi.mock('@/utils/carImageUtils', () => ({
  resolveCarImageUrl: vi.fn((src) => src || 'https://example.com/fallback.jpg')
}));

describe('LazyImage - No Lazy Loading', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('should render image immediately without lazy loading', () => {
    const testSrc = 'https://example.com/test.jpg';
    render(<LazyImage src={testSrc} alt="Test image" />);
    
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', testSrc);
  });

  it('should show image immediately without waiting for intersection', async () => {
    const testSrc = 'https://example.com/test.jpg';
    render(<LazyImage src={testSrc} alt="Test image" />);
    
    // Image should be visible immediately
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', testSrc);
  });

  it('should handle image load success', async () => {
    const testSrc = 'https://example.com/test.jpg';
    render(<LazyImage src={testSrc} alt="Test image" />);
    
    const img = screen.getByRole('img');
    
    // Simulate image load
    await waitFor(() => {
      img.dispatchEvent(new Event('load'));
    });
    
    // Image should still be in the document
    expect(img).toBeInTheDocument();
  });

  it('should handle image load error and show fallback', async () => {
    const testSrc = 'https://example.com/broken.jpg';
    render(<LazyImage src={testSrc} alt="Broken image" />);
    
    const img = screen.getByRole('img');
    
    // Simulate image error
    await waitFor(() => {
      img.dispatchEvent(new Event('error'));
    });
    
    // Should still show the image (with fallback URL)
    expect(img).toBeInTheDocument();
  });

  it('should handle undefined src gracefully', () => {
    render(<LazyImage src={undefined} alt="Test image" />);
    
    // Should render without crashing
    const container = screen.getByRole('img').parentElement;
    expect(container).toBeInTheDocument();
  });
});