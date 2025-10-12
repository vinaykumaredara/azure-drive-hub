// Utility functions for handling booking intent persistence and resuming

export interface PendingIntent {
  type: 'BOOK_CAR';
  carId: string;
  startAt?: string | null;
  endAt?: string | null;
  ts: number;
}

// Import the Car type from useBookingFlow
import type { Car } from '@/hooks/useBookingFlow';

const PENDING_INTENT_KEY = 'pendingIntent';

/**
 * Save a pending booking intent to localStorage
 */
export function savePendingIntent(payload: Omit<PendingIntent, 'ts'>) {
  const intent: PendingIntent = {
    ...payload,
    ts: Date.now()
  };
  
  try {
    localStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
    console.debug('[BookingIntent] Saved pending intent:', intent);
    return true;
  } catch (err) {
    console.error('[BookingIntent] Failed to save pending intent:', err);
    return false;
  }
}

/**
 * Retrieve a pending booking intent from localStorage
 */
export function getPendingIntent(): PendingIntent | null {
  try {
    const raw = localStorage.getItem(PENDING_INTENT_KEY);
    if (!raw) return null;
    
    const payload = JSON.parse(raw);
    if (payload?.type === 'BOOK_CAR' && payload.carId) {
      console.debug('[BookingIntent] Retrieved pending intent:', payload);
      return payload;
    }
    
    // Clear invalid intent
    clearPendingIntent();
    return null;
  } catch (err) {
    console.error('[BookingIntent] Failed to parse pending intent:', err);
    clearPendingIntent();
    return null;
  }
}

/**
 * Remove the pending booking intent from localStorage
 */
export function clearPendingIntent() {
  try {
    localStorage.removeItem(PENDING_INTENT_KEY);
    console.debug('[BookingIntent] Cleared pending intent');
    return true;
  } catch (err) {
    console.error('[BookingIntent] Failed to clear pending intent:', err);
    return false;
  }
}

/**
 * Resume a pending booking intent by fetching car details and opening the booking modal
 */
export async function resumePendingIntent(openBookingModal: (car: Car) => void) {
  const intent = getPendingIntent();
  if (!intent) {
    console.debug('[BookingIntent] No pending intent to resume');
    return false;
  }
  
  // Add a small delay to ensure components are mounted
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    console.debug('[BookingIntent] Resuming pending intent:', intent);
    
    // Import Supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Fetch car details
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
        image_paths,
        created_at,
        price_in_paise,
        currency,
        booking_status,
        booked_by,
        booked_at
      `)
      .eq('id', intent.carId)
      .single<{
        id: string;
        title: string;
        make: string | null;
        model: string | null;
        year: number | null;
        seats: number | null;
        fuel_type: string | null;
        transmission: string | null;
        price_per_day: number;
        price_per_hour: number | null;
        description: string | null;
        location_city: string | null;
        status: string | null;
        image_urls: string[] | null;
        image_paths: string[] | null;
        created_at: string | null;
        price_in_paise: number | null;
        currency: string | null;
        booking_status: string | null;
        booked_by: string | null;
        booked_at: string | null;
      }>();
    
    if (error) {
      console.error('[BookingIntent] Failed to fetch car details:', error);
      clearPendingIntent();
      return false;
    }
    
    // Check if car data exists
    if (!data) {
      console.error('[BookingIntent] Car not found:', intent.carId);
      clearPendingIntent();
      return false;
    }
    
    // Transform car data to match the expected format
    const transformedCar: Car = {
      id: data.id,
      title: data.title,
      make: data.make || undefined, // Convert null to undefined to match Car type
      model: data.model || '',
      year: data.year || undefined,
      image: data.image_urls?.[0] || '',
      images: data.image_urls || [],
      pricePerDay: data.price_in_paise ? data.price_in_paise / 100 : data.price_per_day,
      location: data.location_city || 'Hyderabad',
      fuel: data.fuel_type || '',
      transmission: data.transmission || '',
      seats: data.seats || 0,
      rating: 4.5 + (Math.random() * 0.4), // Random rating between 4.5-4.9
      reviewCount: Math.floor(Math.random() * 50) + 15, // Random reviews 15-65
      isAvailable: data.status === 'published' && data.booking_status !== 'booked',
      badges: data.status === 'published' && data.booking_status !== 'booked' ? ['Available', 'Verified'] : ['Booked'],
      thumbnail: data.image_urls?.[0] || '',
      bookingStatus: data.booking_status || undefined,
      price_in_paise: data.price_in_paise || undefined,
      image_urls: data.image_urls || undefined,
      image_paths: data.image_paths || undefined,
      status: data.status || undefined
    };
    
    // Open the booking modal
    console.debug('[BookingIntent] Opening booking modal for car:', transformedCar.id);
    openBookingModal(transformedCar);
    
    // Clear the pending intent
    clearPendingIntent();
    console.debug('[BookingIntent] Successfully resumed booking for car:', transformedCar.id);
    return true;
  } catch (err) {
    console.error('[BookingIntent] Failed to resume pending intent:', err);
    clearPendingIntent();
    return false;
  }
}