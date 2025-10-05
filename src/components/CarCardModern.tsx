import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart } from "lucide-react";
import SimpleImage from "@/components/SimpleImage";
import { AtomicBookingFlow } from "@/components/AtomicBookingFlow";

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
}

interface CarCardProps {
  car: Car;
  className?: string;
  isAdminView?: boolean;
  onEdit?: (car: Car) => void;
  onDelete?: (carId: string) => void;
}

const CarCardModernComponent = ({ 
  car, 
  className = "", 
  isAdminView: _isAdminView = false,
  onEdit: _onEdit,
  onDelete: _onDelete
}: CarCardProps) => {
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Compute isAvailable defensively - make the logic match backend values and handle undefined gracefully
  const isPublished = car.status ? ['published', 'active', 'available'].includes(car.status.toLowerCase()) : true;
  const notBooked = car.bookingStatus === undefined || car.bookingStatus === null || car.bookingStatus === '' || car.bookingStatus !== 'booked';
  const isArchived = false; // or whatever field the backend uses
  const computedIsAvailable = isPublished && notBooked && !isArchived;

  // Log car data for debugging
  console.log('CarCardModern render', { 
    id: car.id, 
    status: car.status, 
    bookingStatus: car.bookingStatus, 
    isAvailable: car.isAvailable,
    computedIsAvailable 
  });

  const handleBookNow = useCallback(() => {
    console.log("Book Now clicked for car:", car.id, "isAvailable", computedIsAvailable);
    if (computedIsAvailable) {
      console.log("Car is available, opening booking flow");
      setIsBookingFlowOpen(true);
    } else {
      console.log("Car is not available for booking");
    }
  }, [car.id, computedIsAvailable]);

  const handleWhatsAppContact = useCallback(() => {
    const text = encodeURIComponent(`Hello RP cars, I'm interested in ${car.make} ${car.model} (${car.id})`);
    const waUrl = `https://wa.me/918897072640?text=${text}`;
    window.open(waUrl, "_blank");
  }, [car.make, car.model, car.id]);

  const handleBookingSuccess = useCallback(() => {
    window.location.reload();
  }, []);

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
                className={`text-[0.6rem] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 ${computedIsAvailable ? "" : "opacity-50 cursor-not-allowed"}`}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </motion.article>

      {isBookingFlowOpen && (
        <AtomicBookingFlow 
          car={carForBooking} 
          onClose={() => setIsBookingFlowOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const CarCardModern = memo(CarCardModernComponent, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-renders
  return (
    prevProps.car.id === nextProps.car.id &&
    prevProps.car.isAvailable === nextProps.car.isAvailable &&
    prevProps.car.pricePerDay === nextProps.car.pricePerDay &&
    prevProps.car.thumbnail === nextProps.car.thumbnail
  );
});