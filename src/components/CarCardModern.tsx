import React, { useState, memo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart } from "lucide-react";
import SimpleImage from "@/components/SimpleImage";
import { EnhancedBookingFlow } from "@/components/EnhancedBookingFlow"; // Changed from AtomicBookingFlow to EnhancedBookingFlow
import { useAuth } from "@/components/AuthProvider";
import { useBooking } from "@/hooks/useBooking";
import { toast } from "@/hooks/use-toast";

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
  const { user, profile, profileLoading } = useAuth();
  const { saveDraftAndRedirect } = useBooking();

  // Compute isAvailable defensively - make the logic match backend values and handle undefined gracefully
  const bookingStatus = (car.bookingStatus || '').toString().toLowerCase();
  const isPublished = car.status ? ['published', 'active', 'available'].includes(String(car.status).toLowerCase()) : true;
  const isArchived = !!(car.isArchived || false);
  const notBooked = !(bookingStatus === 'booked' || bookingStatus === 'reserved' || bookingStatus === 'held');
  const computedIsAvailable = isPublished && notBooked && !isArchived;

  // Replace the memoized handler with a fresh function that reads current values at click time
  function handleBookNow(e?: React.MouseEvent) {
    try {
      e?.preventDefault();


      if (!computedIsAvailable) {
        // Use toast instead of alert for better UX
        toast({
          title: "Car Not Available",
          description: "This car is not available for booking.",
          variant: "destructive",
        });
        return;
      }

      // If user is not logged in -> save draft & redirect to auth
      if (!user) {
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
        saveDraftAndRedirect(draft, { redirectToProfile: true }); // add optional param to go to profile page
        return;
      }

      // All checks passed -> open booking flow
      setIsBookingFlowOpen(true);
    } catch (err) {
      console.error('[BookNow] unexpected error', err);
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
    // Update the car's availability state locally to reflect that it's now booked
    
    // Close the booking flow
    setIsBookingFlowOpen(false);
    
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
        <div className="relative w-full aspect-video overflow-hidden rounded-xl">
          <SimpleImage 
            src={car.thumbnail || car.image} 
            alt={`${car.make} ${car.model}`} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            lazy={true}
          />
          
          {/* Save Button */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-sm hover:bg-white transition-colors"
            aria-label={isSaved ? "Remove from saved" : "Save car"}
          >
            <Heart 
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"}`} 
            />
          </button>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1">
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
            <div className="flex gap-1 sm:gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleWhatsAppContact}
                className="text-[0.6rem] sm:text-xs px-2 py-1 sm:px-3 sm:py-2"
              >
                Contact
              </Button>
              <Button 
                size="sm" 
                onClick={handleBookNow}
                disabled={!computedIsAvailable}
                aria-disabled={!computedIsAvailable}
                data-testid={`book-now-${car.id}`}
                id={`book-now-btn-${car.id}`}
                className={`text-[0.6rem] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 ${computedIsAvailable ? "" : "opacity-50 cursor-not-allowed"}`}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </motion.article>

      {isBookingFlowOpen && (
        <EnhancedBookingFlow // Changed from AtomicBookingFlow to EnhancedBookingFlow
          car={carForBooking} 
          onClose={() => setIsBookingFlowOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const CarCardModern = memo(CarCardModernComponent);