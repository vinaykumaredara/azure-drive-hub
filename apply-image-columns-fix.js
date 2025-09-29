// Script to apply the missing image columns migration
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please set these environment variables and try again.');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyImageColumnsFix() {
  try {
    console.log('Applying image columns fix...');
    
    // Add image_paths column - using ADD COLUMN IF NOT EXISTS to avoid errors if it already exists
    console.log('Adding image_paths column...');
    const { error: addPathsError } = await supabase
      .from('cars')
      .select('')  // Dummy select to initialize the query
      .limit(0);
    
    // Execute raw SQL
    const { error: sqlError1 } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_paths text[] DEFAULT ARRAY[]::text[];`
    });
    
    if (sqlError1) {
      console.log('Trying alternative method...');
      // If rpc doesn't work, try to execute via a different method
      try {
        // This is a workaround - we'll try to select from the column to see if it exists
        const { error: testError } = await supabase
          .from('cars')
          .select('image_paths')
          .limit(1);
        
        if (testError && testError.message.includes('column "image_paths" does not exist')) {
          console.log('Column does not exist, but we cannot add it directly without proper permissions');
          console.log('Please run the following SQL manually in your Supabase SQL editor:');
          console.log('ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_paths text[] DEFAULT ARRAY[]::text[];');
          console.log('ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];');
          return;
        }
      } catch (e) {
        // Ignore
      }
    } else {
      console.log('Successfully added image_paths column');
    }

    // Add image_urls column - using ADD COLUMN IF NOT EXISTS to avoid errors if it already exists
    console.log('Adding image_urls column...');
    const { error: sqlError2 } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];`
    });
    
    if (sqlError2) {
      console.log('Could not add image_urls column directly');
    } else {
      console.log('Successfully added image_urls column');
    }

    console.log('✅ Image columns fix attempted!');
    console.log('If the columns were not added, please run the SQL manually in your Supabase SQL editor.');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

applyImageColumnsFix();