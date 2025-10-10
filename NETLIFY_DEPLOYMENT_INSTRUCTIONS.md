# Netlify Deployment Instructions

## Critical Steps to Fix Blank Screen Issue

To resolve the blank screen issue on Netlify, you must configure the required environment variables in your Netlify dashboard.

### 1. Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to "Site settings" → "Build & deploy" → "Environment"
4. Add these environment variables:

| Variable Name                 | Description                 | Example Value                             |
| ----------------------------- | --------------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`           | Your Supabase project URL   | `https://your-project.supabase.co`        |
| `VITE_SUPABASE_ANON_KEY`      | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_RAZORPAY_KEY_ID`        | Your Razorpay key ID        | `rzp_live_XXXXXXXXXXXXXX`                 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key | `pk_live_XXXXXXXXXXXXXXXXXXXXXXXX`        |

**Important Notes:**

- All variables must be prefixed with `VITE_` to be accessible in the frontend
- These variables are required for the application to function properly
- Without these variables, the app will show a blank screen

### 2. Clear Cache and Redeploy

After setting the environment variables:

1. Go to the "Deploys" tab in your Netlify dashboard
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for the deployment to complete

### 3. Verify the Deployment

1. Check the build logs for any errors
2. Once deployed, visit your site and open the browser console (F12)
3. Look for messages confirming that environment variables are loaded:
   - "All required environment variables are present"
   - "✅ RP Cars app rendered successfully"

### 4. Troubleshooting

If you still see a blank screen:

1. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for error messages
   - Check if environment variables are being loaded

2. **Check Network Tab:**
   - Press F12 → Network tab
   - Reload the page
   - Look for 404 errors on JS/CSS files

3. **Verify Service Worker:**
   - The service worker has been disabled in our code
   - In Application tab, the Service Workers section should be empty

4. **Try Incognito Mode:**
   - Open your site in an incognito/private window
   - This ensures no cached files are interfering

### 5. Why This Fixes the Issue

1. **Environment Variables:**
   - Your application relies on VITE environment variables for critical functionality
   - Supabase integration requires URL and ANON key
   - Payment processing requires Razorpay and Stripe keys

2. **Service Worker:**
   - We've disabled the service worker to prevent caching issues
   - This ensures you always get the latest version of the app

3. **Build Process:**
   - We've updated the Netlify configuration to use pnpm for consistency with local development

### 6. Additional Security Considerations

- Never expose secret keys (like Supabase Service Role Key) in VITE environment variables
- Only use public keys that are safe to expose to the frontend
- VITE environment variables are embedded in the client-side bundle and are visible to users

For any issues, please contact the development team with:

1. Netlify deploy logs
2. Browser console output
3. Network tab failures
