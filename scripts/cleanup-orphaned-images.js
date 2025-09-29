#!/usr/bin/env node

/**
 * Cleanup orphaned images script
 * This script identifies and optionally removes orphaned images in the Supabase storage
 * that are no longer referenced by any car in the database.
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-images.js [--dry-run] [--delete]
 * 
 * Options:
 *   --dry-run: Show what would be deleted without actually deleting
 *   --delete: Actually delete the orphaned images
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - these should be set in environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required environment variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getDatabaseImagePaths() {
  try {
    console.log('Fetching image paths from database...');
    
    // Get all image_paths from cars table
    const { data, error } = await supabase
      .from('cars')
      .select('image_paths');
    
    if (error) {
      throw error;
    }
    
    // Flatten all image_paths into a single array
    const allImagePaths = data
      .filter(car => Array.isArray(car.image_paths) && car.image_paths.length > 0)
      .flatMap(car => car.image_paths)
      .filter(path => path && typeof path === 'string');
    
    console.log(`Found ${allImagePaths.length} image paths in database`);
    return new Set(allImagePaths);
  } catch (error) {
    console.error('Error fetching database image paths:', error);
    throw error;
  }
}

async function getStorageImagePaths() {
  try {
    console.log('Fetching image paths from storage...');
    
    // List all files in the cars-photos bucket
    const { data, error } = await supabase
      .storage
      .from('cars-photos')
      .list('', { limit: 10000 }); // Adjust limit as needed
    
    if (error) {
      throw error;
    }
    
    // Extract file paths
    const storagePaths = data
      .filter(file => file.name)
      .map(file => `cars-photos/${file.name}`);
    
    console.log(`Found ${storagePaths.length} images in storage`);
    return new Set(storagePaths);
  } catch (error) {
    console.error('Error fetching storage image paths:', error);
    throw error;
  }
}

async function findOrphanedImages(databasePaths, storagePaths) {
  console.log('Finding orphaned images...');
  
  const orphanedPaths = [];
  
  for (const storagePath of storagePaths) {
    if (!databasePaths.has(storagePath)) {
      orphanedPaths.push(storagePath);
    }
  }
  
  console.log(`Found ${orphanedPaths.length} orphaned images`);
  return orphanedPaths;
}

async function deleteOrphanedImages(orphanedPaths) {
  if (orphanedPaths.length === 0) {
    console.log('No orphaned images to delete');
    return;
  }
  
  console.log(`Deleting ${orphanedPaths.length} orphaned images...`);
  
  try {
    const { error } = await supabase
      .storage
      .from('cars-photos')
      .remove(orphanedPaths);
    
    if (error) {
      throw error;
    }
    
    console.log('Successfully deleted orphaned images');
  } catch (error) {
    console.error('Error deleting orphaned images:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const shouldDelete = args.includes('--delete');
  
  if (!dryRun && !shouldDelete) {
    console.log('Usage: node scripts/cleanup-orphaned-images.js [--dry-run] [--delete]');
    console.log('  --dry-run: Show what would be deleted without actually deleting');
    console.log('  --delete: Actually delete the orphaned images');
    process.exit(0);
  }
  
  try {
    // Get image paths from database and storage
    const databasePaths = await getDatabaseImagePaths();
    const storagePaths = await getStorageImagePaths();
    
    // Find orphaned images
    const orphanedPaths = await findOrphanedImages(databasePaths, storagePaths);
    
    if (orphanedPaths.length === 0) {
      console.log('No orphaned images found. Everything is clean!');
      return;
    }
    
    console.log('\nOrphaned images found:');
    orphanedPaths.forEach(path => console.log(`  - ${path}`));
    
    if (dryRun) {
      console.log('\nDry run mode: No images were deleted');
      return;
    }
    
    if (shouldDelete) {
      await deleteOrphanedImages(orphanedPaths);
      console.log('\nOrphaned image cleanup completed successfully!');
    }
  } catch (error) {
    console.error('Error during orphaned image cleanup:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getDatabaseImagePaths,
  getStorageImagePaths,
  findOrphanedImages,
  deleteOrphanedImages
};