import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PhoneModal } from '@/components/PhoneModal';
import { savePendingIntent } from '@/utils/bookingIntentUtils';

// Lazy load the booking modal to improve initial load performance
const BookingModal = lazy(() => import('@/components/BookingModal/BookingModal'));

interface Car {
  id: string;
  title: string;
  model: string;
  make?: string;
  year?: number;
  image: string;
  images?: string[];
  pricePerDay: number;
  location: string;
  fuel: string;
  transmission: string;
  seats: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  badges?: string[];
  thumbnail?: string;
  bookingStatus?: string;
  price_in_paise?: number;
  image_urls?: string[] | null;
  image_paths?: string[] | null;
  status?: string;
  isArchived?: boolean;
}

interface NewBookNowButtonProps {
  car: Car;
}

export const NewBookNowButton: React.FC<NewBookNowButtonProps> = ({ car }) => {
  const { isBookingModalOpen, openBookingModal, closeBookingModal } = useBookingFlow();
  const { user, profile, profileLoading } = useAuth();
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Compute isAvailable defensively - make the logic match backend values and handle undefined gracefully
  const bookingStatus = (car.bookingStatus || '').toString().toLowerCase();
  const isPublished = car.status ? ['published', 'active', 'available'].includes(String(car.status).toLowerCase()) : true;
  const isArchived = !!(car.isArchived || false);
  const notBooked = !(bookingStatus === 'booked' || bookingStatus === 'reserved' || bookingStatus === 'held');
  const computedIsAvailable = isPublished && notBooked && !isArchived;

  // Prefetch the booking modal module to avoid lazy loading delays
  useEffect(() => {
    // Start loading the booking modal module in the background
    import('@/components/BookingModal/BookingModal').catch(err => {
      console.warn('[NewBookNowButton] Failed to prefetch booking modal:', err);
    });
  }, []);

  const handleBookNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Ensure proper event handling
      e.stopPropagation();
      e.preventDefault();
      
      console.log('[NewBookNowButton] Book Now clicked', { 
        carId: car.id, 
        user: !!user, 
        profileLoading,
        computedIsAvailable 
      });

      // Defensive check for button availability
      if (!computedIsAvailable) {
        console.warn('[NewBookNowButton] Car not available for booking', { carId: car.id, bookingStatus });
        toast({
          title: "Car Not Available",
          description: "This car is not available for booking.",
          variant: "destructive",
        });
        return;
      }

      // If user is not logged in, save pending intent and redirect to auth
      if (!user) {
        console.debug('[NewBookNowButton] User not authenticated, saving intent and redirecting to auth');
        
        // Save the booking intent with timestamp
        const payload = { type: 'BOOK_CAR' as const, carId: car.id, ts: Date.now() };
        savePendingIntent(payload);
        
        // Dispatch custom event for same-tab immediate resume
        window.dispatchEvent(new CustomEvent('bookingIntentSaved', { detail: payload }));
        
        // Show a toast to inform user
        toast({
          title: "Sign in required",
          description: "We'll resume your booking automatically after you sign in.",
        });
        
        // Redirect to auth page with next parameter
        const redirectUrl = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
        console.debug('[NewBookNowButton] Redirecting to auth:', redirectUrl);
        window.location.href = redirectUrl;
        return;
      }

      // If profile still loading, show toast and do nothing
      if (profileLoading) {
        console.debug('[NewBookNowButton] Profile still loading, showing wait message');
        toast({
          title: "Finishing Sign-in",
          description: "Please wait a second while we finish loading your profile...",
        });
        return;
      }

      // Check if user has phone number
      const phone = profile?.phone || (user && (user.phone || user.user_metadata?.phone || user.user_metadata?.mobile));

      if (!phone) {
        console.debug('[NewBookNowButton] User has no phone number, opening phone collection modal');
        // Open phone collection modal
        setIsPhoneModalOpen(true);
        return;
      }

      // All checks passed -> open booking modal
      console.debug('[NewBookNowButton] All checks passed, opening booking modal');
      openBookingModal(car);
    } catch (err) {
      console.error('[NewBookNowButton] Unexpected error in handleBookNow:', err);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please check the console or contact support.",
        variant: "destructive",
      });
    }
  };

  const handlePhoneModalComplete = () => {
    console.debug('[NewBookNowButton] Phone collection complete, opening booking modal');
    setIsPhoneModalOpen(false);
    // After phone is collected, open booking modal
    openBookingModal(car);
  };

  return (
    <>
      <Button 
        type="button"
        size="sm" 
        onClick={handleBookNow}
        disabled={!computedIsAvailable}
        data-testid={`bookNow-${car.id}`}
        id={`book-now-btn-${car.id}`}
        className="text-[0.6rem] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Book Now
      </Button>
      
      {/* Phone collection modal */}
      {isPhoneModalOpen && (
        <PhoneModal 
          onClose={() => setIsPhoneModalOpen(false)} 
          onComplete={handlePhoneModalComplete}
        />
      )}
      
      {/* Lazy-loaded booking modal */}
      {isBookingModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        }>
          <BookingModal 
            isOpen={isBookingModalOpen}
            onClose={closeBookingModal}
            car={car}
          />
        </Suspense>
      )}
    </>
  );
};