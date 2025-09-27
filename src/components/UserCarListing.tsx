import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal, Clock, CheckCircle } from "lucide-react";
import { CarListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ErrorBoundary";
import { EmptyCarState } from "@/components/EmptyCarState";
import { CarTravelingLoader } from "@/components/LoadingAnimations";
import { CarListingErrorState } from "@/components/CarListingErrorState";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtime";
import { toast } from "@/hooks/use-toast";
import { formatINRFromPaise } from '@/utils/currency';
import { getPublicImageUrl } from '@/utils/imageUtils';

// Car interface for Supabase data with booking information
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
  price_in_paise?: number;
  currency?: string;
  // New fields for atomic booking (optional as they may not exist in all environments)
  booking_status?: string;
  booked_by?: string;
  booked_at?: string;
}

// Transform Supabase car to display format
const transformCarForDisplay = (car: any): any => {
  // Use price_in_paise if available, otherwise fallback to price_per_day
  const pricePerDay = car.price_in_paise ? car.price_in_paise / 100 : car.price_per_day;
  const pricePerHour = car.price_per_hour || (pricePerDay / 24);
  
  // Check if booking_status exists, if not assume car is available
  const bookingStatus = car.booking_status !== undefined ? car.booking_status : 'available';
  
  // Process images to ensure they have valid URLs
  let processedImages = [];
  let primaryImage = `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=300&fit=crop&crop=center&auto=format&q=80`;
  
  if (car.image_urls?.length > 0) {
    // For each image URL, if it's not a full URL, try to get a public URL
    processedImages = car.image_urls.map((url: string) => {
      // If it's already a full URL, use it as is
      if (url.startsWith('http')) {
        return url;
      }
      // Otherwise, treat it as a file path and get a public URL
      return getPublicImageUrl(url);
    });
    
    primaryImage = processedImages[0];
  } else {
    processedImages = [
      `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80`
    ];
  }
  
  const transformed = {
    id: car.id,
    title: car.title,
    make: car.make,
    model: car.model,
    year: car.year,
    image: primaryImage,
    images: processedImages,
    pricePerDay: pricePerDay,
    pricePerHour: pricePerHour,
    location: car.location_city || 'Hyderabad',
    fuel: car.fuel_type,
    transmission: car.transmission,
    seats: car.seats,
    rating: 4.5 + (Math.random() * 0.4), // Random rating between 4.5-4.9
    reviewCount: Math.floor(Math.random() * 50) + 15, // Random reviews 15-65
    isAvailable: car.status === 'published' && bookingStatus !== 'booked',
    badges: car.status === 'published' && bookingStatus !== 'booked' ? ['Available', 'Verified'] : ['Booked'],
    features: ['GPS', 'AC', 'Bluetooth', 'Insurance'],
    description: car.description || `${car.make} ${car.model} - Perfect for city drives and long trips`,
    // Booking-specific information
    bookingStatus: bookingStatus,
    bookedBy: car.booked_by,
    bookedAt: car.booked_at
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

export const UserCarListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seatFilter, setSeatFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const ITEMS_PER_PAGE = 12;

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchCars = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build base query
      const query = supabase
        .from('cars')
        .select(`
          id,
          title,
          make,
          model,
          year,
          seats,
          fuel_type,
          transmission,
          price_per_day,
          price_per_hour,
          description,
          location_city,
          status,
          image_urls,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `, { count: 'planned' }) // Use planned count for better performance
        .eq('status', 'published')
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      // Execute query
      const { data, error: fetchError, count } = await query;

      if (fetchError && fetchError.message.includes('column "booking_status" does not exist')) {
        // Retry without booking_status column
        console.log('Schema error detected, retrying without booking_status column');
        const { data: retryData, error: retryError, count: retryCount } = await supabase
          .from('cars')
          .select(`
            id,
            title,
            make,
            model,
            year,
            seats,
            fuel_type,
            transmission,
            price_per_day,
            price_per_hour,
            description,
            location_city,
            status,
            image_urls,
            created_at,
            price_in_paise,
            currency
          `, { count: 'planned' }) // Use planned count for better performance
          .eq('status', 'published')
          .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)
          .order('created_at', { ascending: false });

        if (retryError) {throw retryError;}
        
        setCars(prev => pageNum === 0 ? retryData || [] : [...prev, ...(retryData || [])]);
        setTotalCount(retryCount || 0);
        setHasMore(!!retryData && retryData.length === ITEMS_PER_PAGE);
      } else if (fetchError) {
        throw fetchError;
      } else {
        setCars(prev => pageNum === 0 ? data || [] : [...prev, ...(data || [])]);
        setTotalCount(count || 0);
        setHasMore(!!data && data.length === ITEMS_PER_PAGE);
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load cars. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCars(0);
  }, [fetchCars]);

  // Load more cars
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCars(nextPage);
  }, [page, fetchCars]);

  // Re-enable real-time subscription now that loading is fixed
  useRealtimeSubscription(
    'cars',
    (payload) => {
      // Only add published cars
      if (payload.new.status === 'published') {
        setCars(prev => [payload.new, ...prev]);
      }
    },
    (payload) => {
      // Only update published cars
      if (payload.new.status === 'published') {
        setCars(prev => prev.map(car => 
          car.id === payload.new.id ? payload.new : car
        ));
      }
    },
    (payload) => {
      setCars(prev => prev.filter(car => car.id !== payload.old.id));
    }
  );

  // Filter and transform cars using useMemo for performance
  const filteredCars = useMemo(() => {
    return cars
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
  }, [cars, searchQuery, seatFilter, fuelFilter, sortBy]);

  const totalCountFiltered = filteredCars.length;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
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
            <span className="text-foreground">Browse Our</span> <span className="text-gradient">Fleet</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect car for your next adventure. All cars are well-maintained and ready for you.
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
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading && !isInitialized ? (
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
              <CarListingErrorState error={error || 'Failed to load cars'} onRetry={() => fetchCars(0)} />
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
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredCars.length} of {totalCount} cars
              </div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredCars.map((car) => (
                  <motion.div key={car.id} variants={itemVariants}>
                    <CarCard car={car} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    className="bg-white hover:bg-primary hover:text-white border-primary"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Load More Cars
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default UserCarListing;
