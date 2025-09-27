# Setup Instructions for Currency Migration Solution

## Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role key" (not the anon key)

## Step 2: Configure Environment Variables

Update your `.env.local` file with your actual service key:

```bash
# .env.local
SUPABASE_SERVICE_KEY=your-actual-service-role-key-here
```

## Step 3: Apply the Solution

Run the solution application script:

```bash
node apply-solution.js
```

## Step 4: Verify the Solution

After the migration is applied, verify it worked:

```bash
node comprehensive-verification.js
```

## Step 5: Regenerate Types and Deploy

```bash
npm run gen:supabase-types
npm run build
# Deploy to your hosting platform
```

## Important Security Notes

1. **Never commit your service key** to version control
2. The `.env.local` file is in `.gitignore` to prevent accidental commits
3. Rotate your service key regularly
4. Only use service keys in secure environments