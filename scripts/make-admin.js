#!/usr/bin/env node

// Script to make a user admin
// Usage: node scripts/make-admin.js <email>

const { createClient } = require('@supabase/supabase-js');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

// Supabase configuration - you'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // First, try to find the user in the auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (authError) {
      console.error('❌ Error fetching user from auth:', authError.message);
      process.exit(1);
    }
    
    if (!authUsers) {
      console.error('❌ User not found in auth system');
      process.exit(1);
    }
    
    const userId = authUsers.user.id;
    console.log(`✅ Found user ID: ${userId}`);
    
    // Update the user's is_admin status in the public.users table
    console.log('🔄 Updating user admin status...');
    const { data, error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error('❌ Error updating user:', error.message);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      console.log('✅ User successfully made admin!');
      console.log('User details:', data[0]);
    } else {
      console.log('⚠️ No user found with that ID in public.users table');
      
      // Try to create the user profile if it doesn't exist
      console.log('🔄 Creating user profile...');
      const { data: createdData, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          is_admin: true,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (createError) {
        console.error('❌ Error creating user profile:', createError.message);
        process.exit(1);
      }
      
      console.log('✅ User profile created and admin status set!');
      console.log('User details:', createdData[0]);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

makeAdmin(email);