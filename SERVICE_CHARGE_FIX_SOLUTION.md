# Service Charge Column Fix Solution

## Problem Description

The admin UI fails when saving a car with the error:
```
failed to save car: Could not find the 'service_charge' column of 'cars' in the schema cache.
```

## Root Cause Analysis

1. **Migration Not Applied**: The migration file [20250913150000_add_service_charge.sql](file:///c:/Users/vinay/carrental/azure-drive-hub/supabase/migrations/20250913150000_add_service_charge.sql) exists locally but was not applied to the running database.

2. **Schema Cache Issue**: The PostgREST API does not see the service_charge column because:
   - The migration was not applied to the target Supabase project
   - The PostgREST schema cache is stale
   - The frontend is pointing at a different Supabase project or key

## Solution Steps

### 1. Apply the Migration

Run the migration script to add the service_charge column:

```bash
# First, add your Supabase service role key to .env
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env

# Then run the migration script
node scripts/apply-service-charge-migration.js
```

### 2. Force Schema Cache Refresh

If the column was just created but PostgREST still errors, run:

```sql
NOTIFY pgrst, 'reload schema';
```

This can be done in the Supabase SQL editor.

### 3. Verify the Fix

Run the verification script:

```bash
node scripts/verify-service-charge-migration.js
```

### 4. Regenerate Types and Rebuild

Regenerate the client types so TypeScript matches the DB:

```bash
npm run gen:supabase-types
# or
supabase gen types typescript --schema public > src/integrations/supabase/types.ts

# Then rebuild
npm run build
```

### 5. Test Admin Functionality

1. Restart dev server
2. Log in as admin
3. Try to create a car with service_charge
4. Confirm it works without errors

## Files Created

1. `scripts/apply-service-charge-migration.js` - Applies the migration
2. `scripts/verify-service-charge-migration.js` - Verifies the migration
3. `scripts/rollback-service-charge-migration.js` - Rolls back the migration (if needed)

## Rollback Plan

If anything goes wrong:

1. Run the rollback script:
   ```bash
   node scripts/rollback-service-charge-migration.js
   ```

2. Restore DB from backup if needed

3. Revert frontend to previous deployment

## CI/CD Enhancement

Add the following to your deployment workflow:

1. Create DB backup before migrations
2. Apply migrations using service role key
3. Regenerate types and rebuild frontend
4. Add event trigger for auto schema reload:

```sql
CREATE OR REPLACE FUNCTION pgrst_reload_on_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

CREATE EVENT TRIGGER pgrst_reload_on_ddl
ON ddl_command_end
EXECUTE FUNCTION pgrst_reload_on_ddl();
```

## Acceptance Criteria

- [ ] information_schema.columns returns service_charge for public.cars
- [ ] REST call GET /rest/v1/cars?select=service_charge works without schema-cache error
- [ ] Admin can create a car successfully via Admin UI with service_charge
- [ ] New car appears on user listing with correct service_charge
- [ ] Verification script passes
- [ ] CI includes protected migration job and backup step

## Deliverables

1. Output of SQL query listing service_charge in information_schema.columns
2. curl output from REST check
3. Confirmation that npm run gen:supabase-types and npm run build were run
4. Results of smoke tests: admin create, user listing, delete