import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Users, Fuel, Settings, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CarImageGalleryCompact } from "@/components/CarImageGallery";
import { AtomicBookingFlow } from "@/components/AtomicBookingFlow";
import LazyImage from "@/components/LazyImage";
import { RatingsSummary } from "@/components/RatingsSummary";
import ImageCarousel from '@/components/ImageCarousel';

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
    image_urls?: string[];
  };
  className?: string;
}

export const CarCard = ({ car, className = "" }: CarCardProps) => {
  const navigate = useNavigate();
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleBookNow = () => {
    if (car.isAvailable) {
      setIsBookingFlowOpen(true);
    } else {
      // Already booked - show message
      alert("This car is already booked. Please choose another car.");
    }
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(`Hello RP cars, I'm interested in ${car.model} (${car.id})`);
    const waUrl = `https://wa.me/918897072640?text=${text}`;
    window.open(waUrl, "_blank");
  };

  const handleBookingSuccess = () => {
    // Refresh the page or update the car list to show the car is now booked
    window.location.reload();
  };

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

  // Get the first image URL for the card display
  const getPrimaryImageUrl = () => {
    // Prefer image_urls if available
    if (car.image_urls && car.image_urls.length > 0) {
      return car.image_urls[0];
    }
    
    // Fallback to images array
    if (car.images && car.images.length > 0) {
      return car.images[0];
    }
    
    // Fallback to single image
    if (car.image) {
      return car.image;
    }
    
    // Default placeholder
    return 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';
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
          <div className="relative aspect-video overflow-hidden">
            {/* Lazy loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            )}
            
            {/* Use ImageCarousel with fallback UI */}
            {car.image_urls && car.image_urls.length > 0 ? (
              <ImageCarousel images={car.image_urls} className="h-full" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

            {!car.isAvailable && (
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
                  disabled={!car.isAvailable}
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

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <motion.div 
                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Users className="w-4 h-4" />
                  <span>{car.seats} seats</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Fuel className="w-4 h-4" />
                  <span className="capitalize">{car.fuel}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Settings className="w-4 h-4" />
                  <span className="capitalize">{car.transmission}</span>
                </motion.div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex flex-col">
                  <motion.div 
                    className="text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    ₹{car.pricePerDay.toLocaleString()}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">per day</div>
                </div>
                
                <div className="flex gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleWhatsAppContact}
                      className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300"
                    >
                      Contact
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      disabled={!car.isAvailable}
                      onClick={handleBookNow}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {car.isAvailable ? "Book Now" : "Unavailable"}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {isBookingFlowOpen && (
        <AtomicBookingFlow
          car={{
            id: car.id,
            title: car.title || car.model,
            image: car.image,
            pricePerDay: car.pricePerDay,
            price_in_paise: car.price_in_paise,
            seats: car.seats,
            fuel: car.fuel,
            transmission: car.transmission
          }}
          onClose={() => setIsBookingFlowOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};