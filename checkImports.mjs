// Simple script to check if imports work
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__dirname, '.');

console.log('Current directory:', __dirname);

try {
  // Try importing with relative path
  const carCard = await import('./src/components/CarCard.tsx');
  console.log('✓ CarCard imported successfully with relative path');
  console.log('CarCard component:', typeof carCard.CarCard);
} catch (error) {
  console.error('✗ Failed to import CarCard with relative path:', error.message);
}

try {
  // Try importing with alias path
  const carCard = await import('@/components/CarCard');
  console.log('✓ CarCard imported successfully with alias path');
  console.log('CarCard component:', typeof carCard.CarCard);
} catch (error) {
  console.error('✗ Failed to import CarCard with alias path:', error.message);
}