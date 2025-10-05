// API service layer for RP CARS
// This implements the API contract specified in the requirements

export interface Car {
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
  badges: string[];
  images: string[];
  description?: string;
  specs?: Record<string, string>;
  availabilitySummary?: string;
}

export interface CarListResponse {
  items: Car[];
  page: number;
  total: number;
}

export interface BookingHold {
  holdId: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface BookingConfirmation {
  bookingId: string;
  status: string;
}

// Mock API implementation - replace with real API calls
const MOCK_CARS: Car[] = [
  {
    id: "1",
    model: "Honda City",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&q=80",
    rating: 4.8,
    reviewCount: 124,
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    pricePerDay: 1200,
    location: "Banjara Hills",
    isAvailable: true,
    badges: ["Popular", "Fuel Efficient"],
    images: [
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80&crop=entropy&cs=tinysrgb&fit=crop&h=400"
    ],
    description: "Comfortable and fuel-efficient city car perfect for daily commutes.",
    specs: {
      "Engine": "1.5L Petrol",
      "Mileage": "17 km/l",
      "Insurance": "Valid till Dec 2024"
    },
    availabilitySummary: "Available for next 7 days"
  },
  {
    id: "2",
    model: "Hyundai Creta",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
    rating: 4.9,
    reviewCount: 89,
    seats: 5,
    fuel: "Diesel",
    transmission: "Automatic",
    pricePerDay: 2200,
    location: "HITEC City",
    isAvailable: true,
    badges: ["Premium", "SUV"],
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&crop=entropy&cs=tinysrgb&fit=crop&h=400"
    ],
    description: "Premium SUV with advanced features and comfortable ride.",
    specs: {
      "Engine": "1.6L Diesel",
      "Mileage": "16 km/l",
      "Insurance": "Valid till Jan 2025"
    }
  },
  {
    id: "3",
    model: "Maruti Swift",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80",
    rating: 4.6,
    reviewCount: 156,
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    pricePerDay: 999,
    location: "Secunderabad",
    isAvailable: true,
    badges: ["Budget Friendly"],
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&crop=entropy&cs=tinysrgb&fit=crop&h=400"
    ],
    description: "Affordable and reliable hatchback for city drives.",
    specs: {
      "Engine": "1.2L Petrol",
      "Mileage": "22 km/l",
      "Insurance": "Valid till Mar 2025"
    }
  },
  {
    id: "4",
    model: "Toyota Innova",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
    rating: 4.7,
    reviewCount: 78,
    seats: 7,
    fuel: "Diesel",
    transmission: "Manual",
    pricePerDay: 2800,
    location: "Gachibowli",
    isAvailable: false,
    badges: ["Family Car", "Spacious"],
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80&crop=entropy&cs=tinysrgb&fit=crop&h=400"
    ],
    description: "Spacious MPV perfect for family trips and group travel.",
    specs: {
      "Engine": "2.4L Diesel",
      "Mileage": "14 km/l",
      "Insurance": "Valid till Nov 2024"
    }
  },
  {
    id: "5",
    model: "Honda Amaze",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80",
    rating: 4.5,
    reviewCount: 92,
    seats: 5,
    fuel: "Petrol",
    transmission: "Automatic",
    pricePerDay: 1500,
    location: "Kukatpally",
    isAvailable: true,
    badges: ["Comfortable"],
    images: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80&crop=entropy&cs=tinysrgb&fit=crop&h=400"
    ],
    description: "Comfortable sedan with automatic transmission.",
    specs: {
      "Engine": "1.2L Petrol",
      "Mileage": "18 km/l",
      "Insurance": "Valid till Feb 2025"
    }
  },
  {
    id: "6",
    model: "Mahindra XUV500",
    image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80",
    rating: 4.8,
    reviewCount: 65,
    seats: 7,
    fuel: "Diesel",
    transmission: "Manual",
    pricePerDay: 3200,
    location: "Madhapur",
    isAvailable: true,
    badges: ["Luxury", "Off-road"],
    images: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80&crop=entropy&cs=tinysrgb&fit=crop&h=400"
    ],
    description: "Luxury SUV with off-road capabilities and premium features.",
    specs: {
      "Engine": "2.2L Diesel",
      "Mileage": "12 km/l",  
      "Insurance": "Valid till Apr 2025"
    }
  }
];

class ApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// API service functions
export const carApi = {
  async getCars(params?: {
    from?: string;
    to?: string;
    seats?: number;
    page?: number;
    q?: string;
  }): Promise<CarListResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new ApiError('Failed to fetch cars. Please try again.', 'FETCH_ERROR');
    }

    let filteredCars = [...MOCK_CARS];

    // Apply filters
    if (params?.seats) {
      filteredCars = filteredCars.filter(car => car.seats >= params.seats!);
    }

    if (params?.q) {
      const query = params.q.toLowerCase();
      filteredCars = filteredCars.filter(car =>
        car.model.toLowerCase().includes(query) ||
        car.location.toLowerCase().includes(query)
      );
    }

    // Sort by availability first, then by rating
    filteredCars.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return b.rating - a.rating;
    });

    return {
      items: filteredCars,
      page: params?.page || 1,
      total: filteredCars.length
    };
  },

  async getCarById(carId: string): Promise<Car> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const car = MOCK_CARS.find(c => c.id === carId);
    if (!car) {
      throw new ApiError('Car not found', 'NOT_FOUND');
    }
    
    return car;
  },

  async createBookingHold(_params: {
    userId: string;
    carId: string;
    startDatetime: string;
    endDatetime: string;
    extras?: Record<string, any>;
  }): Promise<BookingHold> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate hold creation with 10-minute TTL
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    return {
      holdId: `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt,
      ttlSeconds: 600
    };
  },

  async confirmBooking(_params: {
    holdId: string;
    paymentProvider: string;
    providerOrderId: string;
  }): Promise<BookingConfirmation> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      bookingId: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'confirmed'
    };
  }
};

// Cache utility for client-side caching
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, data: any, ttlSeconds: number = 30) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) {return null;}
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache();