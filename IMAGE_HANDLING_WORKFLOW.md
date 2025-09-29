# Image Handling Workflow Documentation

This document describes the complete image handling workflow for the car rental application, including upload, storage, display, and deletion of car images.

## Overview

The image handling system ensures that car images are properly uploaded to Supabase Storage, stored with both paths and URLs in the database, displayed correctly in both admin and user interfaces, and securely deleted when cars are removed.

## Architecture

### Components

1. **Frontend Components**:
   - `AdminCarManagement.tsx` - Admin interface for uploading and managing car images
   - `UserCarListing.tsx` - User interface for browsing cars with images
   - `CarCard.tsx` - Display component for individual cars
   - `ImageCarousel.tsx` - Carousel component for multiple car images
   - `LazyImage.tsx` - Lazy-loaded image component with fallback handling

2. **Utility Functions**:
   - `imageCrudUtils.ts` - Core image upload/download/delete operations
   - `carImageUtils.ts` - Image URL resolution and validation
   - `adminImageUtils.ts` - Admin-specific image handling
   - `imageDisplayUtils.ts` - Image data standardization for UI

3. **Services**:
   - `CarService.ts` - Business logic for car management with image handling
   - `delete-car` Edge Function - Secure server-side deletion

4. **Database**:
   - `cars` table with `image_urls` and `image_paths` columns
   - `cars-photos` storage bucket

## Workflow

### 1. Image Upload

When an admin uploads images for a car:

1. **File Processing**:
   - Images are validated to ensure they are valid image files
   - Each image is given a deterministic name: `cars/{carId}/{timestamp}_{uuid}.{ext}`
   - Images are uploaded to the `cars-photos` bucket with cache control headers

2. **Database Storage**:
   - Both storage paths and public URLs are generated
   - Paths are stored in the `image_paths` column
   - Public URLs are stored in the `image_urls` column
   - Both columns are arrays to support multiple images per car

3. **Error Handling**:
   - If database insertion fails, uploaded images are automatically cleaned up
   - If image upload fails, the database operation is aborted

### 2. Image Display

When displaying cars to users or admins:

1. **Data Fetching**:
   - Car data is fetched from the database including `image_urls` and `image_paths`
   - Both admin and user interfaces use the same data structure

2. **Image Resolution**:
   - UI components receive standardized image data through mapping functions
   - Each image URL is validated for accessibility
   - Fallback images are provided for missing or invalid images

3. **Display Components**:
   - `CarCard` receives an `images` array and `thumbnail` for display
   - `ImageCarousel` handles multiple images with navigation
   - `LazyImage` provides lazy loading with error handling

### 3. Image Deletion

When deleting a car:

1. **Server-Side Deletion**:
   - Admin interface calls the `delete-car` Edge Function
   - Edge Function authenticates the admin user
   - Image paths are fetched from the database
   - Images are removed from storage using the paths
   - Car record is deleted from the database
   - Operation is atomic - if storage deletion fails, database deletion is aborted

2. **Orphan Cleanup**:
   - `cleanup-orphaned-images.js` script identifies and removes unused images
   - Script can run in dry-run mode for safety
   - Should be run periodically to maintain storage efficiency

## Security

### Access Control

1. **Bucket Permissions**:
   - `cars-photos` bucket is set to public for image access
   - RLS policies control who can upload/update/delete images

2. **Deletion Security**:
   - Client-side deletion is disabled
   - All deletions must go through the server-side Edge Function
   - Edge Function validates admin permissions before deletion

### Data Protection

1. **Path Storage**:
   - Storage paths are kept separate from public URLs
   - Paths are used for reliable deletion operations
   - URLs are used for direct image access

2. **Service Role Key**:
   - Service role key is only used in Edge Functions
   - Never exposed to client-side code
   - Required for storage operations in server-side code

## Deployment

### Migration Steps

1. **Database Migration**:
   ```sql
   ALTER TABLE public.cars
     ADD COLUMN IF NOT EXISTS image_paths TEXT[],
     ADD COLUMN IF NOT EXISTS image_urls TEXT[];
   ```

2. **Bucket Configuration**:
   - Ensure `cars-photos` bucket exists and is public
   - Verify RLS policies are correctly configured

3. **Edge Function Deployment**:
   - Deploy the `delete-car` Edge Function
   - Verify the function URL is accessible

### Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Troubleshooting

### Common Issues

1. **Images Not Displaying**:
   - Check bucket permissions
   - Verify image URLs are accessible
   - Check browser console for network errors

2. **Upload Failures**:
   - Verify file size limits
   - Check authentication status
   - Review server logs for error details

3. **Deletion Failures**:
   - Ensure Edge Function is deployed and accessible
   - Check admin permissions
   - Review server logs for error details

### Diagnostic Scripts

1. **Image Diagnostic**:
   ```bash
   node comprehensive-image-diagnostic.js
   ```

2. **Orphan Cleanup**:
   ```bash
   # Dry run first
   node scripts/cleanup-orphaned-images.js --dry-run
   
   # Actual cleanup
   node scripts/cleanup-orphaned-images.js
   ```

## Testing

### Unit Tests

Unit tests are located in `src/__tests__/` and cover:
- Image upload functionality
- URL resolution and validation
- Error handling scenarios

### Integration Tests

Integration tests verify:
- End-to-end upload and display workflow
- Deletion workflow with storage cleanup
- Edge Function functionality

## Maintenance

### Regular Tasks

1. **Orphan Cleanup**:
   - Run monthly to remove unused images
   - Always use dry-run mode first

2. **Performance Monitoring**:
   - Monitor image load times
   - Check for broken image links
   - Review storage usage

### Updates

When updating the image handling system:
1. Test all workflows in staging environment
2. Run database migrations before deploying code
3. Verify Edge Functions are updated
4. Test both admin and user interfaces