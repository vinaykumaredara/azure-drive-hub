import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminImage from '@/components/AdminImage';
import LazyImage from '@/components/LazyImage';
import ImageCarousel from '@/components/ImageCarousel';

export default function TestImageDisplay() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .not('image_urls', 'is', null)
          .limit(3);

        if (error) throw error;
        
        console.log('TestImageDisplay - Fetched cars:', data);
        setCars(data || []);
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  if (loading) {
    return <div>Loading cars for testing...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Image Display Test</h1>
      
      {cars.map((car) => (
        <div key={car.id} className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{car.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AdminImage Test */}
            <div>
              <h3 className="font-medium mb-2">AdminImage Component</h3>
              <div className="border p-2">
                {car.image_urls && car.image_urls.length > 0 && (
                  <AdminImage 
                    src={car.image_urls[0]} 
                    alt={car.title}
                    className="w-full h-48 object-cover rounded"
                    debug={true}
                  />
                )}
              </div>
            </div>
            
            {/* LazyImage Test */}
            <div>
              <h3 className="font-medium mb-2">LazyImage Component</h3>
              <div className="border p-2">
                {car.image_urls && car.image_urls.length > 0 && (
                  <LazyImage 
                    src={car.image_urls[0]} 
                    alt={car.title}
                    className="w-full h-48 object-cover rounded"
                    debug={true}
                  />
                )}
              </div>
            </div>
            
            {/* ImageCarousel Test */}
            <div>
              <h3 className="font-medium mb-2">ImageCarousel Component</h3>
              <div className="border p-2">
                {car.image_urls && car.image_urls.length > 0 && (
                  <ImageCarousel 
                    images={car.image_urls} 
                    className="h-48"
                    debug={true}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Raw Data */}
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h4 className="font-medium mb-2">Raw Image URLs:</h4>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(car.image_urls, null, 2)}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}