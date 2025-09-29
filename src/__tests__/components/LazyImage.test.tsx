import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import LazyImage from '@/components/LazyImage';

// Mock the resolveCarImageUrl function
vi.mock('@/utils/carImageUtils', () => ({
  resolveCarImageUrl: vi.fn((src) => src || 'https://example.com/fallback.jpg')
}));

describe('LazyImage', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<LazyImage src="https://example.com/test.jpg" alt="Test image" />);
    }).not.toThrow();
  });

  it('should handle undefined src without crashing', () => {
    expect(() => {
      render(<LazyImage src={undefined} alt="Test image" />);
    }).not.toThrow();
  });
});