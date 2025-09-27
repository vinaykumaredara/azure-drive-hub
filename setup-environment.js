#!/usr/bin/env node

// Script to help set up the environment for currency migration
import { existsSync, writeFileSync, readFileSync } from 'fs';

console.log('🔧 Environment Setup Helper for Currency Migration');
console.log('================================================');

// Check if .env.local exists
if (!existsSync('.env.local')) {
  console.log('\n📝 Creating .env.local file...');
  const envLocalContent = `# Environment variables for currency migration
# Get your service key from Supabase dashboard: Settings > API > service_role key
SUPABASE_SERVICE_KEY=your-actual-service-role-key-here
`;
  writeFileSync('.env.local', envLocalContent);
  console.log('✅ Created .env.local file');
  console.log('💡 Please update the SUPABASE_SERVICE_KEY with your actual service role key');
} else {
  console.log('\n✅ .env.local file already exists');
  
  // Check if it has the service key
  const envLocalContent = readFileSync('.env.local', 'utf8');
  if (envLocalContent.includes('your-actual-service-role-key-here') || 
      !envLocalContent.includes('SUPABASE_SERVICE_KEY') ||
      envLocalContent.includes('SUPABASE_SERVICE_KEY=')) {
    console.log('⚠️  Please update .env.local with your actual Supabase service role key');
    console.log('   Get it from your Supabase dashboard: Settings > API > service_role key');
  } else {
    console.log('✅ Service key appears to be set in .env.local');
  }
}

// Check .env file
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf8');
  if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log('✅ Required environment variables found in .env file');
  } else {
    console.log('⚠️  Please ensure .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
} else {
  console.log('❌ .env file not found. Please create it with your Supabase credentials');
}

console.log('\n📋 Setup Instructions:');
console.log('=====================');
console.log('1. Get your Supabase service role key from the dashboard');
console.log('   - Go to Supabase project dashboard');
console.log('   - Navigate to Settings > API');
console.log('   - Copy the "service_role key" (not the anon key)');
console.log('');
console.log('2. Update .env.local with your actual service key:');
console.log('   SUPABASE_SERVICE_KEY=your-actual-service-role-key-here');
console.log('');
console.log('3. Run the solution:');
console.log('   node apply-solution.js');
console.log('');
console.log('4. Verify the solution:');
console.log('   node final-verification.js');
console.log('');
console.log('🔒 Security Notes:');
console.log('==================');
console.log('✅ .env.local is in .gitignore and will not be committed');
console.log('⚠️  Never share your service key with anyone');
console.log('⚠️  Rotate your service key regularly for security');