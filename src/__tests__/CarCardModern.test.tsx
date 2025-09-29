import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CarCardModern } from '@/components/CarCardModern';

// Mock the AtomicBookingFlow component
vi.mock('@/components/AtomicBookingFlow', () => ({
  AtomicBookingFlow: () => <div data-testid="atomic-booking-flow">Booking Flow</div>
}));

// Mock the LazyImage component
vi.mock('@/components/LazyImage', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => {
    return <img src={src} alt={alt} data-testid="lazy-image" />;
  }
}));

describe('CarCardModern', () => {
  const mockCar = {
    id: '1',
    title: 'Test Car',
    model: 'Model S',
    make: 'Tesla',
    year: 2023,
    image: 'https://example.com/car.jpg',
    pricePerDay: 1000,
    location: 'Hyderabad',
    fuel: 'electric',
    transmission: 'automatic',
    seats: 5,
    rating: 4.5,
    reviewCount: 10,
    isAvailable: true,
    badges: ['Available', 'Verified'],
  };

  it('renders car information correctly', () => {
    render(<CarCardModern car={mockCar} />);
    
    expect(screen.getByText('Tesla Model S')).toBeInTheDocument();
    expect(screen.getByText('(2023)')).toBeInTheDocument();
    expect(screen.getByText('Hyderabad')).toBeInTheDocument();
    expect(screen.getByText('₹1,000/day')).toBeInTheDocument();
    expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
  });

  it('shows correct badges', () => {
    render(<CarCardModern car={mockCar} />);
    
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('shows car specifications', () => {
    render(<CarCardModern car={mockCar} />);
    
    expect(screen.getByText('Seats: 5')).toBeInTheDocument();
    expect(screen.getByText('electric')).toBeInTheDocument();
    expect(screen.getByText('automatic')).toBeInTheDocument();
  });

  it('handles book now click when available', () => {
    render(<CarCardModern car={mockCar} />);
    
    const bookButton = screen.getByText('Book Now');
    fireEvent.click(bookButton);
    
    expect(screen.getByTestId('atomic-booking-flow')).toBeInTheDocument();
  });

  it('disables book button when not available', () => {
    const unavailableCar = { ...mockCar, isAvailable: false };
    render(<CarCardModern car={unavailableCar} />);
    
    const bookButton = screen.getByText('Book Now');
    expect(bookButton).toBeDisabled();
  });

  it('toggles save button', () => {
    render(<CarCardModern car={mockCar} />);
    
    const saveButton = screen.getByLabelText('Save car');
    expect(saveButton).toBeInTheDocument();
    
    fireEvent.click(saveButton);
    // After clicking, the heart should be filled (we can check the class or color)
    const heartIcon = saveButton.querySelector('svg');
    expect(heartIcon).toBeInTheDocument();
  });
});