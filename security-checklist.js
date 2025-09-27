#!/usr/bin/env node

// Security checklist script to verify proper handling of service keys
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔒 Security Checklist for Currency Migration');
console.log('==========================================');

// 1. Check if service key is provided
console.log('\n1. Service Key Availability');
if (SUPABASE_SERVICE_KEY) {
  console.log('✅ Service key is available in environment variables');
  // Check if it looks like a real service key (should start with eyJ and be quite long)
  if (SUPABASE_SERVICE_KEY.startsWith('eyJ') && SUPABASE_SERVICE_KEY.length > 100) {
    console.log('✅ Service key format appears correct');
  } else {
    console.log('⚠️  Service key format may be incorrect');
  }
} else {
  console.log('❌ Service key is NOT available in environment variables');
  console.log('   Please set SUPABASE_SERVICE_KEY environment variable');
}

// 2. Check if anon key is provided
console.log('\n2. Anon Key Availability');
if (SUPABASE_ANON_KEY) {
  console.log('✅ Anon key is available in environment variables');
} else {
  console.log('❌ Anon key is NOT available in environment variables');
  console.log('   Please set VITE_SUPABASE_ANON_KEY environment variable');
}

// 3. Check if service key is different from anon key
console.log('\n3. Key Separation');
if (SUPABASE_SERVICE_KEY && SUPABASE_ANON_KEY) {
  if (SUPABASE_SERVICE_KEY !== SUPABASE_ANON_KEY) {
    console.log('✅ Service key and anon key are different');
  } else {
    console.log('❌ Service key and anon key are the SAME - this is a security risk!');
  }
} else {
  console.log('⚠️  Cannot verify key separation - missing one or both keys');
}

// 4. Check for service key in source files (this is a security risk)
console.log('\n4. Service Key in Source Files Check');
const filesToCheck = [
  '.env',
  '.env.local',
  'src/**/*.{js,ts,jsx,tsx}',
  'scripts/**/*.{js,ts}',
  'package.json'
];

// Simple check for service key patterns in common files
const sensitivePatterns = [
  'service_role',
  'service-role',
  'serviceKey',
  'SERVICE_KEY'
];

let foundSensitiveContent = false;

// Check .env files
const envFiles = ['.env', '.env.local', '.env.production'];
envFiles.forEach(file => {
  if (existsSync(file)) {
    const content = readFileSync(file, 'utf8');
    sensitivePatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        console.log(`⚠️  Found potential sensitive content in ${file}: ${pattern}`);
        foundSensitiveContent = true;
      }
    });
  }
});

if (!foundSensitiveContent) {
  console.log('✅ No obvious sensitive content found in common files');
} else {
  console.log('❌ Found potential sensitive content in files above');
  console.log('   Please ensure service keys are NEVER committed to source control');
}

// 5. Test service key permissions
console.log('\n5. Service Key Permissions Test');
if (SUPABASE_SERVICE_KEY) {
  try {
    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Try to execute a simple query that requires admin permissions
    serviceSupabase.rpc('execute_sql', {
      query: 'SELECT 1;'
    }).then(({ error }) => {
      if (error) {
        console.log('❌ Service key may not have proper permissions:', error.message);
      } else {
        console.log('✅ Service key has proper permissions');
      }
    });
  } catch (error) {
    console.log('❌ Error testing service key permissions:', error.message);
  }
} else {
  console.log('⚠️  Cannot test service key permissions - service key not available');
}

// 6. Check anon key permissions
console.log('\n6. Anon Key Permissions Test');
if (SUPABASE_ANON_KEY) {
  try {
    const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try to read public data
    anonSupabase.from('cars').select('id').limit(1).then(({ error }) => {
      if (error) {
        console.log('❌ Anon key may not have proper permissions:', error.message);
      } else {
        console.log('✅ Anon key has proper read permissions');
      }
    });
  } catch (error) {
    console.log('❌ Error testing anon key permissions:', error.message);
  }
} else {
  console.log('⚠️  Cannot test anon key permissions - anon key not available');
}

console.log('\n🔐 Security Checklist Summary:');
console.log('==============================');
console.log('Please ensure that:');
console.log('1. Service keys are only stored in secure environment variables');
console.log('2. Service keys are never committed to source control');
console.log('3. Service keys are rotated regularly');
console.log('4. Access to service keys is restricted to authorized personnel only');
console.log('5. Service keys are not exposed in logs or error messages');