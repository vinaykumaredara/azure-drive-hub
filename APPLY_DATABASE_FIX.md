# How to Apply the Database Fix for Missing booking_status Column

This document provides step-by-step instructions to apply the database migration that adds the missing `booking_status` column to the `cars` table.

## Prerequisites
- Access to the Supabase project dashboard
- Admin privileges to run SQL queries

## Steps to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Log in with your credentials
   - Select your RP Cars project

2. **Navigate to SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click on "New Query" to create a new query window

3. **Copy and Run the Migration**
   - Copy the entire content of the file `supabase/migrations/20250917010000_add_booking_status_column.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

4. **Verify the Migration**
   - You can verify the migration was successful by running this query:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns 
   WHERE table_name = 'cars' 
     AND column_name IN ('booking_status', 'booked_by', 'booked_at');
   ```
   - You should see the three new columns listed

### Option 2: Using Supabase CLI (If Configured)

If you have the Supabase CLI properly configured:

1. **Apply the migration**
   ```bash
   npx supabase migration up
   ```

2. **Or apply a specific migration**
   ```bash
   npx supabase migration up 20250917010000
   ```

## What This Migration Does

The migration performs the following operations:

1. **Adds Columns**:
   - `booking_status` (TEXT, default: 'available')
   - `booked_by` (UUID, references users.id)
   - `booked_at` (TIMESTAMPTZ)

2. **Sets Default Values**:
   - Updates existing cars to have `booking_status = 'available'`

3. **Creates Indexes**:
   - `idx_cars_booking_status` on `booking_status`
   - `idx_cars_booked_by` on `booked_by`
   - `idx_cars_booked_at` on `booked_at`

4. **Updates RLS Policies**:
   - Modifies the `cars_select_public` policy to only show published and available cars

## Rollback (If Needed)

If you need to rollback this migration:

1. **Using Supabase Dashboard**:
   - Copy the content of `supabase/migrations/20250917010001_rollback_add_booking_status_column.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the rollback

2. **Using Supabase CLI**:
   ```bash
   npx supabase migration down 1
   ```

## Testing the Fix

After applying the migration:

1. **Restart your development server** (if running locally)
2. **Test the admin car upload functionality**
   - Log in as admin
   - Navigate to Admin Dashboard → Car Management
   - Try to add a new car
   - The operation should complete successfully without the "booking_status column" error

3. **Verify the fix with the verification script**:
   ```bash
   node verify-fixes.cjs
   ```
   - The script should now show "Success! booking_status column exists."

## Troubleshooting

### If you still get the "column does not exist" error:

1. **Check that the migration ran successfully**:
   - Run the verification query from step 4 above
   - Ensure all three columns are listed

2. **Refresh the Supabase schema cache**:
   - In Supabase dashboard, go to "Table Editor"
   - Click the refresh button or refresh the page
   - This ensures the frontend client has the latest schema

3. **Clear browser cache**:
   - Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
   - This ensures the frontend application gets the latest schema

### If you encounter RLS policy errors:

1. **Verify the policy was updated**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
   FROM pg_policies 
   WHERE tablename = 'cars';
   ```
   - Look for the `cars_select_public` policy with the correct condition

If you continue to experience issues, please contact the development team for assistance.