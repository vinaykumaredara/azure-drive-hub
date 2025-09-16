import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Users, Fuel, Settings, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CarImageGalleryCompact } from "@/components/CarImageGallery";

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
  };
  className?: string;
}

export const CarCard = ({ car, className = "" }: CarCardProps) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate(`/booking/${car.id}`);
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(`Hello RP cars, I'm interested in ${car.model} (${car.id})`);
    const waUrl = `https://wa.me/918897072640?text=${text}`;
    window.open(waUrl, "_blank");
  };

  return (
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
          <CarImageGalleryCompact
            images={car.images || [car.image]}
            carTitle={car.make ? `${car.make} ${car.model}` : car.model}
          />
          
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

            <div className="flex items-center space-x-2 text-sm py-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Star className={`w-4 h-4 ${
                      i < Math.floor(car.rating) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-gray-300"
                    }`} />
                  </motion.div>
                ))}
              </div>
              <span className="text-muted-foreground font-medium">({car.reviewCount} reviews)</span>
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
  );
};