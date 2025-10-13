import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CarCardModern } from "@/components/CarCardModern";
import { VirtualCarList } from "@/components/VirtualCarList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { EmptyCarState } from "@/components/EmptyCarState";
import { CarTravelingLoader } from "@/components/LoadingAnimations";
import { CarListingErrorState } from "@/components/CarListingErrorState";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtime";
import { toast } from "@/hooks/use-toast";
import { mapCarForUI } from '@/utils/carImageUtils';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { isMobileDevice } from '@/utils/deviceOptimizations';

// Interface for the data we receive from Supabase (allows null values)
interface SupabaseCar {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  seats: number | null;
  fuel_type: string | null;
  transmission: string | null;
  price_per_day: number;
  price_per_hour?: number | null;
  description?: string | null;
  location_city?: string | null;
  status: string | null;
  image_urls: string[] | null;
  image_paths?: string[] | null;
  created_at: string | null;
  price_in_paise?: number | null;
  currency?: string | null;
  // New fields for atomic booking (optional as they may not exist in all environments)
  booking_status?: string | null;
  booked_by?: string | null;
  booked_at?: string | null;
}

// Interface for the transformed car data used in the UI
interface DisplayCar {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  image: string;
  images: string[];
  pricePerDay: number;
  pricePerHour: number;
  location: string;
  fuel: string | null;
  transmission: string | null;
  seats: number | null;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  badges: string[];
  features: string[];
  description: string | null;
  // Booking-specific information
  bookingStatus?: string | null;
  bookedBy?: string | null;
  bookedAt?: string | null;
  // Include original image data for debugging
  image_urls: string[] | null;
  image_paths: string[] | null;
  // Added for CarCard compatibility
  thumbnail?: string;
  // Add status field
  status?: string | null;
}

// Transform Supabase car to display format
const transformCarForDisplay = (car: SupabaseCar): DisplayCar => {
  // Use price_in_paise if available, otherwise fallback to price_per_day
  const pricePerDay = car.price_in_paise ? car.price_in_paise / 100 : car.price_per_day;
  const pricePerHour = car.price_per_hour || pricePerDay / 24;

  // Check if booking_status exists, if not assume car is available
  const bookingStatus = car.booking_status !== undefined ? car.booking_status : null;

  // Map car data for UI using the new utility function
  const mappedCar = mapCarForUI(car);
  const transformed = {
    id: car.id,
    title: car.title,
    make: car.make,
    model: car.model || '',
    // Ensure model is never null for CarCard
    year: car.year,
    image: mappedCar.thumbnail || '',
    // Use mapped thumbnail
    images: mappedCar.images || [],
    // Use mapped images array
    pricePerDay: pricePerDay,
    pricePerHour: pricePerHour,
    location: car.location_city || 'Hyderabad',
    fuel: car.fuel_type,
    transmission: car.transmission,
    seats: car.seats,
    rating: 4.5 + Math.random() * 0.4,
    // Random rating between 4.5-4.9
    reviewCount: Math.floor(Math.random() * 50) + 15,
    // Random reviews 15-65
    isAvailable: car.status === 'published' && bookingStatus !== 'booked',
    badges: car.status === 'published' && bookingStatus !== 'booked' ? ['Available', 'Verified'] : ['Booked'],
    features: ['GPS', 'AC', 'Bluetooth', 'Insurance'],
    description: car.description || `${car.make} ${car.model} - Perfect for city drives and long trips`,
    // Booking-specific information
    bookingStatus: bookingStatus,
    bookedBy: car.booked_by,
    bookedAt: car.booked_at,
    // Include original image data for debugging
    image_urls: car.image_urls,
    image_paths: car.image_paths || null,
    // Ensure it's null and not undefined
    // Added for CarCard compatibility
    thumbnail: mappedCar.thumbnail || '',
    // Add status field
    status: car.status
  };
  return transformed;
};
const filterOptions = [{
  label: "All Seats",
  value: "all"
}, {
  label: "4 Seats",
  value: "4"
}, {
  label: "5 Seats",
  value: "5"
}, {
  label: "7+ Seats",
  value: "7"
}];
const fuelTypes = [{
  label: "All Fuel Types",
  value: "all"
}, {
  label: "Petrol",
  value: "petrol"
}, {
  label: "Diesel",
  value: "diesel"
}, {
  label: "Electric",
  value: "electric"
}];
const sortOptions = [{
  label: "Price: Low to High",
  value: "price-asc"
}, {
  label: "Price: High to Low",
  value: "price-desc"
}, {
  label: "Rating: High to Low",
  value: "rating-desc"
}, {
  label: "Most Popular",
  value: "popular"
}];
export const UserCarListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [seatFilter, setSeatFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [cars, setCars] = useState<DisplayCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [_totalCount, setTotalCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchCars = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Measure query performance
      const queryStartTime = performance.now();

      // Build base query with optimized selection
      const query = supabase.from('cars').select(`
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
          image_paths,
          created_at,
          price_in_paise,
          currency,
          booking_status,
          booked_by,
          booked_at
        `, {
        count: 'planned'
      }) // Use planned count for better performance
      .eq('status', 'published') // Ensure consistent status filtering
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1).order('created_at', {
        ascending: false
      });

      // Execute query
      const {
        data,
        error: fetchError,
        count
      } = await query;
      const queryEndTime = performance.now();
      console.log(`Database query took ${queryEndTime - queryStartTime} milliseconds`);
      if (fetchError && fetchError.message.includes('column "booking_status" does not exist')) {
        // Retry without booking_status column
        console.log('Schema error detected, retrying without booking_status column');
        const retryStartTime = performance.now();
        const {
          data: retryData,
          error: retryError,
          count: retryCount
        } = await supabase.from('cars').select(`
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
            image_paths,
            created_at,
            price_in_paise,
            currency
          `, {
          count: 'planned'
        }).eq('status', 'published').range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1).order('created_at', {
          ascending: false
        });
        const retryEndTime = performance.now();
        console.log(`Retry query took ${retryEndTime - retryStartTime} milliseconds`);
        if (retryError) {
          throw retryError;
        }

        // Transform and set data
        const transformedData = retryData.map(transformCarForDisplay);
        setCars(prev => pageNum === 0 ? transformedData : [...prev, ...transformedData]);
        setTotalCount(retryCount || 0);
        setHasMore((pageNum + 1) * ITEMS_PER_PAGE < (retryCount || 0));
      } else if (fetchError) {
        throw fetchError;
      } else {
        // Transform and set data
        const transformedData = data.map(transformCarForDisplay);
        setCars(prev => pageNum === 0 ? transformedData : [...prev, ...transformedData]);
        setTotalCount(count || 0);
        setHasMore((pageNum + 1) * ITEMS_PER_PAGE < (count || 0));
      }
    } catch (err: any) {
      console.error('Error fetching cars:', err);
      setError(err.message || 'Failed to fetch cars');
      toast({
        title: "Error",
        description: "Failed to load cars. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    // Measure initial load performance
    performanceMonitor.measureFunctionTime('Initial Car Load', () => {
      fetchCars(0);
    });
  }, [fetchCars]);

  // Real-time subscription with performance monitoring
  useRealtimeSubscription<any>('cars', payload => {
    // New car added
    const newCar = transformCarForDisplay(payload.new);
    setCars(prev => [newCar, ...prev]);
  }, payload => {
    // Car updated
    const updatedCar = transformCarForDisplay(payload.new);
    setCars(prev => prev.map(car => car.id === updatedCar.id ? updatedCar : car));
  }, payload => {
    // Car deleted
    setCars(prev => prev.filter(car => car.id !== payload.old.id));
  });
  const loadMore = useCallback(() => {
    if (!hasMore || loading) {
      return;
    }
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCars(nextPage);
  }, [hasMore, loading, page, fetchCars]);

  // Filter and sort cars with memoization
  const processedCars = useMemo(() => {
    return performanceMonitor.measureFunctionTime('Filter and Sort Cars', () => {
      let filtered = [...cars];

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(car => car.title.toLowerCase().includes(searchQuery.toLowerCase()) || car.make?.toLowerCase().includes(searchQuery.toLowerCase()) || car.model?.toLowerCase().includes(searchQuery.toLowerCase()) || car.location.toLowerCase().includes(searchQuery.toLowerCase()));
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
    });
  }, [cars, searchQuery, seatFilter, fuelFilter, sortBy]);

  // Handle booking success by updating the car's availability status
  const handleBookingSuccess = useCallback((carId: string) => {
    console.log("Booking successful for car:", carId);
    // Update the car's status in the local state to reflect it's now booked
    setCars(prevCars => prevCars.map(car => car.id === carId ? {
      ...car,
      isAvailable: false,
      bookingStatus: 'booked',
      badges: car.badges.includes('Available') ? car.badges.filter(badge => badge !== 'Available').concat(['Booked']) : car.badges.concat(['Booked'])
    } : car));

    // Show a success toast
    toast({
      title: "Booking Confirmed!",
      description: "Your car has been successfully booked."
    });
  }, []);

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadMore();
      }
    }, {
      threshold: 1.0
    });
    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadMore]);
  if (!isInitialized) {
    return <CarTravelingLoader />;
  }
  if (error) {
    return <CarListingErrorState error={error} onRetry={() => fetchCars(0)} />;
  }
  return <div id="cars-section" className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search cars..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            
            <Select value={seatFilter} onValueChange={setSeatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Seats" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            
            <Select value={fuelFilter} onValueChange={setFuelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{processedCars.length} cars</span> available
          </p>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Advanced Filters</span>
          </Button>
        </div>

        {/* Car Grid or Virtual List */}
        {processedCars.length === 0 ? <EmptyCarState /> : isMobileDevice() ?
      // Use virtual scrolling on mobile for better performance
      <VirtualCarList cars={processedCars} itemHeight={300} /> :
      // Use regular grid on desktop
      <>
            <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {processedCars.map((car, index) => <motion.div key={car.id} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -20
            }} transition={{
              duration: 0.3,
              delay: index * 0.05
            }}>
                    <CarCardModern car={{
                id: car.id,
                title: car.title,
                model: car.model || 'Unknown Model',
                make: car.make || undefined,
                year: car.year || undefined,
                image: car.image,
                images: car.images,
                pricePerDay: car.pricePerDay,
                location: car.location,
                fuel: car.fuel || 'Unknown',
                transmission: car.transmission || 'Unknown',
                seats: car.seats || 0,
                rating: car.rating,
                reviewCount: car.reviewCount,
                isAvailable: car.isAvailable,
                badges: car.badges,
                thumbnail: car.thumbnail,
                bookingStatus: car.bookingStatus || undefined,
                price_in_paise: car.pricePerDay * 100,
                image_urls: car.image_urls,
                image_paths: car.image_paths
              }} onBookingSuccess={handleBookingSuccess} // Pass the callback
              />
                  </motion.div>)}
              </AnimatePresence>
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="h-10" />

            {/* Load More Button (fallback for non-intersection observer) */}
            {hasMore && <div className="text-center mt-12">
                <Button onClick={loadMore} disabled={loading} variant="outline" className="bg-background hover:bg-accent">
                  {loading ? <>
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
                      Loading...
                    </> : <>
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Load More
                    </>}
                </Button>
              </div>}
          </>}
      </div>
    </div>;
};