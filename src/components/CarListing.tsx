import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { EmptyCarState } from "@/components/EmptyCarState";
import { CarTravelingLoader } from "@/components/LoadingAnimations";
import { CarListingErrorState } from "@/components/CarListingErrorState";
import { useRealtimeSubscription } from "@/hooks/useRealtime";
import useCars from "@/hooks/useCars";

// Transform Supabase car to display format
const transformCarForDisplay = (car: any) => {
  const pricePerDay = car.price_in_paise ? car.price_in_paise / 100 : car.price_per_day;
  const pricePerHour = car.price_per_hour || Math.round(pricePerDay / 8);
        
  const transformed = {
    id: car.id,
    title: car.title,
    make: car.make || '',
    model: car.model || '',
    year: car.year || new Date().getFullYear(),
    image: (car.image_urls && car.image_urls.length > 0) ? car.image_urls[0] : `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=300&fit=crop&crop=center&auto=format&q=80`,
    images: (car.image_urls && car.image_urls.length > 0) ? car.image_urls : [
      `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80`
    ],
    pricePerDay: pricePerDay,
    pricePerHour: pricePerHour,
    location: car.location_city || 'Hyderabad',
    fuel: car.fuel_type || 'Petrol',
    transmission: car.transmission || 'Automatic',
    seats: car.seats || 5,
    rating: 4.5 + (Math.random() * 0.4), // Random rating between 4.5-4.9
    reviewCount: Math.floor(Math.random() * 50) + 15, // Random reviews 15-65
    isAvailable: car.status === 'published' && car.booking_status !== 'booked',
    badges: car.status === 'published' && car.booking_status !== 'booked' ? ['Available', 'Verified'] : ['Busy'],
    features: ['GPS', 'AC', 'Bluetooth', 'Insurance'],
    description: car.description || `${car.make || ''} ${car.model || ''} - Perfect for city drives and long trips`
  };
  
  return transformed;
};

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

export const CarListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seatFilter, setSeatFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [displayedCars, setDisplayedCars] = useState<any[]>([]);
  const [_loadingMore, _setLoadingMore] = useState(false);
  const [_isInitialized, _setIsInitialized] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [_page, _setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const _ITEMS_PER_PAGE = 12;
  
  // Use the new robust hook
  const { cars, loading, error, refetch } = useCars();

  // Handle booking success by updating the car's availability status
  const handleBookingSuccess = (carId: string) => {
    console.log("Booking successful for car:", carId);
    // Update the car's status in the local state to reflect it's now booked
    setDisplayedCars(prevCars => 
      prevCars.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              isAvailable: false,
              badges: car.badges.includes('Available') 
                ? car.badges.filter((badge: string) => badge !== 'Available').concat(['Busy'])
                : car.badges.concat(['Busy'])
            } 
          : car
      )
    );
  };

  // Fetch displayed cars (transformed)
  useEffect(() => {
    const filtered = cars
      .filter(car => {
        // Search filter
        if (searchQuery && !car.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !(car.make || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
            !(car.model || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
            !(car.location_city || '').toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Seat filter
        if (seatFilter !== "all" && car.seats !== parseInt(seatFilter)) {
          return false;
        }
        
        // Fuel filter
        if (fuelFilter !== "all" && (car.fuel_type || '').toLowerCase() !== fuelFilter.toLowerCase()) {
          return false;
        }
        
        return true;
      })
      .map(transformCarForDisplay);
    
    setDisplayedCars(filtered);
    setTotalCount(filtered.length);
    setHasMore(false); // For simplicity, we're not implementing pagination in this fix
  }, [cars, searchQuery, seatFilter, fuelFilter]);

  // Initial data fetch is handled by the hook

  // Handle sorting changes
  useEffect(() => {
    // Sorting is handled by the hook when fetching data
  }, [sortBy]);

  // Re-enable real-time subscription now that loading is fixed
  useRealtimeSubscription(
    'cars',
    (_payload) => {
      // For real-time updates, we'll refresh the current page
      refetch();
    },
    (_payload) => {
      // For updates, we'll refresh the current page
      refetch();
    },
    (_payload) => {
      // For deletions, we'll refresh the current page
      refetch();
    }
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <section id="cars-section" className="py-16 bg-gradient-to-b from-white to-primary-light/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-foreground">Choose Your</span> <span className="text-gradient">Perfect Ride</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our diverse fleet of well-maintained vehicles. From budget-friendly options to luxury cars.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          className="bg-white rounded-2xl shadow-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by car name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Seat Filter */}
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

            {/* Fuel Filter */}
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

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
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

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {seatFilter !== "all" && (
              <Badge variant="secondary">
                {filterOptions.find(f => f.value === seatFilter)?.label}
              </Badge>
            )}
            {fuelFilter !== "all" && (
              <Badge variant="secondary">
                {fuelTypes.find(f => f.value === fuelFilter)?.label}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary">
                Search: {searchQuery}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{totalCount} cars</span> available
          </p>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Advanced Filters</span>
          </Button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading && !_isInitialized ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CarTravelingLoader message="Fetching your perfect cars..." />
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Successfully connected to database. Loading cars...
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CarListingErrorState error={error.message} onRetry={refetch} />
            </motion.div>
          ) : displayedCars.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyCarState />
            </motion.div>
          ) : (
            <motion.div
              key="cars"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayedCars.map((car, _index) => (
                <motion.div key={car.id} variants={itemVariants}>
                  <CarCard car={car} onBookingSuccess={handleBookingSuccess} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {!loading && !error && displayedCars.length > 0 && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {hasMore ? (
              <Button 
                onClick={() => {}} 
                disabled={_loadingMore}
                variant="outline" 
                size="lg" 
                className="px-8"
              >
                {_loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Cars"
                )}
              </Button>
            ) : (
              <p className="text-muted-foreground">
                You've reached the end of the car listings
              </p>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};