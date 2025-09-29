import { render, screen } from '@testing-library/react';
import LazyImage from '@/components/LazyImage';

describe('LazyImage', () => {
  const mockProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
  };

  it('renders without crashing', () => {
    render(<LazyImage {...mockProps} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('displays the correct alt text', () => {
    render(<LazyImage {...mockProps} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('applies the aspect ratio style when provided', () => {
    render(<LazyImage {...mockProps} aspectRatio="16/9" />);
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveStyle('aspect-ratio: 16/9');
  });

  it('uses default fallback when src is not provided', () => {
    render(<LazyImage alt="Test image" />);
    // Should render without errors
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});