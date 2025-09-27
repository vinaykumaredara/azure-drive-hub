# Currency Migration - Next Steps

You've successfully verified your Supabase service key. Now follow these steps to complete the currency migration:

## Step 1: Apply the Database Migration

1. Open the file `currency-migration.sql` in this directory
2. Copy the entire contents of the file
3. Go to your Supabase dashboard
4. Navigate to **SQL Editor**
5. Paste the SQL script
6. Click **Run** to execute the script

## Step 2: Wait for Schema Cache Refresh

After running the script, wait 30-60 seconds for the schema cache to refresh completely.

## Step 3: Verify the Migration

Run the verification script to confirm the migration was successful:

```bash
node final-verification.js
```

You should see output similar to:
```
🔍 Final Verification of Currency Migration
==========================================

1. Checking if currency column exists in cars table...
✅ Currency column exists in cars table

2. Checking if currency column exists in bookings table...
✅ Currency column exists in bookings table

3. Checking if currency column exists in payments table...
✅ Currency column exists in payments table

4. Testing REST endpoint...
✅ REST endpoint is working correctly

📊 Final Verification Summary:
==============================
✅ All checks passed! The currency migration has been successfully applied.
```

## Step 4: Regenerate Supabase Types

Regenerate the Supabase types to include the new currency fields:

```bash
npm run gen:supabase-types
```

## Step 5: Build and Deploy

Build your application:

```bash
npm run build
```

Deploy to your hosting platform.

## Troubleshooting

### If Verification Still Fails After 60 Seconds

1. **Restart your Supabase project**:
   - Go to Supabase dashboard
   - Navigate to Settings > Database
   - Click "Restart"

2. **Check the columns exist** by running this query in the SQL Editor:
   ```sql
   SELECT table_name, column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND column_name = 'currency'
   ORDER BY table_name;
   ```

### If Admin UI Still Shows Errors

1. **Hard refresh** the Admin UI (Ctrl+F5 or Cmd+Shift+R)
2. **Clear local storage** for the application
3. **Check browser console** for any JavaScript errors

## Files in This Directory

- `currency-migration.sql` - The SQL migration script to run in Supabase
- `MANUAL_MIGRATION_INSTRUCTIONS.md` - Detailed manual migration instructions
- `final-verification.js` - Script to verify the migration was successful
- `.env.local` - Contains your service key (keep this secure!)

## Security Reminder

- **Never commit your service key** to version control
- `.env.local` is in `.gitignore` to prevent accidental commits
- Rotate your service key regularly for security

## Rollback (If Needed)

If you need to rollback the changes, see the rollback section in `MANUAL_MIGRATION_INSTRUCTIONS.md`.

## Support

If you encounter any issues:
1. Check the console output of the scripts for detailed error messages
2. Verify your Supabase project is not paused or suspended
3. Ensure you're using the correct service role key (not the anon key)