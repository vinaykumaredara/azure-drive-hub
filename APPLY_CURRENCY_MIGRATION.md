# Apply Currency Migration Solution

This document explains how to apply the currency migration solution to fix the "Failed to save car: Could not find the 'currency' column of 'cars' in the schema cache" error.

## Prerequisites

1. Access to your Supabase project dashboard
2. Node.js installed on your system
3. npm installed on your system

## Step-by-Step Instructions

### 1. Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the **service_role key** (not the anon key)

### 2. Configure Environment Variables

Update your `.env.local` file with your actual service key:

```bash
# .env.local
SUPABASE_SERVICE_KEY=your-actual-service-role-key-here
```

### 3. Apply the Solution

Run the solution application script:

```bash
node apply-solution.js
```

This script will:

- Add the `currency` column to the `cars`, `bookings`, and `payments` tables
- Set default value to 'INR' for all new records
- Update existing records with 'INR' as the currency
- Create indexes for better performance
- Set up automatic schema cache refresh
- Refresh the PostgREST schema cache

### 4. Wait for Schema Cache Refresh

After running the script, wait 30-60 seconds for the schema cache to refresh completely.

### 5. Verify the Solution

Run the verification script to confirm the migration was successful:

```bash
node final-verification.js
```

If all checks pass, you should see:

```
✅ All checks passed! The currency migration has been successfully applied.
```

### 6. Regenerate Supabase Types

Regenerate the Supabase types to include the new currency fields:

```bash
npm run gen:supabase-types
```

### 7. Build and Deploy

Build your application:

```bash
npm run build
```

Deploy to your hosting platform.

## Troubleshooting

### If Verification Fails

If the verification script shows that the currency column still doesn't exist:

1. Check that you've added your actual service key to `.env.local`
2. Ensure you waited 30-60 seconds after running the apply script
3. Try manually restarting your Supabase project from the dashboard

### If Admin UI Still Fails

If the Admin UI still shows the error after applying the migration:

1. Clear your browser cache
2. Restart your development server
3. Try in an incognito/private browsing window

## Security Notes

1. **Never commit your service key** to version control
2. The `.env.local` file is in `.gitignore` to prevent accidental commits
3. Rotate your service key regularly
4. Only use service keys in secure environments

## Rollback Plan

If you need to rollback the changes, you can use the rollback script:

```bash
SUPABASE_SERVICE_KEY=your-service-key-here node scripts/rollback-currency-migration.js
```

## Long-term Benefits

This solution not only fixes the immediate issue but also provides:

1. **Automatic Schema Cache Refresh**: No more manual restarts needed
2. **CI/CD Automation**: Consistent deployments with backup safety
3. **Type Safety**: Frontend always matches database schema
4. **Security**: Proper key handling and validation
5. **Monitoring**: Enhanced error reporting and debugging

## Support

If you encounter any issues, please check:

1. The console output of the scripts for detailed error messages
2. The Supabase project logs in the dashboard
3. Ensure your Supabase project is not paused or suspended