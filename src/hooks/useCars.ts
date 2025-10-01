// Robust car fetching hook with proper error handling
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { getPublicOrSignedUrl } from '../utils/imageUtils';

export interface Car {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  seats: number | null;
  fuel_type: string | null;
  transmission: string | null;
  price_per_day: number;
  price_per_hour?: number | null;
  description?: string | null;
  location_city?: string | null;
  status: string | null;
  image_urls: string[] | null; // Make it explicitly nullable
  created_at: string | null;
  price_in_paise?: number | null;
  currency?: string | null;
  // Fields for atomic booking
  booking_status?: string | null;
  booked_by?: string | null;
  booked_at?: string | null;
}

export default function useCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          price_per_hour,
          description,
          location_city,
          status,
          image_urls,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {throw error;}

      // CRITICAL: Validate and resolve ALL image URLs before setting state
      const carsWithValidImages = await Promise.all(
        (data ?? []).map(async (car: any) => {
          if (car.image_urls && car.image_urls.length > 0) {
            const validUrls = [];
            for (const url of car.image_urls) {
              // Use existing getPublicOrSignedUrl function
              const resolvedUrl = getPublicOrSignedUrl(url);
              if (resolvedUrl) {
                try {
                  // Quick HEAD check to verify URL accessibility with timeout
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000);
                  
                  const response = await fetch(resolvedUrl, { 
                    method: 'HEAD', 
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);
                  
                  if (response.ok && response.headers.get('content-type')?.startsWith('image')) {
                    validUrls.push(resolvedUrl);
                  } else {
                    // Use fallback for invalid responses
                    validUrls.push('https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80');
                  }
                } catch {
                  // Use fallback for network errors
                  validUrls.push('https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80');
                }
              }
            }
            car.image_urls = validUrls.length > 0 ? validUrls : ['https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80'];
          }
          return car;
        })
      );

      setCars(carsWithValidImages);
    } catch (err) {
      console.error('Failed to fetch cars', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { cars, loading, error, refetch: load };
}