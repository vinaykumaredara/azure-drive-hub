// src/components/VirtualCarList.tsx
// Virtual scrolling implementation for car listings

import { useState, useEffect, useRef, useCallback } from 'react';
import { CarCardModern } from '@/components/CarCardModern';

interface VirtualCarListProps {
  cars: any[];
  itemHeight?: number;
  windowHeight?: number;
}

export const VirtualCarList = ({ 
  cars, 
  itemHeight = 300, 
  windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800 
}: VirtualCarListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(windowHeight);

  // Calculate visible items
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight) + 2; // Add buffer
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemsCount, cars.length);
  
  const visibleCars = cars.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Handle resize events
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {return;}

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial container height
    setContainerHeight(container.clientHeight);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll, handleResize]);

  // Render placeholder for offset
  const renderOffsetPlaceholder = () => (
    <div style={{ height: `${offsetY}px` }} />
  );

  // Render placeholder for remaining items
  const renderRemainingPlaceholder = () => (
    <div style={{ height: `${(cars.length - endIndex) * itemHeight}px` }} />
  );

  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto w-full"
      style={{ height: `${containerHeight}px` }}
    >
      <div style={{ height: `${cars.length * itemHeight}px`, position: 'relative' }}>
        {renderOffsetPlaceholder()}
        <div>
          {visibleCars.map((car, _index) => (
            <div 
              key={car.id} 
              style={{ height: `${itemHeight}px` }}
              className="mb-4"
            >
              <CarCardModern car={{
                id: car.id,
                title: car.title,
                model: car.model || 'Unknown Model',
                make: car.make || undefined,
                year: car.year || undefined,
                image: car.image,
                images: car.images,
                pricePerDay: car.pricePerDay,
                location: car.location,
                fuel: car.fuel || 'Unknown',
                transmission: car.transmission || 'Unknown',
                seats: car.seats || 0,
                rating: car.rating,
                reviewCount: car.reviewCount,
                isAvailable: car.isAvailable,
                badges: car.badges,
                thumbnail: car.thumbnail,
                bookingStatus: car.bookingStatus || undefined,
                price_in_paise: car.pricePerDay * 100,
                image_urls: car.image_urls,
                image_paths: car.image_paths
              }} />
            </div>
          ))}
        </div>
        {renderRemainingPlaceholder()}
      </div>
    </div>
  );
};