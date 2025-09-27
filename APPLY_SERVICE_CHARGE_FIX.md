# How to Apply the Service Charge Fix

## Overview

This guide explains how to fix the "service_charge column not found" error in the Admin UI when saving cars.

## Prerequisites

1. Supabase Service Role Key (found in your Supabase project dashboard)
2. Node.js installed
3. Supabase CLI installed (optional but recommended)

## Step-by-Step Fix

### 1. Add Service Role Key to Environment

Create or update your `.env` file with your Supabase Service Role Key:

```bash
echo "SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key" >> .env
```

### 2. Apply the Migration

Run the migration script to add the service_charge column:

```bash
node scripts/apply-service-charge-migration.js
```

This script will:
- Add the service_charge column to the cars table
- Set default value to 0
- Backfill existing records
- Notify PostgREST to reload schema cache

### 3. Verify the Migration

Run the verification script to confirm the fix:

```bash
node scripts/verify-service-charge-migration.js
```

### 4. Regenerate Supabase Types

Update your TypeScript types to include the new column:

```bash
npm run gen:supabase-types
```

### 5. Restart Development Server

```bash
npm run dev
```

### 6. Test Admin Functionality

1. Log in as admin
2. Navigate to Admin Dashboard → Cars Management
3. Try to create a new car with service_charge
4. Confirm it saves successfully

## Manual SQL Approach (Alternative)

If you prefer to apply the migration manually:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Add service_charge column to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS service_charge NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.cars.service_charge IS 'Optional service charge amount to be added to booking total (replaces GST)';

-- Update existing cars to have 0 service charge if null
UPDATE public.cars 
SET service_charge = 0 
WHERE service_charge IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
```

4. Wait 30-60 seconds for schema cache to refresh

## Troubleshooting

### If the Error Persists

1. **Restart Supabase Project**:
   - Go to Supabase Dashboard
   - Settings > Database
   - Click "Restart"

2. **Force Schema Refresh**:
   - In SQL Editor, run: `NOTIFY pgrst, 'reload schema';`

3. **Check Column Existence**:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'cars' 
     AND column_name = 'service_charge';
   ```

### If You Need to Rollback

**⚠️ WARNING: This will remove all service_charge data**

```bash
node scripts/rollback-service-charge-migration.js
```

## CI/CD Integration

For production deployments, add this to your deployment workflow:

1. Backup database
2. Apply migrations
3. Regenerate types
4. Deploy frontend

Example GitHub Actions job:

```yaml
- name: Apply database migrations
  run: npx supabase migration up
  
- name: Regenerate Supabase types
  run: npm run gen:supabase-types
  
- name: Build frontend
  run: npm run build
  
- name: Deploy to Netlify
  run: # your deployment command
```

## Verification Checklist

Before considering the fix complete:

- [ ] Admin can create cars with service_charge
- [ ] User can view cars with service_charge
- [ ] Schema verification script passes
- [ ] Types are regenerated
- [ ] Frontend is redeployed
- [ ] Smoke tests pass

## Support

If you continue to experience issues:

1. Check Supabase project logs
2. Verify environment variables
3. Confirm you're using the correct project reference
4. Contact support with the output of:
   ```bash
   node scripts/check-service-charge-column.js
   ```