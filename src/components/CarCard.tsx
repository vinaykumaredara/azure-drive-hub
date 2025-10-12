import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Users, Fuel, Settings, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { EnhancedBookingFlow } from "@/components/EnhancedBookingFlow";
import { RatingsSummary } from "@/components/RatingsSummary";
import ImageCarousel from '@/components/ImageCarousel';
import { useAuth } from "@/components/AuthProvider";
import { useBooking } from "@/hooks/useBooking";
import { toast } from "@/hooks/use-toast";
import { bookingIntentStorage } from "@/utils/bookingIntent";

export interface CarCardProps {
  car: {
    id: string;
    model: string;
    make?: string;
    image: string;
    images?: string[];
    rating: number;
    reviewCount: number;
    seats: number;
    fuel: string;
    transmission: string;
    pricePerDay: number;
    location: string;
    isAvailable: boolean;
    badges?: string[];
    // New fields for atomic booking
    bookingStatus?: string;
    title?: string;
    price_in_paise?: number;
    image_urls?: string[] | null; // Make it explicitly nullable
    image_paths?: string[] | null;
    thumbnail?: string;
    // Add status field for availability check
    status?: string;
  };
  className?: string;
  onBookingSuccess?: (carId: string) => void; // Add this new prop
}

export const CarCard = ({ car, className = "", onBookingSuccess }: CarCardProps) => { // Add the new prop
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false); // PHASE C: Add loading state
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // PHASE C: Add timeout ref
  const { user, profile, profileLoading } = useAuth();
  const { saveDraftAndRedirect } = useBooking();

  // Compute availability based on status and booking_status
  const bookingStatus = car.bookingStatus?.toString().toLowerCase() || '';
  const isPublished = car.status ? ['published', 'active', 'available'].includes(String(car.status).toLowerCase()) : true;
  const isArchived = !!(car as any).isArchived;
  const notBooked = !bookingStatus || !['booked', 'reserved', 'held'].includes(bookingStatus);
  const computedIsAvailable = isPublished && notBooked && !isArchived;

  // PHASE C: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // PHASE C+E: Enhanced handler with timeout, cleanup, and logging
  function handleBookNow(e?: React.MouseEvent) {
    // PHASE E: Structured logging
    const logBookingEvent = (event: string, data?: any) => {
      const timestamp = new Date().toISOString();
      console.debug(`[BookNow][${timestamp}] ${event}`, data);
    };

    // Prevent concurrent attempts
    if (isBookingLoading) {
      logBookingEvent('Concurrent click blocked', { carId: car.id });
      return;
    }
    logBookingEvent('Button clicked', { carId: car.id, user: !!user, profile: !!profile });
    
    try {
      e?.stopPropagation();
      e?.preventDefault();
      
      logBookingEvent('ENTRY', { 
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

      // Open modal immediately - no unnecessary delay
      setIsBookingLoading(true);
      logBookingEvent('Opening booking flow', { carId: car.id });
      
      // Safety timeout: reset if modal doesn't render within 3 seconds
      loadingTimeoutRef.current = setTimeout(() => {
        console.error('[handleBookNow] Timeout: Modal failed to open within 3 seconds');
        setIsBookingLoading(false);
        toast({
          title: "Booking Flow Error",
          description: "Failed to open booking form. Please try again.",
          variant: "destructive",
        });
      }, 3000);

      // Open modal immediately
      setIsBookingFlowOpen(true);
      setIsBookingLoading(false);
      
      // Clear timeout once component confirms render
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
    } catch (err) {
      console.error('[handleBookNow] ERROR', err);
      setIsBookingLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  const handleWhatsAppContact = useCallback(() => {
    const text = encodeURIComponent(`Hello RP cars, I'm interested in ${car.model} (${car.id})`);
    const waUrl = `https://wa.me/918897072640?text=${text}`;
    window.open(waUrl, "_blank");
  }, [car.model, car.id]);

  const handleBookingSuccess = useCallback(() => {
    // Refresh the page or update the car list to show the car is now booked
    setIsBookingFlowOpen(false);
    // Call the parent component's callback if provided
    if (onBookingSuccess) {
      onBookingSuccess(car.id);
    }
  }, [car.id, onBookingSuccess]);

  // Generate sample ratings data for the rating summary
  // In a real app, this would come from the database
  const generateSampleRatings = () => {
    const ratings = [];
    const avgRating = car.rating;
    const count = car.reviewCount;
    
    // Generate ratings that average to the given rating
    for (let i = 0; i < count; i++) {
      // Generate ratings with some variance around the average
      const variance = (Math.random() - 0.5) * 2; // -1 to 1
      const rating = Math.max(1, Math.min(5, Math.round((avgRating + variance) * 2) / 2)); // Round to nearest 0.5
      ratings.push(rating);
    }
    
    return ratings;
  };

  // Ensure title is always a string for the booking flow
  const carForBooking = {
    ...car,
    title: car.title || car.model || 'Car'
  };

  return (
    <>
      <motion.div
        whileHover={{ 
          y: -8, 
          scale: 1.03,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.97 }}
        className={`group ${className}`}
      >
        <Card className="overflow-hidden bg-white shadow-card hover:shadow-2xl transition-all duration-300 border-0 hover:border hover:border-primary/20">
          <div className="relative aspect-video md:aspect-[4/3] lg:aspect-[16/10] overflow-hidden w-full">
            {/* Use ImageCarousel with standardized images */}
            {car.images && car.images.length > 0 ? (
              <ImageCarousel images={car.images} className="w-full h-full object-cover" />
            ) : car.image_urls && car.image_urls.length > 0 ? (
              <ImageCarousel images={car.image_urls} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            )}
            
            {/* Enhanced Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              {car.badges?.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="secondary" className="bg-white/95 text-primary text-xs backdrop-blur-sm border border-primary/10 shadow-sm">
                    {badge}
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 shadow-sm border border-primary/10">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{car.rating.toFixed(1)}</span>
            </div>

            {!computedIsAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <Badge variant="destructive" className="bg-red-500 text-white shadow-lg">
                  Not Available
                </Badge>
              </div>
            )}

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleBookNow}
                  disabled={!computedIsAvailable}
                  aria-disabled={!computedIsAvailable}
                  data-testid={`quick-book-${car.id}`}
                  id={`quick-book-btn-${car.id}`}
                  className="bg-white/90 hover:bg-white text-primary border-0 backdrop-blur-sm shadow-lg"
                >
                  Quick Book
                </Button>
              </motion.div>
            </div>
          </div>

          <CardContent className="p-6 bg-gradient-to-br from-white via-white to-gray-50/30">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <motion.h3 
                    className="font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    {car.model}
                  </motion.h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 mr-1 text-primary" />
                    {car.location}
                  </div>
                </div>
              </div>

              {/* Modern Ratings Summary */}
              <div className="pt-2">
                <RatingsSummary 
                  ratings={generateSampleRatings()} 
                  reviewCount={car.reviewCount}
                  className="scale-90 origin-left"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-primary" />
                    {car.seats} seats
                  </div>
                  <div className="flex items-center">
                    <Fuel className="w-4 h-4 mr-1 text-primary" />
                    <span className="capitalize">{car.fuel}</span>
                  </div>
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 mr-1 text-primary" />
                    <span className="capitalize">{car.transmission}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-2xl font-bold text-primary">₹{car.pricePerDay.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-muted-foreground">/day</span>
                </div>
                {/* PHASE A+B: Flex container for buttons - NO OVERLAP */}
                <div 
                  className="flex gap-2 sm:gap-3 items-center flex-shrink-0" 
                  style={{ display: 'flex' }}
                >
                  <Button 
                    type="button"
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.debug('[Contact] Button clicked', { carId: car.id });
                      handleWhatsAppContact();
                    }} 
                    variant="outline"
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
          </CardContent>
        </Card>
      </motion.div>

      {/* PHASE C: Loading overlay */}
      {isBookingLoading && !isBookingFlowOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9998]">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Opening booking flow...</p>
          </div>
        </div>
      )}

      {isBookingFlowOpen && (
        <EnhancedBookingFlow 
          car={carForBooking} 
          onClose={() => setIsBookingFlowOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};