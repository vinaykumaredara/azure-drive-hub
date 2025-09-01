import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Users, Fuel, Settings, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export interface CarCardProps {
  car: {
    id: string;
    model: string;
    image: string;
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
  const handleBookNow = () => {
    window.location.href = `/booking/${car.id}`;
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(`Hello RP CARS, I'm interested in ${car.model} (${car.id})`);
    const waUrl = `https://wa.me/919876543210?text=${text}`;
    window.open(waUrl, "_blank");
  };

  return (
    <motion.div
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        transition: { duration: 0.15, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={`group ${className}`}
    >
      <Card className="overflow-hidden bg-white shadow-card hover:shadow-hover transition-all duration-200 border-0">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={car.image}
            alt={car.model}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {car.badges?.map((badge, index) => (
              <Badge key={index} variant="secondary" className="bg-white/90 text-primary text-xs backdrop-blur-sm">
                {badge}
              </Badge>
            ))}
          </div>

          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{car.rating}</span>
          </div>

          {!car.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-white text-gray-700">Not Available</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground leading-tight">{car.model}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {car.location}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{car.seats} seats</span>
              </div>
              <div className="flex items-center space-x-1">
                <Fuel className="w-4 h-4" />
                <span>{car.fuel}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Settings className="w-4 h-4" />
                <span>{car.transmission}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(car.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <span className="text-muted-foreground">({car.reviewCount} reviews)</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <div className="text-2xl font-bold text-primary">₹{car.pricePerDay.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">per day</div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWhatsAppContact}
                  className="flex-1"
                >
                  Contact
                </Button>
                <Button
                  size="sm"
                  disabled={!car.isAvailable}
                  onClick={handleBookNow}
                  className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex-1"
                >
                  {car.isAvailable ? "Book Now" : "Unavailable"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};