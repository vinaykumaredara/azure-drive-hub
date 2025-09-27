// Robust car fetching hook with proper error handling
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { resolveCarImageUrls } from '../utils/imageUtils';

export interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuel_type: string;
  transmission: string;
  price_per_day: number;
  price_per_hour?: number;
  description?: string;
  location_city?: string;
  status: string;
  image_urls: string[];
  created_at: string;
  price_in_paise?: number;
  currency?: string;
  // Fields for atomic booking
  booking_status?: string;
  booked_by?: string;
  booked_at?: string;
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
      
      // Process images to ensure they have valid URLs
      const carsWithValidImages = (data ?? []).map(resolveCarImageUrls);
      
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