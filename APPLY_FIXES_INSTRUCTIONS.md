# Apply Fixes Instructions

Follow these step-by-step instructions to apply all fixes to your car rental application.

## Prerequisites

1. Ensure you have Supabase CLI installed
2. Ensure you're logged into your Supabase account
3. Ensure you have the correct project linked

## Step 1: Set Up Environment Variables

1. Create a `.env` file in your project root directory
2. Add your Supabase credentials:

```
VITE_SUPABASE_URL=https://rcpkhtlvfvafympulywx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 2: Apply Database Migrations

Run the following command to apply all database migrations:

```bash
supabase db push
```

This will apply:
- `20250918010000_fix_schema_cache_and_columns.sql`
- `20250918010001_create_atomic_booking_function.sql`
- `20250918010002_create_system_settings_table.sql`

## Step 3: Refresh PostgREST Schema Cache

### For Hosted Supabase:
1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Click "Restart" to restart the database
4. Wait 30-60 seconds for the cache to refresh

### For Self-Hosted Supabase:
```bash
docker-compose restart postgrest realtime
```

## Step 4: Verify the Fixes

Run the verification script to ensure everything is working:

```bash
node scripts/final-verification.js
```

Expected output:
```
🚀 Starting final verification...

 Test 1: Database Connection
   ✅ Connection successful

 Test 2: Required Columns
   ✅ All required columns present

 Test 3: RLS Policies
   ✅ RLS policies working correctly

 Test 4: Atomic Booking Function
   ✅ Atomic booking function exists

 Test 5: Audit Logs Table
   ✅ Audit logs table accessible

🎉 All verification tests passed!

📋 Summary:
   ✅ Database connection working
   ✅ Required columns present
   ✅ RLS policies functioning
   ✅ Atomic booking function available
   ✅ Audit logging system ready

✅ Application is ready for use!
```

## Step 5: Test Admin Functionality

1. Log in as an admin user
2. Navigate to the Car Management page
3. Click "Add Car"
4. Fill in car details
5. Click "Add Car"
6. Verify that:
   - The car is created successfully (no schema errors)
   - The car has 'published' status
   - The car appears in the admin car list

## Step 6: Test User Functionality

1. Visit the main page as a regular user
2. Verify that:
   - Published cars are displayed
   - Images are loading correctly
   - Search and filter functionality works
   - No "Failed to load cars" errors

## Step 7: Test Atomic Booking

1. As a user, find a car in the listing
2. Attempt to book the car
3. Verify that:
   - The booking process works
   - No race conditions occur
   - The booking is recorded in audit logs

## Troubleshooting

### If you still see "Failed to load cars":
1. Check that the `.env` file has correct credentials
2. Verify that database migrations were applied successfully:
   ```bash
   supabase db push
   ```
3. Restart the PostgREST service
4. Clear your browser cache and try again

### If admins still see schema cache errors:
1. Ensure all migrations were applied:
   ```bash
   supabase db push
   ```
2. Restart the PostgREST service
3. Clear your browser cache
4. Try creating a car again

### If cars don't appear in the user listing:
1. Check that admin-created cars have 'published' status
2. Verify the RLS policies are correct
3. Check that the frontend is using the correct query

## Rollback Procedure

If you need to rollback the changes:

1. Apply the rollback migration:
   ```bash
   supabase db push --file supabase/migrations/20250918010003_rollback_fixes.sql
   ```

2. Or reset the database (if you have a backup):
   ```bash
   supabase db reset
   ```

3. Restore database from backup if needed

## Additional Notes

- The fixes ensure that new cars created by admins are automatically set to 'published' status
- The schema cache issues should be resolved after applying migrations and restarting PostgREST
- The atomic booking function prevents race conditions when multiple users try to book the same car
- All required database columns are now properly defined and indexed for performance

## Support

If you encounter any issues after following these instructions, please:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all migrations were applied successfully
4. Contact support with detailed error information