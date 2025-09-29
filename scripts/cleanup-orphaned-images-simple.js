#!/usr/bin/env node

/**
 * Simple orphaned image cleanup script for Supabase Storage
 * 
 * This script identifies and optionally removes orphaned image files in the cars-photos bucket
 * that are no longer referenced by any car records in the database.
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-images-simple.js [--dry-run]
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set
 *   - @supabase/supabase-js package must be installed
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  console.error('Please set these variables and try again:');
  console.error('  export SUPABASE_URL=your_supabase_project_url');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function cleanupOrphanedImages() {
  console.log(`Starting orphaned image cleanup... ${isDryRun ? '(DRY RUN MODE)' : '(LIVE MODE)'}`);
  
  try {
    // Step 1: Collect all image_paths referenced in cars table
    console.log('Fetching all image paths from cars table...');
    const usedPaths = new Set();
    
    // Paginate through all cars to get all image_paths
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: cars, error } = await supabase
        .from('cars')
        .select('image_paths')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        throw new Error(`Failed to fetch cars: ${error.message}`);
      }
      
      // Add all image paths to the set
      cars.forEach(car => {
        if (car.image_paths && Array.isArray(car.image_paths)) {
          car.image_paths.forEach(path => {
            if (path && typeof path === 'string' && path.length > 0) {
              usedPaths.add(path);
            }
          });
        }
      });
      
      // Check if we have more pages
      hasMore = cars.length === pageSize;
      page++;
      
      console.log(`  Fetched page ${page}, total paths so far: ${usedPaths.size}`);
    }
    
    console.log(`Found ${usedPaths.size} unique image paths referenced in cars table`);
    
    // Step 2: List all objects in cars-photos bucket
    console.log('Listing all objects in cars-photos bucket...');
    const allObjects = [];
    
    // Paginate through all objects in the bucket
    while (true) {
      const { data: objects, error } = await supabase.storage
        .from('cars-photos')
        .list('', {
          limit: 1000,
          offset: allObjects.length
        });
      
      if (error) {
        throw new Error(`Failed to list objects: ${error.message}`);
      }
      
      // If no more objects, break
      if (objects.length === 0) {
        break;
      }
      
      // Add objects to our list
      allObjects.push(...objects);
      
      console.log(`  Listed ${allObjects.length} objects so far...`);
    }
    
    console.log(`Found ${allObjects.length} objects in cars-photos bucket`);
    
    // Step 3: Identify orphaned objects
    console.log('Identifying orphaned objects...');
    const orphanedObjects = [];
    
    allObjects.forEach(obj => {
      // Skip directories (objects with no extension)
      if (!obj.name.includes('.')) {
        return;
      }
      
      // Check if this object is referenced by any car
      if (!usedPaths.has(obj.name)) {
        orphanedObjects.push(obj.name);
      }
    });
    
    console.log(`Found ${orphanedObjects.length} orphaned objects`);
    
    // Step 4: Handle orphaned objects
    if (orphanedObjects.length === 0) {
      console.log('No orphaned objects found. Cleanup complete.');
      return;
    }
    
    console.log('\nOrphaned objects found:');
    orphanedObjects.forEach(path => console.log(`  - ${path}`));
    
    // If dry-run, just report and exit
    if (isDryRun) {
      console.log(`\nDRY RUN: Would delete ${orphanedObjects.length} orphaned files from storage.`);
      console.log('To actually delete these files, run without --dry-run flag.');
      return;
    }
    
    // Delete orphaned objects in batches of 100
    console.log('Deleting orphaned objects...');
    const batchSize = 100;
    let deletedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < orphanedObjects.length; i += batchSize) {
      const batch = orphanedObjects.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase.storage
          .from('cars-photos')
          .remove(batch);
        
        if (error) {
          console.warn(`Failed to delete batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
          errorCount++;
        } else {
          deletedCount += batch.length;
          console.log(`  Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(orphanedObjects.length/batchSize)} (${batch.length} files)`);
        }
      } catch (err) {
        console.warn(`Exception during batch deletion ${Math.floor(i/batchSize) + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\nCleanup complete!`);
    console.log(`  Successfully deleted: ${deletedCount} files`);
    console.log(`  Errors encountered: ${errorCount}`);
    console.log(`  Total processed: ${orphanedObjects.length} files`);
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupOrphanedImages();
}

module.exports = { cleanupOrphanedImages };