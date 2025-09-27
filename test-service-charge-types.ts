// Test file to verify service_charge type is available
import type { Database } from './src/integrations/supabase/types';

// Test that service_charge is available in the Car type
type TestCar = Database['public']['Tables']['cars']['Row'];

// This will cause a compile error if service_charge is not available
const car: TestCar = {
  id: 'test',
  title: 'Test Car',
  price_per_day: 1000,
  service_charge: 100, // This should compile without error if types are correct
  created_at: null,
  description: null,
  fuel_type: null,
  image_urls: null,
  location_city: null,
  make: null,
  model: null,
  price_per_hour: null,
  price_in_paise: null,
  currency: null,
  seats: null,
  status: null,
  transmission: null,
  year: null,
  booking_status: null,
  booked_by: null,
  booked_at: null
};

console.log('✅ TypeScript types correctly include service_charge column');
console.log('✅ Test car with service_charge created successfully');