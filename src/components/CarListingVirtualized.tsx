import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CarCardModern } from "@/components/CarCardModern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { EmptyCarState } from "@/components/EmptyCarState";

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
}

interface CarListingVirtualizedProps {
  cars: Car[];
  isAdminView?: boolean;
  onEdit?: (car: Car) => void;
  onDelete?: (carId: string) => void;
}

const filterOptions = [
  { label: "All Seats", value: "all" },
  { label: "4 Seats", value: "4" },
  { label: "5 Seats", value: "5" },
  { label: "7+ Seats", value: "7" },
];

const fuelTypes = [
  { label: "All Fuel Types", value: "all" },
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Electric", value: "electric" },
];

const sortOptions = [
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Rating: High to Low", value: "rating-desc" },
  { label: "Most Popular", value: "popular" },
];

export const CarListingVirtualized = ({ 
  cars, 
  isAdminView = false,
  onEdit,
  onDelete
}: CarListingVirtualizedProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seatFilter, setSeatFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  // Filter and sort cars
  const processedCars = useMemo(() => {
    let filtered = [...cars];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(car => 
        car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply seat filter
    if (seatFilter !== "all") {
      filtered = filtered.filter(car => car.seats?.toString() === seatFilter);
    }

    // Apply fuel filter
    if (fuelFilter !== "all") {
      filtered = filtered.filter(car => car.fuel?.toLowerCase() === fuelFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case "rating-desc":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // "popular" - default order (newest first)
        break;
    }

    return filtered;
  }, [cars, searchQuery, seatFilter, fuelFilter, sortBy]);

  if (processedCars.length === 0) {
    return <EmptyCarState />;
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search cars..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={seatFilter} onValueChange={setSeatFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Seats" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={fuelFilter} onValueChange={setFuelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              {fuelTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Found <span className="font-semibold text-foreground">{processedCars.length} cars</span> available
        </p>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Advanced Filters</span>
        </Button>
      </div>

      {/* Car Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {processedCars.map((car, index) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <CarCardModern 
              car={car} 
              isAdminView={isAdminView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};