#!/usr/bin/env node
/**
 * Storage Cleanup Script
 * Removes orphaned images from Supabase Storage
 * 
 * Usage:
 *   node scripts/storage-cleanup.js [--dry-run] [--log-file=deletion-log.json]
 * 
 * Safety:
 *   - Runs in dry-run mode by default
 *   - Logs all deletions to file
 *   - Only deletes files not referenced in database
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');
const logFile = args.find(arg => arg.startsWith('--log-file='))?.split('=')[1] || 'deletion-log.json';

async function main() {
  console.log('🔍 Starting Storage Cleanup...');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'EXECUTE (files will be deleted)'}`);
  console.log(`Log file: ${logFile}\n`);

  // Step 1: Get all image paths from database
  console.log('📊 Step 1: Fetching referenced images from database...');
  const { data: cars, error: dbError } = await supabase
    .from('cars')
    .select('image_paths');

  if (dbError) {
    console.error('❌ Error fetching cars from database:', dbError);
    process.exit(1);
  }

  // Flatten all image paths into a Set for fast lookup
  const referencedPaths = new Set();
  cars?.forEach(car => {
    if (Array.isArray(car.image_paths)) {
      car.image_paths.forEach(path => referencedPaths.add(path));
    }
  });

  console.log(`✅ Found ${referencedPaths.size} referenced image paths\n`);

  // Step 2: List all files in storage
  console.log('📊 Step 2: Listing all files in storage...');
  const { data: files, error: storageError } = await supabase.storage
    .from('cars-photos')
    .list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (storageError) {
    console.error('❌ Error listing storage files:', storageError);
    process.exit(1);
  }

  // Recursively list all files in subdirectories
  const allFiles = [];
  async function listRecursive(prefix = '') {
    const { data, error } = await supabase.storage
      .from('cars-photos')
      .list(prefix, { limit: 1000 });

    if (error) {
      console.error(`❌ Error listing ${prefix}:`, error);
      return;
    }

    for (const item of data || []) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      
      if (item.id) { // It's a file
        allFiles.push({
          path: fullPath,
          name: item.name,
          size: item.metadata?.size || 0,
          created: item.created_at
        });
      } else { // It's a folder
        await listRecursive(fullPath);
      }
    }
  }

  await listRecursive();
  console.log(`✅ Found ${allFiles.length} total files in storage\n`);

  // Step 3: Identify orphaned files
  console.log('🔍 Step 3: Identifying orphaned files...');
  const orphanedFiles = allFiles.filter(file => !referencedPaths.has(file.path));
  
  // Also check for test/placeholder patterns
  const testPatterns = ['test', 'sample', 'dummy', 'placeholder'];
  const testFiles = orphanedFiles.filter(file => 
    testPatterns.some(pattern => file.path.toLowerCase().includes(pattern))
  );

  console.log(`Found ${orphanedFiles.length} orphaned files (not in database)`);
  console.log(`Found ${testFiles.length} files with test/sample patterns\n`);

  // Step 4: Log files to be deleted
  const deletionLog = {
    timestamp: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'execute',
    totalFiles: allFiles.length,
    referencedFiles: referencedPaths.size,
    orphanedFiles: orphanedFiles.length,
    testFiles: testFiles.length,
    files: orphanedFiles.map(f => ({
      path: f.path,
      size: f.size,
      created: f.created,
      isTestFile: testPatterns.some(p => f.path.toLowerCase().includes(p))
    }))
  };

  // Write log file
  writeFileSync(logFile, JSON.stringify(deletionLog, null, 2));
  console.log(`📝 Deletion log written to ${logFile}\n`);

  // Step 5: Delete orphaned files (if not dry-run)
  if (!isDryRun && orphanedFiles.length > 0) {
    console.log('🗑️  Step 5: Deleting orphaned files...');
    
    const pathsToDelete = orphanedFiles.map(f => f.path);
    const { data, error } = await supabase.storage
      .from('cars-photos')
      .remove(pathsToDelete);

    if (error) {
      console.error('❌ Error deleting files:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully deleted ${pathsToDelete.length} orphaned files`);
  } else if (orphanedFiles.length > 0) {
    console.log('ℹ️  Dry run mode - no files were deleted');
    console.log(`   To execute deletion, run: node scripts/storage-cleanup.js --execute`);
  } else {
    console.log('✅ No orphaned files to delete');
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total files in storage: ${allFiles.length}`);
  console.log(`   Referenced in database: ${referencedPaths.size}`);
  console.log(`   Orphaned files: ${orphanedFiles.length}`);
  console.log(`   Test pattern files: ${testFiles.length}`);
  console.log(`   Action taken: ${isDryRun ? 'None (dry run)' : `Deleted ${orphanedFiles.length} files`}`);
}

main().catch(console.error);
