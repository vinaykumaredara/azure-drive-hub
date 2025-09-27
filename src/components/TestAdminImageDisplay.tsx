import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ImageCarousel from '@/components/ImageCarousel';
import LazyImage from '@/components/LazyImage';
import { resolveImageUrlsForCarAdmin } from '@/utils/adminImageUtils';

const TestAdminImageDisplay: React.FC = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestCars = async () => {
      try {
        console.log('TestAdminImageDisplay: Fetching cars');
        
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .limit(3)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('TestAdminImageDisplay: Raw car data', data);

        // Resolve image URLs for all cars
        const carsWithResolvedImages = await Promise.all(
          (data || []).map(resolveImageUrlsForCarAdmin)
        );

        console.log('TestAdminImageDisplay: Resolved car data', carsWithResolvedImages);

        setCars(carsWithResolvedImages);
      } catch (error) {
        console.error('TestAdminImageDisplay: Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCars();
  }, []);

  if (loading) {
    return <div>Loading test cars...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test Admin Image Display</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cars.map((car) => (
          <div key={car.id} className="border p-4 rounded">
            <h3 className="font-bold">{car.title}</h3>
            <p>Image URLs: {Array.isArray(car.image_urls) ? car.image_urls.length : 0}</p>
            
            <div className="mt-2">
              <h4 className="font-semibold">ImageCarousel Test:</h4>
              <ImageCarousel 
                images={car.image_urls} 
                className="h-32" 
                debug={true}
              />
            </div>
            
            {car.image_urls && car.image_urls.map((url: string, index: number) => (
              <div key={index} className="mt-2">
                <h4 className="font-semibold">LazyImage Test {index + 1}:</h4>
                <LazyImage 
                  src={url} 
                  alt={`Test image ${index + 1}`} 
                  className="w-full h-32 object-cover"
                  debug={true}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestAdminImageDisplay;