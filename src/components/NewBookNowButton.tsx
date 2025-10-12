import React, { lazy, Suspense, useState } from 'react';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PhoneModal } from '@/components/PhoneModal';

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

  const handleBookNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      
      console.log('[NewBookNowButton] Book Now clicked', { 
        carId: car.id, 
        user: !!user, 
        profileLoading,
        computedIsAvailable 
      });

      if (!computedIsAvailable) {
        // Use toast instead of alert for better UX
        toast({
          title: "Car Not Available",
          description: "This car is not available for booking.",
          variant: "destructive",
        });
        return;
      }

      // If user is not logged in, open sign-in modal
      if (!user) {
        // For now, we'll redirect to the auth page
        // In a real implementation, we would open a modal
        window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      // If profile still loading, show toast and do nothing
      if (profileLoading) {
        toast({
          title: "Finishing Sign-in",
          description: "Please wait a second while we finish loading your profile...",
        });
        return;
      }

      // Check if user has phone number
      const phone = profile?.phone || (user && (user.phone || user.user_metadata?.phone || user.user_metadata?.mobile));

      if (!phone) {
        // Open phone collection modal
        setIsPhoneModalOpen(true);
        return;
      }

      // All checks passed -> open booking modal
      openBookingModal(car);
    } catch (err) {
      console.error('[NewBookNowButton] unexpected error', err);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please check the console or contact support.",
        variant: "destructive",
      });
    }
  };

  const handlePhoneModalComplete = () => {
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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