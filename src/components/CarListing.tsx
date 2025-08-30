import { useState } from "react";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

// Mock car data
const mockCars = [
  {
    id: "1",
    name: "Honda City",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&q=80",
    rating: 4.8,
    reviewCount: 124,
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    pricePerDay: 1200,
    location: "Banjara Hills",
    isAvailable: true,
    badges: ["Popular", "Fuel Efficient"]
  },
  {
    id: "2",
    name: "Hyundai Creta",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
    rating: 4.9,
    reviewCount: 89,
    seats: 5,
    fuel: "Diesel",
    transmission: "Automatic",
    pricePerDay: 2200,
    location: "HITEC City",
    isAvailable: true,
    badges: ["Premium", "SUV"]
  },
  {
    id: "3",
    name: "Maruti Swift",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80",
    rating: 4.6,
    reviewCount: 156,
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    pricePerDay: 999,
    location: "Secunderabad",
    isAvailable: true,
    badges: ["Budget Friendly"]
  },
  {
    id: "4",
    name: "Toyota Innova",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
    rating: 4.7,
    reviewCount: 78,
    seats: 7,
    fuel: "Diesel",
    transmission: "Manual",
    pricePerDay: 2800,
    location: "Gachibowli",
    isAvailable: false,
    badges: ["Family Car", "Spacious"]
  },
  {
    id: "5",
    name: "Honda Amaze",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80",
    rating: 4.5,
    reviewCount: 92,
    seats: 5,
    fuel: "Petrol",
    transmission: "Automatic",
    pricePerDay: 1500,
    location: "Kukatpally",
    isAvailable: true,
    badges: ["Comfortable"]
  },
  {
    id: "6",
    name: "Mahindra XUV500",
    image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80",
    rating: 4.8,
    reviewCount: 65,
    seats: 7,
    fuel: "Diesel",
    transmission: "Manual",
    pricePerDay: 3200,
    location: "Madhapur",
    isAvailable: true,
    badges: ["Luxury", "Off-road"]
  }
];

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

  return (
    <section className="py-16 bg-gradient-to-b from-white to-primary-light/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-foreground">Choose Your</span> <span className="text-gradient">Perfect Ride</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our diverse fleet of well-maintained vehicles. From budget-friendly options to luxury cars.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
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
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{mockCars.length} cars</span> available
          </p>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Advanced Filters</span>
          </Button>
        </div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockCars.map((car, index) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="px-8">
            Load More Cars
          </Button>
        </div>
      </div>
    </section>
  );
};