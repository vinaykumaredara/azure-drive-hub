# How to Run the Image URL Repair Script

## Overview

The `repair-image-urls.js` script is designed to fix existing database entries where `image_urls` might be stored as strings instead of arrays, or where the URLs need to be converted from paths to public URLs.

## Prerequisites

1. Ensure you have the necessary environment variables set:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (NOT the anon/public key)

2. Make sure you're in the project root directory

## Running the Script

### Option 1: Set environment variables temporarily

```bash
SUPABASE_URL=your_supabase_url SUPABASE_SERVICE_KEY=your_service_key node scripts/repair-image-urls.js
```

### Option 2: Set environment variables in your shell

For Unix/Linux/Mac:
```bash
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_KEY=your_service_key
node scripts/repair-image-urls.js
```

For Windows (Command Prompt):
```cmd
set SUPABASE_URL=your_supabase_url
set SUPABASE_SERVICE_KEY=your_service_key
node scripts/repair-image-urls.js
```

For Windows (PowerShell):
```powershell
$env:SUPABASE_URL="your_supabase_url"
$env:SUPABASE_SERVICE_KEY="your_service_key"
node scripts/repair-image-urls.js
```

### Option 3: Create a .env file

Create a `.env` file in your project root with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

Then run:
```bash
node -r dotenv/config scripts/repair-image-urls.js
```

## What the Script Does

1. Fetches all cars from the database
2. For each car:
   - If `image_urls` is a string, converts it to an array
   - If `image_urls` is empty but `image_paths` exist, converts paths to public URLs
   - Updates the database with the corrected `image_urls` array
3. Reports the number of cars updated

## Security Notes

- Always use the service role key, not the anon/public key
- Run this script only on a secure machine
- Never commit your service key to version control
- Consider running this script during maintenance windows

## Troubleshooting

If you see errors:
- Check that your SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
- Ensure your service key has the necessary permissions
- Verify your network connection to Supabase

If the script runs but doesn't update any cars:
- There may be no cars needing repair
- Check the console output for details