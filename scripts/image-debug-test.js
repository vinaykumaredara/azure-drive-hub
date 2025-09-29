// Test script to debug image data flow

// Sample car data from our diagnostic
const sampleCar = {
  "id": "d2268cdf-45fc-4c18-a5b0-a2b3b9f2fa4e",
  "title": "rr",
  "make": "green",
  "model": "Pack One 59kWh",
  "year": 2025,
  "seats": 5,
  "fuel_type": "petrol",
  "transmission": "automatic",
  "description": "",
  "price_per_day": 2,
  "price_per_hour": 0,
  "location_city": "",
  "status": "published",
  "image_urls": [
    "https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/d2268cdf-45fc-4c18-a5b0-a2b3b9f2fa4e/1759057219967_268f51c0-7760-4d4c-9f2c-ec43b6a72a50.webp",
    "https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/cars/d2268cdf-45fc-4c18-a5b0-a2b3b9f2fa4e/1759058022224_b3801e5b-bc9d-4bc8-bb28-ca5c45da3b81.webp"
  ],
  "created_at": "2025-09-28T04:29:32.895352+00:00",
  "currency": "INR",
  "booking_status": "available",
  "booked_by": null,
  "booked_at": null,
  "price_in_paise": 200,
  "service_charge": 0,
  "image_paths": [
    "cars/d2268cdf-45fc-4c18-a5b0-a2b3b9f2fa4e/1759057219967_268f51c0-7760-4d4c-9f2c-ec43b6a72a50.webp",
    "cars/d2268cdf-45fc-4c18-a5b0-a2b3b9f2fa4e/1759058022224_b3801e5b-bc9d-4bc8-bb28-ca5c45da3b81.webp"
  ]
};

console.log('=== Testing Image Data Flow ===');
console.log('Original car data:');
console.log('image_urls:', sampleCar.image_urls);
console.log('image_paths:', sampleCar.image_paths);

// Test URL resolution manually
console.log('\n=== Testing URL Resolution ===');
if (sampleCar.image_urls && sampleCar.image_urls.length > 0) {
  const firstUrl = sampleCar.image_urls[0];
  console.log('First image URL:', firstUrl);
  
  // Check if it's already a full HTTP URL
  if (firstUrl.startsWith('http://') || firstUrl.startsWith('https://')) {
    console.log('URL is already a full HTTP URL, using as-is');
  } else {
    console.log('URL needs to be resolved from storage path');
  }
}

// Test what the standardized data would look like
console.log('\n=== Simulating standardizeCarImageData ===');
const image_paths = (Array.isArray(sampleCar.image_paths) && sampleCar.image_paths.length > 0) 
  ? sampleCar.image_paths 
  : [];
  
const image_urls = (Array.isArray(sampleCar.image_urls) && sampleCar.image_urls.length > 0) 
  ? sampleCar.image_urls 
  : (image_paths.length > 0 ? image_paths.map(path => {
      // Simulate resolveCarImageUrl for storage paths
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      // For storage paths, construct the public URL
      return `https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/${path}`;
    }) : []);

const images = (Array.isArray(image_urls) && image_urls.length > 0) 
  ? image_urls 
  : ['https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80'];

const thumbnail = (typeof images[0] === 'string' && images[0].length > 0) 
  ? images[0] 
  : 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

console.log('Processed data:');
console.log('thumbnail:', thumbnail);
console.log('images:', images);
console.log('image_urls:', image_urls);
console.log('image_paths:', image_paths);