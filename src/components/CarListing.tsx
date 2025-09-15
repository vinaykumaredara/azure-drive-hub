import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { CarListSkeleton } from "@/components/ui/skeleton";
import { ApiErrorState, EmptyState } from "@/components/ErrorBoundary";
import { EmptyCarState } from "@/components/EmptyCarState";
import { CarTravelingLoader } from "@/components/LoadingAnimations";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtime";
import { toast } from "@/hooks/use-toast";

// Car interface for Supabase data
interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuel_type: string;
  transmission: string;
  price_per_day: number;
  price_per_hour?: number;
  description?: string;
  location_city?: string;
  status: string;
  image_urls: string[];
  created_at: string;
}

// Transform Supabase car to display format
const transformCarForDisplay = (car: Car) => ({
  id: car.id,
  title: car.title,
  make: car.make,
  model: car.model,
  year: car.year,
  image: car.image_urls?.[0] || `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=300&fit=crop&crop=center&auto=format&q=80`,
  images: car.image_urls?.length > 0 ? car.image_urls : [
    `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
    `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80`
  ],
  pricePerDay: car.price_per_day,
  pricePerHour: car.price_per_hour || Math.round(car.price_per_day / 8),
  location: car.location_city || 'Hyderabad',
  fuel: car.fuel_type,
  transmission: car.transmission,
  seats: car.seats,
  rating: 4.5 + (Math.random() * 0.4), // Random rating between 4.5-4.9
  reviewCount: Math.floor(Math.random() * 50) + 15, // Random reviews 15-65
  isAvailable: car.status === 'active',
  badges: car.status === 'active' ? ['Available', 'Verified'] : ['Busy'],
  features: ['GPS', 'AC', 'Bluetooth', 'Insurance'],
  description: car.description || `${car.make} ${car.model} - Perfect for city drives and long trips`
});

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
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cars from Supabase
  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('cars')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) {throw fetchError;}
      setCars(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load cars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCars();
  }, []);

  // Real-time subscription for cars
  useRealtimeSubscription(
    'cars',
    (payload) => {
      setCars(prev => [...prev, payload.new]);
    },
    (payload) => {
      setCars(prev => prev.map(car => 
        car.id === payload.new.id ? payload.new : car
      ));
    },
    (payload) => {
      setCars(prev => prev.filter(car => car.id !== payload.old.id));
    }
  );

  // Filter and transform cars
  const filteredCars = cars
    .filter(car => {
      // Search filter
      if (searchQuery && !car.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !car.make.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !car.model.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(car.location_city || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Seat filter
      if (seatFilter !== "all" && car.seats !== parseInt(seatFilter)) {
        return false;
      }
      
      // Fuel filter
      if (fuelFilter !== "all" && car.fuel_type.toLowerCase() !== fuelFilter.toLowerCase()) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price_per_day - b.price_per_day;
        case 'price-desc':
          return b.price_per_day - a.price_per_day;
        case 'rating-desc':
        case 'popular':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    })
    .map(transformCarForDisplay);

  const totalCount = filteredCars.length;

  // Use the custom hook with filters
  // const { cars, loading, error, totalCount, refetch, clearError } = useCars({
  //   q: searchQuery,
  //   seats: seatFilter !== "all" ? parseInt(seatFilter) : undefined,
  //   fuelType: fuelFilter,
  //   sortBy,
  //   from: new Date().toISOString().split('T')[0], // Today
  //   to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  // });

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
        duration: 0.4,
        ease: "easeOut" as const
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
              <Badge variant="secondary" className="bg-primary-light text-primary">
                {filterOptions.find(f => f.value === seatFilter)?.label}
              </Badge>
            )}
            {fuelFilter !== "all" && (
              <Badge variant="secondary" className="bg-primary-light text-primary">
                {fuelTypes.find(f => f.value === fuelFilter)?.label}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="bg-primary-light text-primary">
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
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CarTravelingLoader message="Fetching your perfect cars..." />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ApiErrorState error={error} onRetry={fetchCars} />
            </motion.div>
          ) : filteredCars.length === 0 ? (
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
              {filteredCars.map((car, index) => (
                <motion.div key={car.id} variants={itemVariants}>
                  <CarCard car={car} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {!loading && !error && filteredCars.length > 0 && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Button variant="outline" size="lg" className="px-8">
              Load More Cars
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};