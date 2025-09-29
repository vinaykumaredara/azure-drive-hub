# Car Image Management System - Deployment Guide

This document provides instructions for deploying the enhanced car image management system with reliable image storage and deletion.

## Overview

The system implements a robust solution for managing car images in Supabase Storage with the following key features:

1. **Reliable Image Storage**: Images are stored with both public URLs (for display) and storage paths (for deletion)
2. **Secure Deletion**: Server-side Edge Function ensures images and database records are deleted atomically
3. **Orphaned File Cleanup**: One-time script to remove unused files from storage
4. **Enhanced Error Handling**: Comprehensive logging for troubleshooting

## Prerequisites

- Supabase project with `cars` table
- Supabase Storage bucket named `cars-photos`
- Supabase Service Role Key (for server-side operations)
- Node.js environment for running scripts

## Environment Variables

Set the following environment variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
VITE_APP_URL=http://localhost:5173
```

## Database Migration

Run the database migration to add the `image_paths` column:

```sql
-- Ensure image_paths column exists in cars table for storing file paths separately from URLs
-- This migration ensures that both image_urls (for quick frontend load) and image_paths (for deletion) are stored

-- Add image_paths column to cars table if it doesn't exist
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS image_paths TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.cars.image_paths IS 'Storage paths for car images in cars-photos bucket';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_image_paths ON public.cars USING GIN (image_paths);

-- Update existing cars to populate image_paths from image_urls if needed
-- This will extract paths from existing URLs and populate the image_paths column
UPDATE public.cars 
SET image_paths = ARRAY(
  SELECT 
    CASE 
      WHEN image_url LIKE 'http%storage/v1/object/public/cars-photos/%' THEN
        SUBSTRING(image_url FROM POSITION('/cars-photos/' IN image_url) + 13)
      WHEN image_url LIKE 'http%storage/v1/object/authenticated/cars-photos/%' THEN
        SUBSTRING(image_url FROM POSITION('/cars-photos/' IN image_url) + 13)
      ELSE image_url
    END
  FROM unnest(image_urls) AS image_url
)
WHERE image_paths IS NULL AND image_urls IS NOT NULL AND array_length(image_urls, 1) > 0;

-- Ensure the cars-photos bucket is public for image access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cars-photos';
```

## Edge Function Deployment

Deploy the `delete-car` Edge Function for secure server-side deletion:

1. Navigate to the Supabase Dashboard
2. Go to Functions > Create Function
3. Name the function `delete-car`
4. Copy the contents of `supabase/functions/delete-car/index.ts` into the function editor
5. Set the environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY` (from your Supabase project settings)

## Usage

### Image Upload Flow

When uploading images through the admin interface:

1. Images are uploaded to the `cars-photos` bucket with unique paths
2. Both `image_paths` (storage paths) and `image_urls` (public URLs) are stored in the database
3. The frontend components display images using the `image_urls` for quick loading

### Image Display

Frontend components automatically handle image display:

- Admin dashboard shows all car images in a carousel
- User dashboard displays car thumbnails and detailed image views
- Components use standardized image data for consistent rendering

### Image Deletion

When deleting a car:

1. The admin interface calls the server-side Edge Function
2. The Edge Function retrieves image paths from the database
3. Images are removed from Supabase Storage using the paths
4. The car record is deleted from the database
5. If any step fails, detailed error logging helps with troubleshooting

## Orphaned File Cleanup

Run the cleanup script periodically to remove orphaned files:

```bash
# Set environment variables
export SUPABASE_URL=your_supabase_project_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run the cleanup script
node scripts/cleanup-orphaned-images.js
```

The script will:
1. List all objects in the `cars-photos` bucket
2. Collect all image_paths referenced in the cars table
3. Identify and remove objects not referenced by any car
4. Prompt for confirmation before deletion

## Security Considerations

- Service Role Key is only used server-side in the Edge Function
- Client-side operations use the Anon Key with limited permissions
- Edge Function validates authentication before processing deletions
- Storage bucket permissions are configured for public read access

## Troubleshooting

### Images Not Displaying

1. Check that `image_urls` contain valid public URLs
2. Verify the `cars-photos` bucket is set to public
3. Ensure images exist in the storage bucket
4. Check browser console for network errors

### Deletion Failures

1. Check Edge Function logs in Supabase Dashboard
2. Verify Service Role Key is correctly configured
3. Confirm image_paths contain valid storage paths
4. Check for network connectivity issues

### Orphaned Files

1. Run the cleanup script to identify orphaned files
2. Review the script output for files that should be retained
3. Manually verify important files before deletion

## Rollback Plan

If issues occur after deployment:

1. Restore the database from backup
2. Do not run the orphan cleanup script until new deletion flow is verified
3. If files were accidentally deleted, restore from storage backups if available
4. Revert to the previous version by redeploying the original code

## Testing

Run the test suite to verify functionality:

```bash
npm test
```

The tests cover:
- Image upload flow (both paths and URLs storage)
- Image display in frontend components
- Deletion flow (database and storage cleanup)
- Orphaned file identification