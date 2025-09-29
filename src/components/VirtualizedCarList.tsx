import { useState, useEffect, useRef } from 'react';
import { CarCardModern } from '@/components/CarCardModern';

interface Car {
  id: string;
  title: string;
  model: string;
  make?: string;
  year?: number;
  image: string;
  images?: string[];
  pricePerDay: number;
  location: string;
  fuel: string;
  transmission: string;
  seats: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  badges?: string[];
  thumbnail?: string;
  // For atomic booking
  bookingStatus?: string;
  price_in_paise?: number;
  image_urls?: string[] | null;
  image_paths?: string[] | null;
}

interface VirtualizedCarListProps {
  cars: Car[];
  itemHeight?: number;
  windowHeight?: number;
  isAdminView?: boolean;
  onEdit?: (car: Car) => void;
  onDelete?: (carId: string) => void;
}

export const VirtualizedCarList = ({ 
  cars, 
  itemHeight = 300, 
  windowHeight = 800,
  isAdminView = false,
  onEdit,
  onDelete
}: VirtualizedCarListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible items
  const visibleItemsCount = Math.ceil(windowHeight / itemHeight) + 2; // Add buffer
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemsCount, cars.length);
  
  // Get visible items
  const visibleItems = cars.slice(startIndex, endIndex);
  
  // Handle scroll
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };
  
  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    // Explicitly return undefined when there's no cleanup needed
    return undefined;
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: windowHeight }}
    >
      <div style={{ height: cars.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((car, index) => (
          <div
            key={car.id}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            <CarCardModern 
              car={car}
              isAdminView={isAdminView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
};