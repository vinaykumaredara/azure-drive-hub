# Azure Drive Hub - Deployment Instructions

This document provides step-by-step instructions to deploy all the fixes implemented for the Azure Drive Hub car rental application.

## Prerequisites

Before deploying, ensure you have:
1. Supabase CLI installed
2. Proper environment variables set up
3. Database connection access

## Deployment Steps

### 1. Apply Database Migrations

Apply all the new migrations to update the database schema:

```bash
# Navigate to the project directory
cd azure-drive-hub

# Apply migrations
supabase db push
```

This will apply the following migrations:
- `20250920010000_ensure_currency_column_exists.sql`
- `20250920020000_fix_rls_policies.sql`

### 2. Refresh Schema Cache

If you still encounter schema cache errors after applying migrations, you need to refresh the PostgREST schema cache:

**Option 1: Using SQL (if you have service role access)**
```sql
NOTIFY pgrst, 'reload schema';
```

**Option 2: Restart Supabase Project**
- Go to your Supabase project dashboard
- Navigate to Settings > Database
- Click "Restart" to restart the database

**Option 3: Run the refresh script**
```bash
node scripts/refresh-postgrest-cache.js
```

### 3. Regenerate Supabase Types

Update the TypeScript types to include the new columns:

```bash
npm run gen:supabase-types
```

### 4. Restart Development Server

Restart the Vite development server to ensure all changes are loaded:

```bash
npm run dev
```

### 5. Verify Deployment

Run the verification scripts to ensure everything is working correctly:

```bash
# Verify RLS policies
npm run verify:rls

# Run smoke tests
npm run test:smoke

# Final verification
node scripts/final-verification.js
```

## Troubleshooting

### Schema Cache Issues

If you still see "Could not find the 'currency' column" errors:

1. Double-check that migrations were applied:
   ```bash
   supabase db push
   ```

2. Manually verify the column exists:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'cars' AND column_name = 'currency';
   ```

3. Force refresh the schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### RLS Policy Issues

If admin users cannot insert cars:

1. Verify the is_admin column exists:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'is_admin';
   ```

2. Check that your user account has is_admin = true:
   ```sql
   SELECT id, email, is_admin FROM users WHERE id = 'YOUR_USER_ID';
   ```

3. If needed, manually set is_admin for your user:
   ```sql
   UPDATE users SET is_admin = true WHERE id = 'YOUR_USER_ID';
   ```

### Performance Issues

If queries are still slow:

1. Verify indexes were created:
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'cars';
   ```

2. Check that you're using planned counts instead of exact counts in your queries

## Rollback Plan

If issues occur after deployment:

1. **Database Rollback**:
   ```bash
   # If you have a backup
   supabase db reset
   
   # Or manually drop the added columns
   ALTER TABLE cars DROP COLUMN IF EXISTS currency;
   ALTER TABLE bookings DROP COLUMN IF EXISTS currency;
   ALTER TABLE payments DROP COLUMN IF EXISTS currency;
   ```

2. **Code Rollback**:
   ```bash
   git checkout HEAD~1
   ```

3. **Restart Services**:
   ```bash
   # Restart Supabase project from dashboard
   # Restart development server
   npm run dev
   ```

## Post-Deployment Verification

After deployment, verify that:

1. ✅ Admins can create cars with images
2. ✅ Cars appear immediately on both admin and user dashboards
3. ✅ Images are visible to all users
4. ✅ No schema cache errors occur
5. ✅ Performance is improved (queries complete in < 2 seconds)
6. ✅ RLS policies are working correctly (admins can modify, public can only view)

## Monitoring

Monitor the application after deployment for:

1. Error logs in the browser console
2. Network tab for failed requests
3. Database performance metrics
4. User feedback on car listing speed

If everything is working correctly, the schema cache error should be resolved and the application should have improved performance and functionality.