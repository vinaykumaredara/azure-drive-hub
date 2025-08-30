import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Fuel, Settings, MapPin } from "lucide-react";

interface CarCardProps {
  car: {
    id: string;
    name: string;
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
  return (
    <Card className={`car-card stagger-item group ${className}`}>
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={car.image} 
            alt={car.name}
            className="car-card-image w-full h-48 object-cover"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {car.badges?.map((badge, index) => (
              <Badge key={index} variant="secondary" className="bg-white/90 text-xs font-medium">
                {badge}
              </Badge>
            ))}
            {!car.isAvailable && (
              <Badge variant="destructive" className="text-xs">Not Available</Badge>
            )}
          </div>

          {/* Rating */}
          <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 rounded-full px-2 py-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{car.rating}</span>
            <span className="text-xs text-muted-foreground">({car.reviewCount})</span>
          </div>
        </div>

        <div className="p-4">
          {/* Car Name & Location */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-foreground mb-1">{car.name}</h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{car.location}</span>
            </div>
          </div>

          {/* Specifications */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
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

          {/* Price & Action */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">₹{car.pricePerDay}</span>
              <span className="text-sm text-muted-foreground">/day</span>
            </div>
            <Button 
              className={`bg-gradient-primary text-white hover:shadow-lg transition-all duration-200 ${
                !car.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!car.isAvailable}
            >
              {car.isAvailable ? 'Book Now' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};