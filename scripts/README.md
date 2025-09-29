# Utility Scripts

This directory contains various utility scripts for maintaining and managing the car rental application.

## Orphaned Image Cleanup

The `cleanup-orphaned-images-simple.js` script identifies and removes orphaned image files in the cars-photos bucket that are no longer referenced by any car records in the database.

### Usage

First, ensure you have the required environment variables set:
```bash
export SUPABASE_URL=your_supabase_project_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Run in dry-run mode to see what would be deleted:
```bash
node scripts/cleanup-orphaned-images-simple.js --dry-run
```

Run to actually delete orphaned files:
```bash
node scripts/cleanup-orphaned-images-simple.js
```

### Safety

The script includes several safety features:
1. Dry-run mode to preview changes before making them
2. Batch processing to avoid overwhelming the Supabase API
3. Error handling and reporting
4. Progress logging

### Scheduling

It's recommended to run this script periodically (e.g., monthly) to keep storage clean and reduce costs.