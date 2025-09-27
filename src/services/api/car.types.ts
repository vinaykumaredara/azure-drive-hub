// src/types/api/car.types.ts

export interface Car {
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
  service_charge?: number | null;
  description?: string | null;
  location_city?: string | null;
  status: string | null;
  image_urls: string[] | null;
  created_at: string | null;
  price_in_paise?: number | null;
  currency?: string | null;
  // Fields for atomic booking
  booking_status?: string | null;
  booked_by?: string | null;
  booked_at?: string | null;
}

export interface CreateCarRequest {
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuel_type: string;
  transmission: string;
  price_per_day: number;
  price_per_hour?: number;
  service_charge?: number;
  description?: string;
  location_city?: string;
  status: string;
  images: File[];
}

export interface UpdateCarRequest {
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  seats?: number;
  fuel_type?: string;
  transmission?: string;
  price_per_day?: number;
  price_per_hour?: number;
  service_charge?: number;
  description?: string;
  location_city?: string;
  status?: string;
  newImages?: File[];
  removeOldImages?: boolean;
}

export interface CarListingResponse {
  data: Car[];
  total: number;
  page: number;
  hasMore: boolean;
}