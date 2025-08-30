import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useCars } from "@/hooks/use-cars";
import { CarListSkeleton } from "@/components/ui/skeleton";
import { ApiErrorState, EmptyState } from "@/components/ErrorBoundary";

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

  // Use the custom hook with filters
  const { cars, loading, error, totalCount, refetch, clearError } = useCars({
    q: searchQuery,
    seats: seatFilter !== "all" ? parseInt(seatFilter) : undefined,
    fuelType: fuelFilter,
    sortBy,
    from: new Date().toISOString().split('T')[0], // Today
    to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  });

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
              <CarListSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ApiErrorState error={error} onRetry={refetch} />
            </motion.div>
          ) : cars.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState
                title="No cars found"
                description="Try adjusting your filters or search terms to find more cars."
                action={
                  <Button onClick={() => {
                    setSearchQuery("");
                    setSeatFilter("all");
                    setFuelFilter("all");
                    setSortBy("popular");
                  }}>
                    Clear Filters
                  </Button>
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="cars"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {cars.map((car, index) => (
                <motion.div key={car.id} variants={itemVariants}>
                  <CarCard car={{ ...car, name: car.model }} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {!loading && !error && cars.length > 0 && (
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