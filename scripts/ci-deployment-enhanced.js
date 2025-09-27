import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runCIDeployment() {
  console.log('=== Azure Drive Hub - CI/CD Deployment Script ===\n');
  
  try {
    // 1. Run database migrations
    console.log('🔄 Running database migrations...');
    try {
      execSync('npx supabase db push', { stdio: 'inherit' });
      console.log('✅ Database migrations completed successfully\n');
    } catch (error) {
      console.error('❌ Database migration failed:', error.message);
      process.exit(1);
    }
    
    // 2. Generate TypeScript types
    console.log('🔄 Generating TypeScript types...');
    try {
      execSync('npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts', { stdio: 'inherit' });
      console.log('✅ TypeScript types generated successfully\n');
    } catch (error) {
      console.error('❌ TypeScript type generation failed:', error.message);
      // Continue with deployment even if type generation fails
    }
    
    // 3. Verify bucket configuration
    console.log('🔄 Verifying storage bucket configuration...');
    await verifyBucketConfiguration();
    
    // 4. Run image URL repair
    console.log('🔄 Running image URL repair...');
    await runImageRepair();
    
    // 5. Run schema validation
    console.log('🔄 Validating database schema...');
    await validateSchema();
    
    // 6. Run cleanup for expired holds
    console.log('🔄 Cleaning up expired booking holds...');
    await cleanupExpiredHolds();
    
    console.log('\n✅ CI/CD deployment completed successfully!');
    
  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
}

async function verifyBucketConfiguration() {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error fetching buckets:', error.message);
      return;
    }
    
    const carsPhotosBucket = buckets.find(b => b.name === 'cars-photos');
    if (carsPhotosBucket) {
      console.log(`✅ cars-photos bucket found (public: ${carsPhotosBucket.public})`);
    } else {
      console.log('❌ cars-photos bucket not found');
    }
    
    const licenseUploadsBucket = buckets.find(b => b.name === 'license-uploads');
    if (licenseUploadsBucket) {
      console.log(`✅ license-uploads bucket found (public: ${licenseUploadsBucket.public})`);
    } else {
      console.log('❌ license-uploads bucket not found');
    }
    
  } catch (error) {
    console.error('❌ Bucket verification failed:', error.message);
  }
}

async function runImageRepair() {
  try {
    // Import and run the enhanced repair script
    const { enhancedRepairImageUrls } = await import('./enhanced-repair-image-urls.js');
    await enhancedRepairImageUrls();
    console.log('✅ Image URL repair completed');
  } catch (error) {
    console.error('❌ Image URL repair failed:', error.message);
  }
}

async function validateSchema() {
  try {
    // Check if required tables exist
    const requiredTables = ['cars', 'bookings', 'users', 'licenses', 'payments'];
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count()', { count: 'exact' })
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table} validation failed:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists (${data?.length || 0} rows)`);
        }
      } catch (error) {
        console.log(`❌ Table ${table} validation error:`, error.message);
      }
    }
    
    // Check for required columns in cars table
    const requiredCarColumns = ['id', 'title', 'image_urls', 'image_paths'];
    
    try {
      const { data, error } = await supabaseAdmin
        .from('cars')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Cars table column validation failed:', error.message);
      } else if (data && data.length > 0) {
        const car = data[0];
        for (const column of requiredCarColumns) {
          if (column in car) {
            console.log(`✅ Column ${column} exists in cars table`);
          } else {
            console.log(`❌ Column ${column} missing from cars table`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Cars table column validation error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
  }
}

async function cleanupExpiredHolds() {
  try {
    // Find bookings with expired holds
    const { data: expiredBookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, hold_expires_at')
      .lt('hold_expires_at', new Date().toISOString())
      .eq('status', 'pending');
    
    if (error) {
      console.error('❌ Failed to fetch expired holds:', error.message);
      return;
    }
    
    if (expiredBookings.length === 0) {
      console.log('✅ No expired holds found');
      return;
    }
    
    console.log(`Found ${expiredBookings.length} expired holds, cleaning up...`);
    
    // Update expired bookings to cancelled status
    for (const booking of expiredBookings) {
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: 'cancelled',
          payment_status: 'cancelled'
        })
        .eq('id', booking.id);
      
      if (updateError) {
        console.log(`❌ Failed to cancel booking ${booking.id}:`, updateError.message);
      } else {
        console.log(`✅ Cancelled expired booking ${booking.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Expired hold cleanup failed:', error.message);
  }
}

// Run the CI/CD deployment
runCIDeployment();