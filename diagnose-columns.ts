// Script to diagnose what columns exist in the cars table
import { supabase } from './src/integrations/supabase/client';

async function diagnoseColumns() {
  try {
    console.log('Diagnosing cars table columns...');
    
    // Try to get column information from information_schema
    const { data, error }: any = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'cars')
      .in('column_name', ['image_paths', 'image_urls', 'image_path']);

    if (error) {
      console.error('Error fetching column information:', error);
      return;
    }

    console.log('Found columns in cars table:');
    if (data.length === 0) {
      console.log('No matching columns found');
    } else {
      data.forEach((column: any) => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
    }

    // Also try a simple query to see what happens
    console.log('\nTrying to fetch a car with specific columns...');
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select('id, title')
      .limit(1);

    if (carError) {
      console.error('Error fetching car data:', carError);
    } else {
      console.log('Successfully fetched car data:', JSON.stringify(carData, null, 2));
    }
    
    // Try fetching with image columns
    console.log('\nTrying to fetch a car with image columns...');
    const { data: imageData, error: imageError } = await supabase
      .from('cars')
      .select('id, title, image_paths, image_urls')
      .limit(1);

    if (imageError) {
      console.error('Error fetching car data with image columns:', imageError);
    } else {
      console.log('Successfully fetched car data with image columns:', JSON.stringify(imageData, null, 2));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

diagnoseColumns();