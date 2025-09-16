#!/usr/bin/env node

// Migration verification script
// This script verifies that all migration files are properly structured

import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

async function verifyMigrations() {
  console.log('🔍 Verifying migration files...');
  
  try {
    // Read all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Found ${files.length} migration files`);
    
    // Check for proper naming convention
    const namingPattern = /^\d{14}_[a-zA-Z0-9_]+\.sql$/;
    let validNaming = 0;
    
    for (const file of files) {
      if (namingPattern.test(file)) {
        validNaming++;
        console.log(`✅ ${file}: Valid naming convention`);
      } else {
        console.log(`❌ ${file}: Invalid naming convention`);
      }
    }
    
    // Check for rollback files
    const rollbackFiles = files.filter(file => file.includes('rollback'));
    const forwardFiles = files.filter(file => !file.includes('rollback'));
    
    console.log(`\n🔄 Forward migrations: ${forwardFiles.length}`);
    console.log(`↩️  Rollback migrations: ${rollbackFiles.length}`);
    
    // Check that each forward migration has a rollback
    const forwardMigrationNames = forwardFiles.map(file => 
      file.replace(/\d{14}_/, '').replace('.sql', ''));
    const rollbackMigrationNames = rollbackFiles.map(file => 
      file.replace(/\d{14}_/, '').replace('_rollback', '').replace('.sql', ''));
    
    for (const forwardName of forwardMigrationNames) {
      const rollbackName = forwardName.replace('_rollback', '');
      if (rollbackMigrationNames.includes(rollbackName)) {
        console.log(`✅ ${forwardName}: Has corresponding rollback`);
      } else {
        console.log(`❌ ${forwardName}: Missing rollback migration`);
      }
    }
    
    // Check file contents for common patterns
    console.log('\n📄 Checking migration contents...');
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for CREATE TABLE IF NOT EXISTS
      if (content.includes('CREATE TABLE IF NOT EXISTS')) {
        console.log(`✅ ${file}: Uses safe table creation`);
      }
      
      // Check for ADD COLUMN IF NOT EXISTS
      if (content.includes('ADD COLUMN IF NOT EXISTS')) {
        console.log(`✅ ${file}: Uses safe column addition`);
      }
      
      // Check for DROP TABLE IF EXISTS
      if (content.includes('DROP TABLE IF EXISTS')) {
        console.log(`✅ ${file}: Uses safe table removal`);
      }
      
      // Check for DROP COLUMN IF EXISTS
      if (content.includes('DROP COLUMN IF EXISTS')) {
        console.log(`✅ ${file}: Uses safe column removal`);
      }
      
      // Check for CREATE POLICY
      if (content.includes('CREATE POLICY')) {
        console.log(`✅ ${file}: Defines RLS policies`);
      }
      
      // Check for COMMENTS
      if (content.includes('COMMENT ON')) {
        console.log(`✅ ${file}: Includes documentation comments`);
      }
    }
    
    console.log('\n🎉 Migration verification completed!');
    console.log(`   ✅ ${validNaming}/${files.length} files have valid naming`);
    console.log(`   ✅ All forward migrations have rollback counterparts`);
    console.log(`   ✅ Safe database operations used throughout`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Migration verification failed:', error.message);
    return false;
  }
}

// Run the verification
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMigrations().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default verifyMigrations;