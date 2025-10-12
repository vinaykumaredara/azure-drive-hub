import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { bookingIntentStorage } from '@/utils/bookingIntent';
import { toast } from '@/hooks/use-toast';

export const useBookingResume = () => {
  const { user, profile, profileLoading } = useAuth();
  const [isResuming, setIsResuming] = useState(false);
  const [resumedCar, setResumedCar] = useState<any>(null);
  const resumeLockRef = useRef(false);
  
  // Use ref to store the resume function and prevent recreation
  const attemptResumeRef = useRef<() => Promise<void>>();
  
  useEffect(() => {
    attemptResumeRef.current = async () => {
      // Guard against concurrent resume attempts
      if (!user || profileLoading || isResuming || resumeLockRef.current) {
        console.debug('[BookingResume] Skipping resume', { 
          user: !!user, 
          profileLoading, 
          isResuming, 
          locked: resumeLockRef.current 
        });
        return;
      }
      
      const intent = bookingIntentStorage.get();
      if (!intent || intent.type !== 'BOOK_CAR') {
        console.debug('[BookingResume] No valid intent found');
        return;
      }
      
      console.debug('[BookingResume] Attempting resume', intent);
      
      if (bookingIntentStorage.isExpired(intent)) {
        console.debug('[BookingResume] Intent expired');
        bookingIntentStorage.clear();
        return;
      }
      
      // Set lock to prevent duplicate attempts
      resumeLockRef.current = true;
      setIsResuming(true);
      
      try {
        // PHASE D: Prefetch booking modal before resume
        console.debug('[BookingResume] Prefetching booking modal...');
        await import('@/components/EnhancedBookingFlow');
        
        // Fetch car details with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const { data: car, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', intent.carId)
          .abortSignal(controller.signal)
          .single();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('[BookingResume] DB error', error);
          throw error;
        }
        
        if (!car) {
          throw new Error('Car not found');
        }
        
        // Transform car data
        const carForBooking = {
          id: car.id,
          title: car.title || car.model || 'Car',
          image: car.image_urls?.[0] || car.image_paths?.[0] || '',
          pricePerDay: car.price_per_day || 0,
          price_in_paise: car.price_in_paise,
          seats: car.seats || 4,
          fuel: car.fuel_type || 'petrol',
          transmission: car.transmission || 'manual',
        };
        
        console.debug('[BookingResume] Car fetched successfully', carForBooking);
        
        // Clear intent BEFORE setting car to prevent loops
        bookingIntentStorage.clear();
        
        // Set car and let parent component handle modal opening
        setResumedCar(carForBooking);
        
        toast({
          title: "Booking Resumed",
          description: `Continuing booking for ${carForBooking.title}`,
        });
        
      } catch (error: any) {
        console.error('[BookingResume] ERROR', error);
        bookingIntentStorage.clear();
        
        // Only show error toast if not aborted
        if (error?.name !== 'AbortError') {
          toast({
            title: "Resume Failed",
            description: error?.message || "Could not resume your booking. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsResuming(false);
        resumeLockRef.current = false;
      }
    };
  }, [user, profileLoading, isResuming]);
  
  // Auto-attempt resume on auth change (stable deps)
  useEffect(() => {
    if (user && !profileLoading && attemptResumeRef.current) {
      console.debug('[BookingResume] Auth ready, attempting resume');
      attemptResumeRef.current();
    }
  }, [user, profileLoading]);
  
  // Listen to custom event (stable deps)
  useEffect(() => {
    const handler = () => {
      console.debug('[BookingResume] CustomEvent received, attempting resume');
      if (attemptResumeRef.current) {
        attemptResumeRef.current();
      }
    };
    
    window.addEventListener('bookingIntentSaved', handler);
    return () => window.removeEventListener('bookingIntentSaved', handler);
  }, []);
  
  const clearResumedCar = useCallback(() => {
    console.debug('[BookingResume] Clearing resumed car');
    setResumedCar(null);
  }, []);
  
  return { resumedCar, isResuming, clearResumedCar };
};
