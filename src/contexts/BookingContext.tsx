import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { getPendingIntent, clearPendingIntent, resumePendingIntent } from '@/utils/bookingIntentUtils';
import type { Car } from '@/hooks/useBookingFlow';

interface BookingContextType {
  isReady: boolean;
  isResuming: boolean;
  attemptResume: () => Promise<void>;
  openBookingModal: (car: Car) => void;
  closeBookingModal: () => void;
  isBookingModalOpen: boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: React.ReactNode;
  openBookingModal: (car: Car) => void;
  closeBookingModal: () => void;
  isBookingModalOpen: boolean;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ 
  children, 
  openBookingModal,
  closeBookingModal,
  isBookingModalOpen
}) => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const readyRef = useRef<{resolve?: Function}>({});
  const resumingRef = useRef(false);

  // Create a promise that resolves when provider is ready
  const readyPromise = useMemo(() => new Promise<void>((resolve) => {
    readyRef.current.resolve = resolve;
  }), []);

  // Mark provider as ready when mounted
  useEffect(() => {
    console.debug('[BookingProvider] Provider is ready');
    setIsReady(true);
    readyRef.current.resolve?.();
  }, []);

  // Listener for same-tab immediate resume via CustomEvent
  useEffect(() => {
    const onBookingIntentSaved = () => {
      console.debug('[BookingProvider] Received bookingIntentSaved event');
      attemptResume();
    };
    
    window.addEventListener('bookingIntentSaved', onBookingIntentSaved as EventListener);
    return () => window.removeEventListener('bookingIntentSaved', onBookingIntentSaved as EventListener);
  }, []);

  // Attempt to resume booking intent when user becomes authenticated
  const attemptResume = useCallback(async () => {
    // Prevent multiple concurrent resume attempts
    if (resumingRef.current) {
      console.debug('[BookingProvider] Resume already in progress, skipping');
      return;
    }
    
    // Only attempt resume if we have a pending intent
    const intent = getPendingIntent();
    if (!intent) {
      console.debug('[BookingProvider] No pending intent, skipping resume');
      return;
    }
    
    resumingRef.current = true;
    setIsResuming(true);
    
    try {
      console.debug('[BookingProvider] Attempting to resume booking intent', intent);
      
      // Wait until provider is ready or timeout after 3 seconds
      await Promise.race([
        readyPromise, 
        new Promise(res => setTimeout(res, 3000))
      ]);
      
      // Show toast to inform user
      toast({
        title: "Resuming your booking",
        description: "We're resuming your booking automatically...",
      });
      
      // Resume the pending intent
      const success = await resumePendingIntent(openBookingModal);
      
      if (success) {
        console.debug('[BookingProvider] Successfully resumed booking');
        toast({
          title: "Booking resumed",
          description: "Your booking flow has been resumed successfully.",
        });
      } else {
        console.warn('[BookingProvider] Failed to resume booking');
        toast({
          title: "Booking resume failed",
          description: "We couldn't resume your booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('[BookingProvider] Error during resume attempt:', err);
      toast({
        title: "Booking resume error",
        description: "An error occurred while resuming your booking.",
        variant: "destructive",
      });
    } finally {
      resumingRef.current = false;
      setIsResuming(false);
    }
  }, [openBookingModal, readyPromise]);

  // Listen for auth state changes
  useEffect(() => {
    if (user) {
      console.debug('[BookingProvider] User authenticated, attempting resume');
      attemptResume();
    }
  }, [user, attemptResume]);

  // Also attempt resume on mount if user is already authenticated
  useEffect(() => {
    if (user) {
      console.debug('[BookingProvider] Component mounted with authenticated user, attempting resume');
      attemptResume();
    }
  }, [user, attemptResume]);

  const value = {
    isReady,
    isResuming,
    attemptResume,
    openBookingModal,
    closeBookingModal,
    isBookingModalOpen
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};