// Test script for car image URL resolver
import { resolveCarImageUrl } from './src/utils/carImageUtils.ts';

// Test cases
const testCases = [
  null,
  undefined,
  '',
  'https://example.com/image.jpg',
  'cars/test-image.jpg',
  'invalid-path'
];

console.log('Testing resolveCarImageUrl function:');

testCases.forEach((testCase, index) => {
  try {
    const result = resolveCarImageUrl(testCase);
    console.log(`Test ${index + 1}: ${JSON.stringify(testCase)} -> ${result}`);
  } catch (error) {
    console.error(`Test ${index + 1} failed:`, error.message);
  }
});