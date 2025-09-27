// Simple verification script to check if our fixes are in place

const fs = require('fs');
const path = require('path');

// List of files we modified
const filesToCheck = [
  'src/utils/imageUtils.ts',
  'src/hooks/useCars.ts',
  'src/components/LazyImage.tsx',
  'src/components/CarCard.tsx',
  'src/components/CarImageGallery.tsx',
  'src/components/AdminCarManagement.tsx',
  'src/components/BookingModal.tsx',
  'src/components/AtomicBookingFlow.tsx',
  'src/components/modal.css'
];

// Function to check if a file contains specific content
function fileContainsContent(filePath, content) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return fileContent.includes(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return false;
  }
}

// Check each file for our changes
console.log('Verifying fixes...\n');

let allChecksPassed = true;

// Check for getPublicOrSignedUrl function
const imageUtilsPath = path.join(__dirname, 'src/utils/imageUtils.ts');
if (fileContainsContent(imageUtilsPath, 'getPublicOrSignedUrl')) {
  console.log('✓ getPublicOrSignedUrl function added to imageUtils.ts');
} else {
  console.log('✗ getPublicOrSignedUrl function missing from imageUtils.ts');
  allChecksPassed = false;
}

// Check for LazyImage component
const lazyImagePath = path.join(__dirname, 'src/components/LazyImage.tsx');
if (fs.existsSync(lazyImagePath)) {
  console.log('✓ LazyImage component created');
} else {
  console.log('✗ LazyImage component missing');
  allChecksPassed = false;
}

// Check for modal.css
const modalCssPath = path.join(__dirname, 'src/components/modal.css');
if (fs.existsSync(modalCssPath)) {
  console.log('✓ modal.css file created');
} else {
  console.log('✗ modal.css file missing');
  allChecksPassed = false;
}

// Check for add-ons reset logic
const atomicBookingPath = path.join(__dirname, 'src/components/AtomicBookingFlow.tsx');
if (fileContainsContent(atomicBookingPath, 'extras: {') && 
    fileContainsContent(atomicBookingPath, 'driver: false')) {
  console.log('✓ Add-ons reset logic added to AtomicBookingFlow.tsx');
} else {
  console.log('✗ Add-ons reset logic missing from AtomicBookingFlow.tsx');
  allChecksPassed = false;
}

// Check for LazyImage imports and usage
const componentsToCheck = [
  { file: 'src/components/CarCard.tsx', import: 'LazyImage' },
  { file: 'src/components/CarImageGallery.tsx', import: 'LazyImage' },
  { file: 'src/components/AdminCarManagement.tsx', import: 'LazyImage' },
  { file: 'src/components/BookingModal.tsx', import: 'LazyImage' }
];

componentsToCheck.forEach(component => {
  const componentPath = path.join(__dirname, component.file);
  if (fileContainsContent(componentPath, component.import)) {
    console.log(`✓ ${component.import} imported in ${component.file}`);
  } else {
    console.log(`✗ ${component.import} import missing from ${component.file}`);
    allChecksPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('🎉 All fixes have been successfully implemented!');
  console.log('\nYou can now test the application to verify that:');
  console.log('1. Admin-uploaded images show correctly in the user dashboard');
  console.log('2. Site performance is improved with lazy loading');
  console.log('3. Booking modal scrolling works and Continue button is visible');
  console.log('4. Add-ons are reset after booking');
} else {
  console.log('❌ Some fixes are missing. Please review the output above.');
}
console.log('='.repeat(50));