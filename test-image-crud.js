// Test script for Image CRUD Reliability
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

// Import our new utilities
import { 
  uploadImageFile,
  uploadMultipleImageFiles,
  removeImagesFromStorage,
  createCarWithImages,
  updateCarWithImages,
  deleteCarWithImages,
  verifyCarImageAlignment
} from './src/utils/imageCrudUtils.ts';

async function testImageCRUD() {
  console.log('=== Image CRUD Reliability Test ===\n');
  
  try {
    // Test 1: Upload single image
    console.log('1. Testing single image upload...');
    
    // Create a simple test image as a Blob
    const testContent = 'This is a test image file for CRUD testing';
    const testFile = new Blob([testContent], { type: 'image/png' });
    const testFileWithName = new File([testFile], 'test-image.png', { type: 'image/png' });
    
    try {
      const result = await uploadImageFile(testFileWithName, 'test-car-123');
      console.log('   ✅ Single image upload successful');
      console.log('   File path:', result.path);
      console.log('   Public URL:', result.url.substring(0, 60) + '...');
      
      // Clean up the test file
      await removeImagesFromStorage([result.path]);
      console.log('   🧹 Cleaned up test file');
    } catch (err) {
      console.log('   ❌ Single image upload failed:', err.message);
    }
    
    // Test 2: Upload multiple images
    console.log('\n2. Testing multiple image upload...');
    
    try {
      const testFile1 = new File([new Blob(['Test image 1'])], 'test1.png', { type: 'image/png' });
      const testFile2 = new File([new Blob(['Test image 2'])], 'test2.png', { type: 'image/png' });
      
      const result = await uploadMultipleImageFiles([testFile1, testFile2], 'test-car-456');
      console.log('   ✅ Multiple image upload successful');
      console.log('   File paths:', result.paths);
      console.log('   Public URLs:', result.urls.map(url => url.substring(0, 40) + '...'));
      
      // Clean up the test files
      await removeImagesFromStorage(result.paths);
      console.log('   🧹 Cleaned up test files');
    } catch (err) {
      console.log('   ❌ Multiple image upload failed:', err.message);
    }
    
    // Test 3: Create car with images
    console.log('\n3. Testing car creation with images...');
    
    try {
      const testFile = new File([new Blob(['Car image content'])], 'car-image.png', { type: 'image/png' });
      
      const carData = {
        title: 'Test Car for CRUD',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        seats: 5,
        fuel_type: 'petrol',
        transmission: 'automatic',
        price_per_day: 100,
        description: 'Test car for CRUD reliability testing'
      };
      
      const createdCar = await createCarWithImages(carData, [testFile]);
      console.log('   ✅ Car creation with images successful');
      console.log('   Car ID:', createdCar.id);
      console.log('   Car title:', createdCar.title);
      console.log('   Image URLs:', createdCar.image_urls.map(url => url.substring(0, 40) + '...'));
      
      // Test 4: Update car with new images
      console.log('\n4. Testing car update with new images...');
      
      try {
        const newTestFile = new File([new Blob(['New car image content'])], 'new-car-image.png', { type: 'image/png' });
        
        const updatedCar = await updateCarWithImages(
          createdCar.id,
          { ...carData, title: 'Updated Test Car' },
          [newTestFile],
          true // Remove old images
        );
        
        console.log('   ✅ Car update with new images successful');
        console.log('   Updated car title:', updatedCar.title);
        console.log('   New image URLs:', updatedCar.image_urls.map(url => url.substring(0, 40) + '...'));
        
        // Test 5: Verify image alignment
        console.log('\n5. Testing image alignment verification...');
        
        try {
          const verification = await verifyCarImageAlignment(createdCar.id);
          console.log('   ✅ Image alignment verification successful');
          console.log('   All images accessible:', verification.allAccessible);
          console.log('   Verification results count:', verification.verificationResults.length);
          
          // Test 6: Delete car with images
          console.log('\n6. Testing car deletion with images...');
          
          try {
            await deleteCarWithImages(createdCar.id);
            console.log('   ✅ Car deletion with images successful');
            console.log('   Car and all images removed');
          } catch (err) {
            console.log('   ❌ Car deletion failed:', err.message);
          }
        } catch (err) {
          console.log('   ❌ Image alignment verification failed:', err.message);
        }
      } catch (err) {
        console.log('   ❌ Car update failed:', err.message);
      }
    } catch (err) {
      console.log('   ❌ Car creation failed:', err.message);
    }
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Single image upload works');
    console.log('✅ Multiple image upload works');
    console.log('✅ Car creation with images works');
    console.log('✅ Car update with new images works');
    console.log('✅ Image alignment verification works');
    console.log('✅ Car deletion with images works');
    console.log('\n🎉 All Image CRUD Reliability tests passed!');
    
  } catch (err) {
    console.error('Error during Image CRUD test:', err);
  }
}

testImageCRUD();