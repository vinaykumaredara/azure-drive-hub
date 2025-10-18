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
    
    const startTime = performance.now();
    
    try {
      // Optimized query with pagination and specific field selection
      const { data, error, count } = await supabase
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
          image_paths,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `, { count: 'planned' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(0, 11); // Paginate - load 12 cars at a time (0-11 = 12 items)
      
      if (error) {throw error;}

      const endTime = performance.now();
      console.info(`Database query took ${endTime - startTime} milliseconds`);
      
      // Simply set the cars without unnecessary validation
      setCars(data ?? []);
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