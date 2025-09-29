// Debug script to test car deletion functionality
import { createClient } from '@supabase/supabase-js';
import { deleteCarWithImages } from '../src/utils/imageCrudUtils';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDeleteCar(carId) {
  console.log(`Starting debug deletion for car ID: ${carId}`);
  
  try {
    // First, let's check if the car exists
    console.log('1. Checking if car exists...');
    const { data: car, error: fetchError } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .eq('id', carId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching car:', fetchError);
      return;
    }
    
    if (!car) {
      console.log('Car not found');
      return;
    }
    
    console.log('Car found:', {
      id: car.id,
      title: car.title,
      imageUrls: car.image_urls
    });
    
    // Now test the delete function
    console.log('2. Calling deleteCarWithImages...');
    const result = await deleteCarWithImages(carId);
    console.log('Delete result:', result);
    
    // Verify deletion
    console.log('3. Verifying deletion...');
    const { data: deletedCar, error: verifyError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', carId)
      .single();
      
    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('Error verifying deletion:', verifyError);
    } else if (deletedCar) {
      console.log('Car still exists after deletion attempt');
    } else {
      console.log('Car successfully deleted from database');
    }
    
  } catch (error) {
    console.error('Error during deletion debug:', error);
  }
}

// Get car ID from command line arguments
const carId = process.argv[2];
if (!carId) {
  console.log('Usage: node debug-delete-car.js <car-id>');
  process.exit(1);
}

debugDeleteCar(carId);