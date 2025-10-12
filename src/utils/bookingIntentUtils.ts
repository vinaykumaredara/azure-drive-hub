// Utility functions for handling booking intent persistence and resuming

export interface PendingIntent {
  type: 'BOOK_CAR';
  carId: string;
  startAt?: string | null;
  endAt?: string | null;
  ts: number;
}

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
  } catch (err) {
    console.error('[BookingIntent] Failed to save pending intent:', err);
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
    
    return null;
  } catch (err) {
    console.error('[BookingIntent] Failed to parse pending intent:', err);
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
  } catch (err) {
    console.error('[BookingIntent] Failed to clear pending intent:', err);
  }
}

/**
 * Resume a pending booking intent by fetching car details and opening the booking modal
 */
export async function resumePendingIntent(openBookingModal: (car: any) => void) {
  const intent = getPendingIntent();
  if (!intent) return false;
  
  try {
    // Import Supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Fetch car details
    const { data: car, error } = await supabase
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
      .single();
    
    if (error) {
      console.error('[BookingIntent] Failed to fetch car details:', error);
      clearPendingIntent();
      return false;
    }
    
    // Transform car data to match the expected format
    const transformedCar = {
      id: car.id,
      title: car.title,
      make: car.make,
      model: car.model || '',
      year: car.year,
      image: car.image_urls?.[0] || '',
      images: car.image_urls || [],
      pricePerDay: car.price_in_paise ? car.price_in_paise / 100 : car.price_per_day,
      pricePerHour: car.price_per_hour || ((car.price_in_paise ? car.price_in_paise / 100 : car.price_per_day) / 24),
      location: car.location_city || 'Hyderabad',
      fuel: car.fuel_type,
      transmission: car.transmission,
      seats: car.seats,
      rating: 4.5 + (Math.random() * 0.4), // Random rating between 4.5-4.9
      reviewCount: Math.floor(Math.random() * 50) + 15, // Random reviews 15-65
      isAvailable: car.status === 'published' && car.booking_status !== 'booked',
      badges: car.status === 'published' && car.booking_status !== 'booked' ? ['Available', 'Verified'] : ['Booked'],
      features: ['GPS', 'AC', 'Bluetooth', 'Insurance'],
      description: car.description || `${car.make} ${car.model} - Perfect for city drives and long trips`,
      bookingStatus: car.booking_status,
      bookedBy: car.booked_by,
      bookedAt: car.booked_at,
      image_urls: car.image_urls,
      image_paths: car.image_paths || null,
      thumbnail: car.image_urls?.[0] || '',
      status: car.status
    };
    
    // Open the booking modal
    openBookingModal(transformedCar);
    console.debug('[BookingIntent] Resumed booking for car:', transformedCar.id);
    
    // Clear the pending intent
    clearPendingIntent();
    return true;
  } catch (err) {
    console.error('[BookingIntent] Failed to resume pending intent:', err);
    clearPendingIntent();
    return false;
  }
}