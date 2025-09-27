// Simple test for car image URL resolver logic
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80';

function resolveCarImageUrl(imagePath) {
  // Handle null/undefined/empty cases
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return FALLBACK_IMAGE;
  }

  // If it's already a full HTTP URL, return it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Otherwise, treat it as a storage path and generate a public URL
  try {
    // Simulate Supabase storage resolution
    const publicUrl = `https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/${imagePath}`;
    return publicUrl;
  } catch (error) {
    console.error('Error resolving car image URL:', error, imagePath);
    return FALLBACK_IMAGE;
  }
}

// Test cases
const testCases = [
  null,
  undefined,
  '',
  'https://example.com/image.jpg',
  'cars/test-image.jpg'
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

// Test with actual URLs from database
const realUrls = [
  "https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/1758703859809-Screenshot%202025-09-16%20162919.png",
  "https://rcpkhtlvfvafympulywx.supabase.co/storage/v1/object/public/cars-photos/1758703868228-Screenshot%202025-09-16%20162904.png"
];

console.log('\nTesting with real URLs:');

realUrls.forEach((url, index) => {
  const result = resolveCarImageUrl(url);
  console.log(`Real URL Test ${index + 1}: ${result === url ? 'PASSED' : 'FAILED'}`);
});