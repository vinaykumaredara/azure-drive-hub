import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { bookingIntentStorage } from '@/utils/bookingIntent';
import { toast } from '@/hooks/use-toast';

export const useBookingResume = () => {
  const { user, profile, profileLoading } = useAuth();
  const [isResuming, setIsResuming] = useState(false);
  const [resumedCar, setResumedCar] = useState<any>(null);
  
  const attemptResume = useCallback(async () => {
    if (!user || profileLoading || isResuming) return;
    
    const intent = bookingIntentStorage.get();
    if (!intent || intent.type !== 'BOOK_CAR') return;
    
    console.debug('[BookingResume] Attempting resume', intent);
    
    if (bookingIntentStorage.isExpired(intent)) {
      console.debug('[BookingResume] Intent expired');
      bookingIntentStorage.clear();
      return;
    }
    
    setIsResuming(true);
    
    try {
      // Fetch car details
      const { data: car, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', intent.carId)
        .single();
      
      if (error) throw error;
      
      if (!car) {
        throw new Error('Car not found');
      }
      
      // Transform car data
      const carForBooking = {
        id: car.id,
        title: car.title || car.model,
        image: car.image_urls?.[0] || car.image_paths?.[0] || '',
        pricePerDay: car.price_per_day,
        price_in_paise: car.price_in_paise,
        seats: car.seats,
        fuel: car.fuel_type,
        transmission: car.transmission,
      };
      
      console.debug('[BookingResume] Car fetched, opening flow', carForBooking);
      
      // Clear intent BEFORE opening modal to prevent loops
      bookingIntentStorage.clear();
      
      // Set car and let parent component handle modal opening
      setResumedCar(carForBooking);
      
      toast({
        title: "Booking Resumed",
        description: `Continuing booking for ${carForBooking.title}`,
      });
      
    } catch (error) {
      console.error('[BookingResume] ERROR', error);
      bookingIntentStorage.clear();
      toast({
        title: "Resume Failed",
        description: "Could not resume your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResuming(false);
    }
  }, [user, profileLoading, isResuming]);
  
  // Auto-attempt resume on auth change
  useEffect(() => {
    if (user && !profileLoading) {
      attemptResume();
    }
  }, [user, profileLoading, attemptResume]);
  
  // Listen to custom event
  useEffect(() => {
    const handler = () => {
      console.debug('[BookingResume] Event received, attempting resume');
      attemptResume();
    };
    
    window.addEventListener('bookingIntentSaved', handler);
    return () => window.removeEventListener('bookingIntentSaved', handler);
  }, [attemptResume]);
  
  const clearResumedCar = () => setResumedCar(null);
  
  return { resumedCar, isResuming, clearResumedCar };
};
