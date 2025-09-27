// src/components/TestImageDisplay.tsx
// Test component to debug image display issues

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LazyImage from '@/components/LazyImage';

export default function TestImageDisplay() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('status', 'published')
          .limit(1);
        
        if (error) throw error;
        
        console.log('Fetched cars:', data);
        setCars(data || []);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (cars.length === 0) return <div>No cars found</div>;

  const car = cars[0];
  console.log('Car data:', car);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test Image Display</h2>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{car.title}</h3>
        <p>Car ID: {car.id}</p>
        <p>Image URLs: {JSON.stringify(car.image_urls)}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {car.image_urls?.map((url: string, index: number) => (
          <div key={index} className="border p-2">
            <h4 className="font-medium mb-2">Image {index + 1}</h4>
            <p className="text-sm mb-2 truncate">{url}</p>
            <LazyImage 
              src={url} 
              alt={`Car image ${index + 1}`}
              className="w-full h-48 object-cover rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
}