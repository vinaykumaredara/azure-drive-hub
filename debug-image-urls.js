// Debug script to test image URL resolution
import { config } from 'dotenv';
import { resolveCarImageUrl } from './src/utils/carImageUtils.js';

// Load environment variables
config();

console.log('Testing image URL resolution...');

// Test cases
const testCases = [
  null,
  undefined,
  '',
  'test.jpg',
  'cars/test/test.jpg',
  'https://example.com/test.jpg',
  'path/to/image.png'
];

testCases.forEach((testCase, index) => {
  const result = resolveCarImageUrl(testCase);
  console.log(`Test ${index + 1}: ${JSON.stringify(testCase)} => ${result}`);
});

console.log('\nTest completed.');