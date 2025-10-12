import React, { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart } from "lucide-react";
import ImageCarousel from "@/components/ImageCarousel";
import { useAuth } from "@/components/AuthProvider";
import { useBooking } from "@/hooks/useBooking";
import { toast } from "@/hooks/use-toast";
import { bookingIntentManager } from "@/utils/bookingIntentManager";
import { isMobileDevice } from "@/utils/deviceOptimizations";
import { bookingDebugger } from "@/utils/bookingDebugger";
import { EnhancedBookingFlow } from "@/components/EnhancedBookingFlow";

// Define the car interface
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
  // For atomic booking
  bookingStatus?: string;
  price_in_paise?: number;
  image_urls?: string[] | null;
  image_paths?: string[] | null;
  // Add status field for availability check
  status?: string;
  isArchived?: boolean;
}

interface CarCardProps {
  car: Car;
  className?: string;
  isAdminView?: boolean;
  onEdit?: (car: Car) => void;
  onDelete?: (carId: string) => void;
  onBookingSuccess?: (carId: string) => void; // Add this new prop
}

const CarCardModernComponent = ({ 
  car, 
  className = "", 
  isAdminView: _isAdminView = false,
  onEdit: _onEdit,
  onDelete: _onDelete,
  onBookingSuccess // Add this new prop
}: CarCardProps) => {
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const { user, profile, profileLoading } = useAuth();
  const { saveDraftAndRedirect } = useBooking();

  // Compute availability based on status and booking_status
  const bookingStatus = car.bookingStatus?.toString().toLowerCase() || '';
  const isPublished = car.status ? ['published', 'active', 'available'].includes(String(car.status).toLowerCase()) : true;
  const isArchived = !!(car.isArchived);
  const notBooked = !bookingStatus || !['booked', 'reserved', 'held'].includes(bookingStatus);
  const computedIsAvailable = isPublished && notBooked && !isArchived;

  // Replace the memoized handler with a fresh function that reads current values at click time
  function handleBookNow(e?: React.MouseEvent) {
    if (isBookingLoading) {
      return;
    }
    
    try {
      e?.stopPropagation();
      e?.preventDefault();
      
      bookingDebugger.logButtonClick(car.id, user, profile);

      if (!computedIsAvailable) {
        toast({
          title: "Car Not Available",
          description: "This car is not available for booking.",
          variant: "destructive",
        });
        return;
      }

      // If user is not logged in -> save intent & redirect to auth
      if (!user) {
        bookingIntentManager.saveIntent(car.id);
        bookingDebugger.logIntentSaved(car.id);
        
        const draft = {
          carId: car.id,
          pickup: { date: '', time: '' },
          return: { date: '', time: '' },
          addons: {},
          totals: { subtotal: 0, serviceCharge: 0, total: 0 }
        };
        saveDraftAndRedirect(draft);
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

      // canonical phone check: profile.phone is primary; fallback to user metadata
      const phone =
        (profile && profile.phone) ||
        (user && (user.phone || user.user_metadata?.phone || user.user_metadata?.mobile));

      if (!phone) {
        // Navigate to profile page to collect phone (preserve a draft)
        const draft = {
          carId: car.id,
          pickup: { date: '', time: '' },
          return: { date: '', time: '' },
          addons: {},
          totals: { subtotal: 0, serviceCharge: 0, total: 0 }
        };
        saveDraftAndRedirect(draft, { redirectToProfile: true });
        return;
      }

      // All checks passed -> open booking flow
      setIsBookingLoading(true);
      
      toast({
        title: "Opening Booking...",
        description: "Please wait a moment",
      });
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        setIsBookingFlowOpen(true);
        bookingDebugger.logModalOpen(car.id);
      }, 100);
    } catch (err) {
      bookingDebugger.logError('handleBookNow', err);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleWhatsAppContact = useCallback(() => {
    const text = encodeURIComponent(`Hello RP cars, I'm interested in ${car.make} ${car.model} (${car.id})`);
    const waUrl = `https://wa.me/918897072640?text=${text}`;
    window.open(waUrl, "_blank");
  }, [car.make, car.model, car.id]);

  const handleBookingSuccess = useCallback(() => {
    // Close the booking flow
    setIsBookingFlowOpen(false);
    setIsBookingLoading(false);
    
    // Call the parent component's callback if provided
    if (onBookingSuccess) {
      onBookingSuccess(car.id);
    }
  }, [car.id, onBookingSuccess]);

  // Ensure title is always a string for the booking flow
  const carForBooking = {
    ...car,
    title: car.title || car.model || 'Car'
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={isMobileDevice() ? {} : { y: -4 }}
        transition={{ duration: 0.2 }}
        className={`group grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-white ${className}`}
        role="article"
        aria-label={`${car.make} ${car.model}`}
        onClick={(e) => {
          // Prevent card-level clicks from interfering with buttons
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) {
            return;
          }
        }}
      >
        {/* Image Section */}
        <div className="relative w-full aspect-video md:aspect-[4/3] lg:aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          {car.images && car.images.length > 0 ? (
            <ImageCarousel 
              images={car.images} 
              className="w-full h-full"
              debug={false}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          )}
          
          {/* Save Button */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-sm hover:bg-white transition-colors z-10"
            aria-label={isSaved ? "Remove from saved" : "Save car"}
          >
            <Heart 
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"}`} 
            />
          </button>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1 z-10">
            {car.badges?.map((badge, index) => (
              <Badge 
                key={`${car.id}-badge-${index}`} 
                variant="secondary" 
                className="bg-white/95 text-primary text-[0.6rem] sm:text-xs backdrop-blur-sm border border-primary/10 shadow-sm px-1.5 py-0.5 sm:px-2 sm:py-1"
              >
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold leading-tight text-foreground">
              {car.make} {car.model}
              {car.year && <span className="text-muted-foreground ml-2 text-xs sm:text-sm">({car.year})</span>}
            </h3>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 mr-1 text-primary" />
              <span className="truncate">{car.location}</span>
            </div>
            
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2 text-[0.6rem] sm:text-xs">
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-muted">Seats: {car.seats}</span>
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-muted capitalize">{car.fuel}</span>
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-muted capitalize">{car.transmission}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 sm:mt-4">
            <div className="text-lg sm:text-xl font-bold text-primary">₹{car.pricePerDay.toLocaleString('en-IN')}/day</div>
            <div className="flex gap-2 sm:gap-3 relative z-20 flex-shrink-0">
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleWhatsAppContact();
                }}
                className="text-xs sm:text-sm whitespace-nowrap relative z-10 pointer-events-auto"
              >
                Contact
              </Button>
              <Button 
                type="button"
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleBookNow(e);
                }}
                disabled={!computedIsAvailable}
                data-testid={`book-now-${car.id}`}
                className="text-xs sm:text-sm whitespace-nowrap relative z-20 pointer-events-auto"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </motion.article>

      {isBookingLoading && !isBookingFlowOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading booking form...</p>
          </div>
        </div>
      )}

      {isBookingFlowOpen && (
        <EnhancedBookingFlow
          car={carForBooking} 
          onClose={() => {
            setIsBookingFlowOpen(false);
            setIsBookingLoading(false);
            bookingDebugger.logModalClose();
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const CarCardModern = memo(CarCardModernComponent);