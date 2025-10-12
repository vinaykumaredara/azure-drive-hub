import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { bookingIntentManager } from '@/utils/bookingIntentManager';
import { bookingDebugger } from '@/utils/bookingDebugger';
import { toast } from '@/hooks/use-toast';

export const useBookingResume = () => {
  const { user, profile, profileLoading } = useAuth();
  const [isResuming, setIsResuming] = useState(false);
  const [resumedCar, setResumedCar] = useState<any>(null);
  
  const attemptResume = useCallback(async () => {
    if (!user || profileLoading) return;
    
    // Acquire lock to prevent duplicate processing
    if (bookingIntentManager.isLocked()) {
      console.debug('[BookingResume] Already processing, skipping');
      return;
    }
    
    const releaseLock = await bookingIntentManager.acquireLock();
    
    try {
      const intent = bookingIntentManager.getIntent();
      if (!intent || intent.type !== 'BOOK_CAR') {
        releaseLock();
        return;
      }
      
      console.debug('[BookingResume] Attempting resume', intent);
      
      if (bookingIntentManager.isExpired(intent)) {
        console.debug('[BookingResume] Intent expired');
        bookingIntentManager.clearIntent();
        releaseLock();
        return;
      }
      
      setIsResuming(true);
      
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
      bookingIntentManager.clearIntent();
      
      // Set car and let parent component handle modal opening
      setResumedCar(carForBooking);
      
      bookingDebugger.logIntentResumed(intent.carId);
      
      toast({
        title: "Booking Resumed",
        description: `Continuing booking for ${carForBooking.title}`,
      });
      
    } catch (error) {
      console.error('[BookingResume] ERROR', error);
      bookingDebugger.logError('attemptResume', error);
      bookingIntentManager.clearIntent();
      toast({
        title: "Resume Failed",
        description: "Could not resume your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      releaseLock();
      setIsResuming(false);
    }
  }, [user, profileLoading]);
  
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
