# Environment Setup for Azure Drive Hub

This document provides instructions for setting up the environment variables required for the Azure Drive Hub application.

## Required Environment Variables

### Supabase Configuration

```env
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase Public API Key (anon key)
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_KEY=your-service-key
```

## Database Migration

To apply the latest database schema changes, run:

```bash
# Navigate to your project directory
cd azure-drive-hub

# Apply migrations
npx supabase migration up
```

## Performance Optimization

The application now includes performance optimizations:

1. **Pagination**: Car listings are now paginated to reduce load times
2. **Database Indexes**: Added indexes for faster querying
3. **Error Handling**: Improved error handling for missing columns

## Troubleshooting

### "Unknown Column" Errors

If you encounter "unknown column 'booking_status'" errors:

1. Verify the database schema:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'cars' AND column_name = 'booking_status';
   ```

2. If the column doesn't exist, apply the latest migrations:
   ```bash
   npx supabase migration up
   ```

### Performance Issues

If the site is still loading slowly:

1. Check that the performance indexes were created:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'cars';
   ```

2. Monitor query performance in the Supabase dashboard

3. Consider implementing caching for frequently accessed data

## Development vs Production

Make sure to use different environment variables for development and production:

### Development (.env.local)
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_KEY=your-dev-service-key
```

### Production (.env.production)
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_KEY=your-prod-service-key
```