import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function enhancedRepairImageUrls() {
  console.log('=== Azure Drive Hub - Enhanced Image URL Repair Script ===\n');
  
  try {
    // Fetch all cars
    const { data: cars, error: fetchError } = await supabaseAdmin
      .from('cars')
      .select('id, title, image_urls, image_paths');
      
    if (fetchError) {
      console.error('Error fetching cars:', fetchError);
      return;
    }
    
    console.log(`Found ${cars.length} cars\n`);
    
    let repairedCount = 0;
    
    for (const car of cars) {
      console.log(`Processing car: ${car.title} (${car.id})`);
      
      let needsUpdate = false;
      let repairedImageUrls = [];
      let repairedImagePaths = car.image_paths || [];
      
      // Handle image_paths -> image_urls conversion
      if (Array.isArray(car.image_paths) && car.image_paths.length > 0) {
        console.log(`  Found ${car.image_paths.length} image paths`);
        
        for (const path of car.image_paths) {
          try {
            const { data } = supabaseAdmin.storage
              .from('cars-photos')
              .getPublicUrl(path);
            
            if (data?.publicUrl) {
              repairedImageUrls.push(data.publicUrl);
              console.log(`    ✓ Generated URL for path: ${path.substring(0, 50)}...`);
            } else {
              console.log(`    ✗ Failed to generate URL for path: ${path.substring(0, 50)}...`);
            }
          } catch (error) {
            console.log(`    ✗ Error generating URL for path: ${path.substring(0, 50)}...`, error.message);
          }
        }
        
        needsUpdate = true;
      }
      
      // Handle existing image_urls (validate or repair)
      if (Array.isArray(car.image_urls) && car.image_urls.length > 0) {
        console.log(`  Found ${car.image_urls.length} existing image URLs`);
        
        const validatedUrls = [];
        for (const url of car.image_urls) {
          // If it's already a proper URL, keep it
          if (url && (url.startsWith('http') || url.startsWith('https'))) {
            validatedUrls.push(url);
            console.log(`    ✓ Valid URL: ${url.substring(0, 50)}...`);
          } else {
            // If it's a file path, convert it
            try {
              const { data } = supabaseAdmin.storage
                .from('cars-photos')
                .getPublicUrl(url);
              
              if (data?.publicUrl) {
                validatedUrls.push(data.publicUrl);
                console.log(`    ✓ Converted path to URL: ${url.substring(0, 50)}...`);
                needsUpdate = true;
              } else {
                console.log(`    ✗ Failed to convert path: ${url.substring(0, 50)}...`);
              }
            } catch (error) {
              console.log(`    ✗ Error converting path: ${url.substring(0, 50)}...`, error.message);
            }
          }
        }
        
        // Only update if we have validated URLs
        if (validatedUrls.length > 0) {
          repairedImageUrls = [...repairedImageUrls, ...validatedUrls];
        }
      }
      
      // Update the car if needed
      if (needsUpdate) {
        console.log(`  Updating car with repaired URLs...`);
        const { error: updateError } = await supabaseAdmin
          .from('cars')
          .update({ 
            image_urls: repairedImageUrls,
            image_paths: repairedImagePaths
          })
          .eq('id', car.id);
          
        if (updateError) {
          console.error(`  ✗ Failed to update car ${car.id}:`, updateError.message);
        } else {
          console.log(`  ✓ Successfully updated car ${car.id}`);
          repairedCount++;
        }
      } else {
        console.log(`  No updates needed for car ${car.id}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(`=== Repair Complete ===`);
    console.log(`Repaired ${repairedCount} cars\n`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the repair script
enhancedRepairImageUrls();