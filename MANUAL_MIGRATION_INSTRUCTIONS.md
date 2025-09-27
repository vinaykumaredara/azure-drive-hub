# Manual Currency Migration Instructions

Since we're experiencing schema cache issues, please follow these manual steps to apply the currency migration:

## Step 1: Apply the Database Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL script:

```sql
-- Add currency column to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add currency column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update existing rows with currency values
UPDATE public.cars SET currency = 'INR' WHERE currency IS NULL;
UPDATE public.bookings SET currency = 'INR' WHERE currency IS NULL;
UPDATE public.payments SET currency = 'INR' WHERE currency IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_currency ON cars(currency);
CREATE INDEX IF NOT EXISTS idx_bookings_currency ON bookings(currency);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);

-- Create auto-reload trigger function
CREATE OR REPLACE FUNCTION pgrst_reload_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- Create event trigger
DROP EVENT TRIGGER IF EXISTS pgrst_reload_on_ddl;
CREATE EVENT TRIGGER pgrst_reload_on_ddl
ON ddl_command_end
EXECUTE FUNCTION pgrst_reload_on_ddl();

-- Force a schema refresh
NOTIFY pgrst, 'reload schema';
```

4. Click **Run** to execute the script

## Step 2: Wait for Schema Cache Refresh

After running the script, wait 30-60 seconds for the schema cache to refresh completely.

## Step 3: Restart Supabase Project (If Needed)

If the schema cache doesn't refresh automatically:

1. Go to your Supabase dashboard
2. Navigate to **Settings** > **Database**
3. Click **Restart** to restart the database
4. Wait for the restart to complete (usually 1-2 minutes)

## Step 4: Verify the Migration

Run the verification script to confirm the migration was successful:

```bash
node final-verification.js
```

If all checks pass, you should see:

```
✅ All checks passed! The currency migration has been successfully applied.
```

## Step 5: Regenerate Supabase Types

Regenerate the Supabase types to include the new currency fields:

```bash
npm run gen:supabase-types
```

## Step 6: Build and Deploy

Build your application:

```bash
npm run build
```

Deploy to your hosting platform.

## Troubleshooting

### If Verification Still Fails

1. **Clear browser cache** and try again
2. **Restart your development server** if running locally
3. **Check Supabase logs** in the dashboard for any errors
4. **Verify the columns exist** by running this query in the SQL Editor:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name IN ('cars', 'bookings', 'payments') 
   AND column_name = 'currency';
   ```

### If Admin UI Still Shows Errors

1. **Hard refresh** the Admin UI (Ctrl+F5 or Cmd+Shift+R)
2. **Clear local storage** for the application
3. **Check browser console** for any JavaScript errors

## Security Notes

1. The SQL script uses `IF NOT EXISTS` clauses to prevent errors if run multiple times
2. The migration is idempotent and safe to run multiple times
3. Indexes are only created if they don't already exist
4. The trigger function and event trigger are safely recreated each time

## Rollback (If Needed)

If you need to rollback the changes, run this SQL script:

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_cars_currency;
DROP INDEX IF EXISTS idx_bookings_currency;
DROP INDEX IF EXISTS idx_payments_currency;

-- Drop currency column from payments table
ALTER TABLE public.payments DROP COLUMN IF EXISTS currency;

-- Drop currency column from bookings table
ALTER TABLE public.bookings DROP COLUMN IF EXISTS currency;

-- Drop currency column from cars table
ALTER TABLE public.cars DROP COLUMN IF EXISTS currency;

-- Drop event trigger
DROP EVENT TRIGGER IF EXISTS pgrst_reload_on_ddl;

-- Drop trigger function
DROP FUNCTION IF EXISTS pgrst_reload_on_ddl();
```