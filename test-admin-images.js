// Test script to verify admin image handling
import { resolveImageUrlsForCarAdmin } from './src/utils/adminImageUtils';

// Test data
const testCars = [
  {
    id: 'test-1',
    title: 'Test Car 1',
    image_urls: [
      'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/1758703859809-Screenshot%202025-09-16%20162919.png',
      'https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/1758703868228-Screenshot%202025-09-16%20162904.png'
    ]
  },
  {
    id: 'test-2',
    title: 'Test Car 2',
    image_urls: [
      'invalid-url',
      'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
    ]
  },
  {
    id: 'test-3',
    title: 'Test Car 3',
    image_urls: []
  }
];

async function testImageResolution() {
  console.log('Testing image URL resolution for admin...');
  
  for (const car of testCars) {
    console.log(`\nTesting car: ${car.title}`);
    const resolvedCar = await resolveImageUrlsForCarAdmin(car);
    console.log('Resolved image URLs:', resolvedCar.image_urls);
  }
  
  console.log('\nTest completed!');
}

testImageResolution();