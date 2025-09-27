# Currency Column Migration Guide

This guide explains how to fix the "Failed to save car: Could not find the 'currency' column of 'cars' in the schema cache" error.

## Problem Summary

The Admin UI is throwing an error because the `currency` column is missing from the `cars` table in your Supabase database. This could be because:

1. The migration that adds the `currency` column was not applied to your running Supabase project
2. PostgREST has a stale schema cache

## Solution Overview

We need to:
1. Backup the production database (required)
2. Apply the migration to add the `currency` column
3. Refresh the PostgREST schema cache

## Step-by-Step Instructions

### 1. Backup Production Database

Before making any changes, create a backup of your production database:

1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Under "Database Settings", click "Take Snapshot"
4. Give your snapshot a descriptive name (e.g., "pre-currency-migration-backup")
5. Wait for the snapshot to complete

Alternatively, if you have the service key, you can run our backup script:
```bash
SUPABASE_SERVICE_KEY=your-service-key-here node backup-database.js
```

### 2. Get Service Role Key

To apply the migration, you'll need the service role key:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role key" (not the anon key)
4. Keep this key secure and don't share it publicly

### 3. Apply the Currency Migration

Run the migration script with your service key:
```bash
SUPABASE_SERVICE_KEY=your-service-key-here node apply-currency-migration.js
```

This script will:
- Add the `currency` column to the `cars`, `bookings`, and `payments` tables
- Set default value to 'INR' for all new records
- Update existing records with 'INR' as the currency
- Create indexes for better performance
- Refresh the PostgREST schema cache

### 4. Verify the Migration

After running the migration, verify it was successful:
```bash
node verify-currency-migration.js
```

This script will check:
- Whether the `currency` column exists in all tables
- Whether the indexes were created
- Sample values from the currency column

### 5. Test the Admin UI

1. Restart your development server if it's running
2. Open the Admin UI
3. Try to save a car - the error should be resolved

## If Something Goes Wrong

If you need to rollback the changes, you can use the rollback script:
```bash
SUPABASE_SERVICE_KEY=your-service-key-here node rollback-currency-migration.js
```

## Manual SQL Commands

If you prefer to run the SQL commands manually, you can use these:

```sql
-- Add currency column to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update existing rows with currency value
UPDATE public.cars 
SET currency = 'INR' 
WHERE currency IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

## Troubleshooting

### Schema Cache Still Not Refreshing

If the error persists after running the migration:

1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Click "Restart" to restart the database
4. Wait 30-60 seconds for the restart to complete

### Permission Errors

If you get permission errors, make sure you're using the service_role key, not the anon key.

### Column Already Exists

If you get an error that the column already exists, that's fine - the migration uses `IF NOT EXISTS` so it's safe to run multiple times.