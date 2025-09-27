// src/components/ImageDebug.tsx
// Debug component to verify image fixes

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LazyImage from '@/components/LazyImage';
import ImageCarousel from '@/components/ImageCarousel';

const ImageDebugComponent: React.FC = () => {
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
        
        console.log('Fetched cars for debug:', data);
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

  if (loading) return <div className="p-4">Loading debug data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (cars.length === 0) return <div className="p-4">No cars found for debugging</div>;

  const car = cars[0];
  console.log('Debug car data:', car);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Image Debug Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Car Information</h2>
        <p><strong>ID:</strong> {car.id}</p>
        <p><strong>Title:</strong> {car.title}</p>
        <p><strong>Status:</strong> {car.status}</p>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Image URLs Analysis</h2>
        {Array.isArray(car.image_urls) && car.image_urls.length > 0 ? (
          <div>
            <p className="mb-2">Found {car.image_urls.length} image(s):</p>
            {car.image_urls.map((url: string, index: number) => (
              <div key={index} className="mb-3 p-2 bg-white rounded border">
                <p className="font-medium">Image {index + 1}:</p>
                <p className="text-sm break-all">{url}</p>
                <div className="mt-2 flex items-center">
                  <span className="mr-2">Valid URL:</span>
                  {url && url.startsWith('http') ? (
                    <span className="text-green-600 font-bold">✓ YES</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗ NO</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-500">No image URLs found!</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Image Display Tests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test 1: Direct img tag */}
          <div className="p-4 bg-white rounded border">
            <h3 className="font-medium mb-2">1. Direct &lt;img&gt; tag</h3>
            {car.image_urls && car.image_urls[0] && (
              <img 
                src={car.image_urls[0]} 
                alt="Direct img test" 
                className="w-full h-48 object-cover rounded"
                onError={(e) => {
                  console.log('Direct img failed to load');
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=300&fit=crop&crop=center&auto=format&q=80';
                }}
              />
            )}
          </div>

          {/* Test 2: LazyImage component */}
          <div className="p-4 bg-white rounded border">
            <h3 className="font-medium mb-2">2. LazyImage Component</h3>
            {car.image_urls && car.image_urls[0] && (
              <LazyImage 
                src={car.image_urls[0]} 
                alt="LazyImage test" 
                className="w-full h-48 object-cover rounded"
              />
            )}
          </div>

          {/* Test 3: ImageCarousel component */}
          <div className="p-4 bg-white rounded border">
            <h3 className="font-medium mb-2">3. ImageCarousel Component</h3>
            {car.image_urls && car.image_urls.length > 0 && (
              <ImageCarousel images={car.image_urls} className="h-48" />
            )}
          </div>

          {/* Test 4: Fallback test */}
          <div className="p-4 bg-white rounded border">
            <h3 className="font-medium mb-2">4. Fallback Test</h3>
            <LazyImage 
              src="https://invalid-url-that-does-not-exist.com/broken-image.jpg" 
              alt="Fallback test" 
              className="w-full h-48 object-cover rounded"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded">
        <h2 className="text-xl font-semibold mb-2">Debug Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check browser console for any errors (F12 → Console)</li>
          <li>Check Network tab for failed image requests</li>
          <li>Verify all image URLs show "Valid URL: ✓ YES"</li>
          <li>All four image display tests above should show images (except fallback test)</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageDebugComponent;