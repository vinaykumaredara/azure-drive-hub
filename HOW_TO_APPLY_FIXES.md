# How to Apply Fixes

This document explains how to apply all the fixes to resolve the issues with the car rental application.

## Prerequisites

1. Ensure you have the Supabase CLI installed
2. Ensure you're logged into your Supabase account
3. Ensure you have the correct project linked

## Step-by-Step Instructions

### 1. Set Up Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://rcpkhtlvfvafympulywx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Apply Database Migrations

Run the following command to apply all database migrations:

```bash
supabase db push
```

This will apply the following migrations:
- `20250918010000_fix_schema_cache_and_columns.sql`
- `20250918010001_create_atomic_booking_function.sql`
- `20250918010002_create_system_settings_table.sql`

### 3. Refresh PostgREST Schema Cache

For hosted Supabase:
1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Click "Restart" to restart the database

For self-hosted Supabase:
```bash
docker-compose restart postgrest realtime
```

### 4. Verify the Fixes

Run the verification script to ensure everything is working:

```bash
node scripts/final-verification.js
```

### 5. Test Admin Functionality

1. Log in as an admin user
2. Navigate to the Car Management page
3. Try creating a new car
4. Verify that the car is created with 'published' status
5. Check that the car appears in the user-facing car listing

### 6. Test User Functionality

1. Visit the main page as a regular user
2. Verify that published cars are displayed
3. Check that images are loading correctly
4. Test the search and filter functionality

### 7. Test Atomic Booking

1. As a user, try to book a car
2. Verify that the booking is atomic (no race conditions)
3. Check that the booking is recorded in the audit logs

## Troubleshooting

### If you still see "Failed to load cars":

1. Check that the `.env` file has correct credentials
2. Verify that the database migrations were applied successfully
3. Restart the PostgREST service
4. Check the browser console for any errors

### If admins still see schema cache errors:

1. Ensure all migrations were applied
2. Restart the PostgREST service
3. Clear your browser cache
4. Try creating a car again

### If cars don't appear in the user listing:

1. Check that admin-created cars have 'published' status
2. Verify the RLS policies are correct
3. Check that the frontend is using the correct query

## Rollback Procedure

If you need to rollback the changes:

1. Run the rollback migration:
   ```bash
   supabase db reset
   ```
   
2. Or apply the specific rollback migration:
   ```bash
   supabase db push --file supabase/migrations/20250918010003_rollback_fixes.sql
   ```

3. Restore database from backup if needed

## Additional Notes

- The fixes ensure that new cars created by admins are automatically set to 'published' status
- The schema cache issues should be resolved after applying migrations and restarting PostgREST
- The atomic booking function prevents race conditions when multiple users try to book the same car
- All required database columns are now properly defined and indexed for performance