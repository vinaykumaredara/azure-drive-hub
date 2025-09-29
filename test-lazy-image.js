// Simple test for LazyImage component
import { resolveCarImageUrl } from './src/utils/carImageUtils.js';

// Test image URLs
const testImages = [
  'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
  null,
  undefined,
  '',
  'cars-photos/car1.jpg'
];

console.log('Testing resolveCarImageUrl function:');

testImages.forEach((image, index) => {
  try {
    const resolved = resolveCarImageUrl(image);
    console.log(`${index + 1}. Input: ${image}`);
    console.log(`   Output: ${resolved}`);
    console.log(`   Type: ${typeof resolved}`);
    console.log('');
  } catch (error) {
    console.log(`${index + 1}. Input: ${image}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
  }
});

console.log('✅ Test completed!');