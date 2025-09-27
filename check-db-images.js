import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzODc5MywiZXhwIjoyMDcyMTE0NzkzfQ.uqmG-uplIVvwnhrCakr8QK2rIaZFeBqlkvQAH8VOgQM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkImages() {
  try {
    // Get cars with image_urls
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)
      .limit(10);

    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }

    console.log('Cars with image URLs:');
    data.forEach(car => {
      console.log(`ID: ${car.id}`);
      console.log(`Title: ${car.title}`);
      console.log(`Image URLs count: ${car.image_urls ? car.image_urls.length : 0}`);
      console.log(`Image URLs:`, car.image_urls);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkImages();