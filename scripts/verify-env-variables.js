#!/usr/bin/env node

/**
 * Script to verify that required environment variables are set
 * This helps prevent deployment issues by checking variables before build
 */

console.log('🔍 Checking required environment variables...');

// List of required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_RAZORPAY_KEY_ID',
  'VITE_STRIPE_PUBLISHABLE_KEY',
];

// Check if we're in a CI environment (like Netlify)
const isCI = process.env.CI || process.env.NETLIFY;

// Load environment variables from .env file if not in CI
if (!isCI) {
  console.log('💻 Local development environment detected');
  try {
    require('dotenv').config();
    console.log('✅ Loaded environment variables from .env file');
  } catch (error) {
    console.log('⚠️  No .env file found, using system environment variables');
  }
} else {
  console.log('🌐 CI/Netlify environment detected');
}

// Check each required environment variable
const missingEnvVars = [];
const envVarStatus = {};

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  envVarStatus[varName] = !!value;

  if (!value) {
    missingEnvVars.push(varName);
  }
});

// Display results
console.log('\n📋 Environment Variable Status:');
console.log('==============================');
Object.entries(envVarStatus).forEach(([varName, isSet]) => {
  console.log(
    `${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'SET' : 'MISSING'}`
  );
});

// Handle missing variables
if (missingEnvVars.length > 0) {
  console.log('\n⚠️  Missing Environment Variables:');
  console.log('==================================');
  missingEnvVars.forEach(varName => {
    console.log(`❌ ${varName}`);
  });

  if (isCI) {
    console.log(
      '\n🚨 CRITICAL: Deployment will fail with missing environment variables!'
    );
    console.log(
      'Please set the following variables in your Netlify dashboard:'
    );
    console.log('Site settings → Build & deploy → Environment');
    missingEnvVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    process.exit(1);
  } else {
    console.log('\n⚠️  Warning: Some environment variables are missing.');
    console.log('This may cause issues in development or production.');
  }
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('🚀 Ready for build and deployment');
}

// Additional checks for Supabase configuration
if (process.env.VITE_SUPABASE_URL) {
  console.log('\n🔍 Supabase Configuration Check:');
  console.log('===============================');

  // Check if Supabase URL looks valid
  if (process.env.VITE_SUPABASE_URL.includes('.supabase.')) {
    console.log('✅ Supabase URL format looks correct');
  } else {
    console.log('⚠️  Supabase URL format may be incorrect');
    console.log('   Expected format: https://your-project.supabase.co');
  }

  // Check if keys are not empty
  if (
    process.env.VITE_SUPABASE_ANON_KEY &&
    process.env.VITE_SUPABASE_ANON_KEY.length > 10
  ) {
    console.log('✅ Supabase Anon Key is set');
  } else {
    console.log('⚠️  Supabase Anon Key may be missing or too short');
  }
}

console.log(
  '\n💡 Tip: For Netlify deployment, make sure to set these variables in:'
);
console.log(
  '   Netlify Dashboard → Site settings → Build & deploy → Environment'
);
