# Immediate Fix Instructions for Service Charge Error

## Current Status
❌ **Issue Confirmed**: The service_charge column is missing from the database schema cache.

## Immediate Action Required

### Step 1: Get Your Supabase Service Role Key
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Service Role Key" (not the anon key)

### Step 2: Add Key to Environment
Create or update your `.env` file:
```bash
echo SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key >> .env
```

### Step 3: Apply the Fix
Run the migration script:
```bash
node scripts/apply-service-charge-migration.js
```

This will:
- Add the service_charge column to your cars table
- Set default value of 0 for all cars
- Automatically refresh the PostgREST schema cache

### Step 4: Verify the Fix
Run the verification script:
```bash
node scripts/comprehensive-service-charge-verification.js
```

You should see:
```
✅ All tests passed! The service_charge column fix is working correctly.
```

### Step 5: Update Your Types and Restart
```bash
npm run gen:supabase-types
npm run dev
```

### Step 6: Test Admin Functionality
1. Log in to admin dashboard
2. Try to create a car with service_charge
3. Confirm it saves without errors

## If You Still Have Issues

1. **Restart Supabase Project**:
   - Supabase Dashboard > Settings > Database > Restart

2. **Manual Schema Refresh**:
   - Supabase SQL Editor > Run: `NOTIFY pgrst, 'reload schema';`

3. **Check Column Exists**:
   - Supabase SQL Editor > Run:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'cars' 
     AND column_name = 'service_charge';
   ```

## Rollback (If Needed)
⚠️ **Warning**: This will remove all service_charge data!
```bash
node scripts/rollback-service-charge-migration.js
```

## Support
If issues persist, contact support with:
1. Output of verification script
2. Supabase project reference
3. Error messages from admin UI