// scripts/test-image-resolution.js
// Script to test image resolution functionality

import { resolveCarImageUrl } from '../src/utils/carImageUtils.ts';

// Test cases
const testCases = [
  // Valid HTTP URL
  'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800',
  
  // Valid HTTPS URL
  'https://example.com/image.jpg',
  
  // Storage path
  'cars/12345/test.jpg',
  
  // Null value
  null,
  
  // Empty string
  '',
  
  // Undefined
  undefined,
  
  // Invalid URL
  'not-a-url',
];

console.log('Testing image URL resolution...');
console.log('================================');

testCases.forEach((testCase, index) => {
  try {
    const result = resolveCarImageUrl(testCase);
    console.log(`Test ${index + 1}:`);
    console.log(`  Input:  ${testCase}`);
    console.log(`  Output: ${result}`);
    console.log();
  } catch (error) {
    console.error(`Test ${index + 1} failed with error:`, error);
  }
});

console.log('Test completed.');