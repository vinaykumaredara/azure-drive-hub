// Script to create a test car with images for debugging
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

async function createTestCar() {
  try {
    console.log('Creating test car...');
    
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a test car with image data
    const { data, error } = await supabase
      .from('cars')
      .insert([
        {
          title: 'Test Car for Debugging',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          seats: 5,
          fuel_type: 'petrol',
          transmission: 'automatic',
          price_per_day: 2500,
          status: 'published',
          image_urls: [
            'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
          ],
          image_paths: null,
          description: 'Test car for debugging image display issues'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating test car:', error);
      return;
    }

    console.log('Test car created successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Call the function only once
createTestCar();