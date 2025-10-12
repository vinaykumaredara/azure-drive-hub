import React, { useState, memo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart } from "lucide-react";
import ImageCarousel from "@/components/ImageCarousel";
import { EnhancedBookingFlow } from "@/components/EnhancedBookingFlow";
import { useAuth } from "@/components/AuthProvider";
import { useBooking } from "@/hooks/useBooking";
import { toast } from "@/hooks/use-toast";
import { bookingIntentStorage } from "@/utils/bookingIntent";

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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute availability based on status and booking_status
  const bookingStatus = car.bookingStatus?.toString().toLowerCase() || '';
  const isPublished = car.status ? ['published', 'active', 'available'].includes(String(car.status).toLowerCase()) : true;
  const isArchived = !!(car.isArchived);
  const notBooked = !bookingStatus || !['booked', 'reserved', 'held'].includes(bookingStatus);
  const computedIsAvailable = isPublished && notBooked && !isArchived;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Replace the memoized handler with a fresh function that reads current values at click time
  function handleBookNow(e?: React.MouseEvent) {
    console.debug('[BookNow] Button clicked', { carId: car.id, user: !!user, profile: !!profile });
    
    if (isBookingLoading) {
      console.debug('[BookNow] Already loading, ignoring');
      return;
    }
    
    try {
      e?.stopPropagation();
      e?.preventDefault();
      console.debug('[handleBookNow] ENTRY', { 
        carId: car.id, 
        user: !!user, 
        profile: !!profile, 
        profileLoading,
        computedIsAvailable 
      });

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
        bookingIntentStorage.save({
          type: 'BOOK_CAR',
          carId: car.id,
          timestamp: Date.now(),
        });
        
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

      // Validate car data before opening modal
      const carData = {
        ...car,
        title: car.title || car.model || 'Car'
      };
      
      if (!carData.id) {
        throw new Error('Invalid car data: missing ID');
      }

      // All checks passed -> open booking flow
      console.debug('[handleBookNow] Opening booking flow');
      setIsBookingLoading(true);
      
      // Safety timeout: reset loading state after 5 seconds if modal hasn't opened
      loadingTimeoutRef.current = setTimeout(() => {
        console.error('[handleBookNow] Timeout: Modal failed to open within 5 seconds');
        setIsBookingLoading(false);
        toast({
          title: "Booking Flow Error",
          description: "Failed to open booking form. Please try again.",
          variant: "destructive",
        });
      }, 5000);
      
      // Small delay to ensure UI updates, then open modal
      setTimeout(() => {
        setIsBookingFlowOpen(true);
        // Clear timeout once modal opens successfully
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }, 100);
      
    } catch (err) {
      console.error('[handleBookNow] ERROR', err);
      setIsBookingLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please check the console or contact support.",
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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={`group grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-white ${className}`}
        role="article"
        aria-label={`${car.make} ${car.model}`}
      >
        {/* Image Section */}
        <div className="relative w-full aspect-video md:aspect-[4/3] lg:aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          <ImageCarousel 
            images={car.image_urls || car.images || [car.thumbnail || car.image]} 
            className="w-full h-full"
          />
          
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
            {/* PHASE A+B: Flex container for buttons - NO OVERLAP */}
            <div 
              className="flex gap-2 sm:gap-3 items-center flex-shrink-0" 
              style={{ display: 'flex' }}
            >
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.debug('[Contact] Button clicked', { carId: car.id });
                  handleWhatsAppContact();
                }}
                className="text-xs sm:text-sm px-3 py-2 min-w-[80px]"
                disabled={isBookingLoading}
                style={{ position: 'relative', zIndex: 1 }}
              >
                Contact
              </Button>
              <Button 
                type="button"
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.debug('[BookNow] Button clicked', { carId: car.id, available: computedIsAvailable });
                  handleBookNow(e);
                }}
                disabled={!computedIsAvailable || isBookingLoading}
                aria-disabled={!computedIsAvailable || isBookingLoading}
                data-testid={`book-now-${car.id}`}
                id={`book-now-btn-${car.id}`}
                className={`text-xs sm:text-sm px-3 py-2 min-w-[90px] ${computedIsAvailable ? "" : "opacity-50 cursor-not-allowed"}`}
                style={{ 
                  position: 'relative', 
                  zIndex: 10000,  // Emergency override - Phase A
                  pointerEvents: 'auto' 
                }}
              >
                {isBookingLoading ? 'Opening...' : 'Book Now'}
              </Button>
            </div>
          </div>
        </div>
      </motion.article>

      {/* Loading overlay */}
      {isBookingLoading && !isBookingFlowOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9998]">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Opening booking flow...</p>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {isBookingFlowOpen && carForBooking && (
        <EnhancedBookingFlow
          car={carForBooking} 
          onClose={() => {
            console.debug('[CarCardModern] Closing booking flow');
            setIsBookingFlowOpen(false);
            setIsBookingLoading(false);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const CarCardModern = memo(CarCardModernComponent);