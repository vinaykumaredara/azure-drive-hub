# Image Handling Deployment Guide

This guide provides step-by-step instructions for deploying the updated image handling system.

## Prerequisites

Before deployment, ensure you have:
1. Supabase CLI installed
2. Access to the Supabase project
3. Environment variables configured
4. Edge Functions deployed

## Deployment Steps

### 1. Database Migrations

Run the database migrations in order:

```bash
# Migration to ensure image columns exist and are populated
supabase migration up 20250928010000

# Migration to fix bucket permissions and policies
supabase migration up 20250928020000
```

### 2. Edge Function Deployment

Deploy the delete-car Edge Function:

```bash
supabase functions deploy delete-car
```

### 3. Frontend Deployment

Deploy the updated frontend code using your preferred method (Vercel, Netlify, etc.).

## Environment Variables

Ensure the following environment variables are set:

### Client-side (.env)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Server-side (Supabase Dashboard)
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Verification

### 1. Test Image Upload

1. Log in to the admin panel
2. Create a new car with images
3. Verify images are uploaded to the `cars-photos` bucket
4. Verify `image_paths` and `image_urls` are stored in the database
5. Check that images display correctly in both admin and user interfaces

### 2. Test Image Display

1. Visit the user car listing page
2. Verify car images load correctly
3. Check browser console for any image loading errors
4. Test image carousel functionality

### 3. Test Image Deletion

1. Log in to the admin panel
2. Delete a car with images
3. Verify images are removed from the `cars-photos` bucket
4. Verify car record is removed from the database
5. Check Supabase logs for any errors

## Rollback Procedure

If issues are encountered after deployment:

### 1. Rollback Database Migrations

```bash
# Rollback the last two migrations
supabase migration down 2
```

### 2. Revert Code Changes

Revert to the previous version of the codebase.

### 3. Restore Edge Functions

Redeploy the previous version of the Edge Functions.

## Monitoring

### 1. Supabase Dashboard

Monitor:
- Storage usage
- Database query performance
- Function invocation logs

### 2. Application Logs

Check:
- Browser console for frontend errors
- Server logs for backend errors
- Network tab for failed image requests

## Troubleshooting

### Common Issues

1. **Images Not Displaying**
   - Check bucket permissions in Supabase Storage
   - Verify image URLs are correctly formed
   - Check RLS policies for storage objects

2. **Upload Failures**
   - Verify file size limits
   - Check authentication status
   - Review server logs for error details

3. **Deletion Failures**
   - Ensure Edge Function is deployed and accessible
   - Check admin permissions
   - Review server logs for error details

### Diagnostic Commands

1. **Check Database Schema**
   ```sql
   \d cars
   ```

2. **List Storage Objects**
   ```sql
   SELECT * FROM storage.objects WHERE bucket_id = 'cars-photos' LIMIT 10;
   ```

3. **Run Diagnostic Script**
   ```bash
   node comprehensive-image-diagnostic.js
   ```

## Maintenance

### Regular Tasks

1. **Orphan Cleanup**
   ```bash
   # Run monthly to remove unused images
   node scripts/cleanup-orphaned-images.js --dry-run
   node scripts/cleanup-orphaned-images.js
   ```

2. **Performance Monitoring**
   - Monitor image load times
   - Check for broken image links
   - Review storage usage

## Support

For issues with the image handling system, contact the development team with:
1. Detailed description of the issue
2. Steps to reproduce
3. Relevant logs and screenshots
4. Environment information