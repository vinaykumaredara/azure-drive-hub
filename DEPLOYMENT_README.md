# Deployment Guide

This guide provides instructions for deploying the application with all the critical fixes applied.

## Prerequisites

1. Node.js 18+ installed
2. Supabase project set up
3. Environment variables configured

## Deployment Steps

### 1. Apply Database Migrations

Run the following migration to ensure the database has the required image columns:

```bash
supabase migration up
```

This will apply the migration `20250928144500_add_image_paths_urls_columns.sql` which adds:
- `image_paths` column (text array) to store storage paths
- `image_urls` column (text array) to store resolved URLs

### 2. Deploy Supabase Functions

Deploy the delete-car Edge Function:

```bash
supabase functions deploy delete-car
```

### 3. Verify Storage Bucket

Ensure the `cars-photos` storage bucket exists and has appropriate RLS policies:
- Public read access for published cars
- Admin write access for uploads and deletions

### 4. Build and Deploy Frontend

```bash
npm run build
```

Deploy the built files from the `dist` directory to your hosting provider.

## Environment Variables

Ensure the following environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Note: `SUPABASE_SERVICE_ROLE_KEY` should only be used server-side and never exposed to the client.

## Post-Deployment Verification

### 1. Check Image Display

1. Upload a test car with images
2. Verify images display correctly in both admin and user interfaces
3. Check browser DevTools for 200 HTTP responses on image requests

### 2. Test Delete Functionality

1. Create a test car with images
2. Use the admin interface to delete the car
3. Verify:
   - Car record is removed from database
   - Associated images are removed from storage
   - Success message is displayed

### 3. Run Cleanup Script

Periodically run the orphaned image cleanup script:

```bash
node scripts/cleanup-orphaned-images.js --dry-run
```

Once verified, actually delete orphaned images:

```bash
node scripts/cleanup-orphaned-images.js --delete
```

## Troubleshooting

### Build Issues

If you encounter build errors:

1. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

2. Reinstall dependencies:
   ```bash
   npm ci
   ```

3. Check TypeScript configuration:
   - Verify path aliases in `tsconfig.json`
   - Ensure Supabase functions are excluded from main tsconfig

### Image Display Issues

If images are not displaying:

1. Check browser DevTools Network tab for image requests
2. Verify HTTP status codes (should be 200 for successful requests)
3. Check storage bucket permissions
4. Verify `image_paths` and `image_urls` columns exist in database

### Delete Function Issues

If delete functionality is not working:

1. Check Supabase function logs:
   ```bash
   supabase functions logs delete-car
   ```

2. Verify service role key is correctly configured
3. Check RLS policies on `cars` table and `cars-photos` bucket

## Rollback Procedure

If issues are encountered after deployment:

1. Rollback database migrations:
   ```bash
   supabase migration down
   ```

2. Redeploy previous version of Edge Functions:
   ```bash
   supabase functions deploy delete-car --no-verify-jwt
   ```

3. Revert frontend deployment using your hosting provider's rollback mechanism

## Monitoring

Set up monitoring for:

1. Supabase function errors
2. Database performance
3. Storage usage
4. Frontend error rates

## Security Considerations

1. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
2. Regularly audit RLS policies
3. Monitor for unauthorized access attempts
4. Keep dependencies up to date