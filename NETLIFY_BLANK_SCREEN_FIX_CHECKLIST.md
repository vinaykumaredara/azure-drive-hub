# Netlify Blank Screen Fix Checklist

This checklist outlines the exact steps needed to resolve the blank screen issue on Netlify deployment.

## ✅ Critical Action Items

### 1. Set Environment Variables in Netlify (MANDATORY)

Go to your Netlify dashboard and configure these environment variables:

**Location:** Site settings → Build & deploy → Environment

| Variable Name                 | Required | Description                 | Example Value                             |
| ----------------------------- | -------- | --------------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`           | ✅       | Your Supabase project URL   | `https://your-project.supabase.co`        |
| `VITE_SUPABASE_ANON_KEY`      | ✅       | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_RAZORPAY_KEY_ID`        | ✅       | Your Razorpay key ID        | `rzp_live_XXXXXXXXXXXXXX`                 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅       | Your Stripe publishable key | `pk_live_XXXXXXXXXXXXXXXXXXXXXXXX`        |

**Important Notes:**

- All variables MUST be prefixed with `VITE_` to be accessible in the frontend
- These variables are CRITICAL for the application to function
- Without these variables, the app will show a blank screen

### 2. Clear Cache and Redeploy

After setting the environment variables:

1. Go to the "Deploys" tab in your Netlify dashboard
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for the deployment to complete (usually 2-5 minutes)

### 3. Monitor the Deployment

Watch the build logs for any errors:

1. Netlify dashboard → Deploys → Latest deploy → Build logs
2. Look for "✅ All required environment variables are present" message
3. Ensure the build completes successfully

## 🔍 Why This Fixes the Issue

### Environment Variables

Your application relies on VITE environment variables for critical functionality:

- **Supabase Integration**: Database and authentication
- **Payment Processing**: Razorpay and Stripe payments
- **API Connections**: External service integrations

Without these variables, the app fails silently and shows a blank screen.

### Service Worker

We've already disabled the service worker in our code to prevent caching issues:

- Service worker registration is commented out in [src/main.tsx](file:///c%3A/Users/vinay/carrental/azure-drive-hub/src/main.tsx)
- This ensures you always get the latest version of the app

### Build Process

We've updated the Netlify configuration to use pnpm for consistency with local development:

- Build command: `pnpm install && pnpm run build`
- Node version: 20.19.0

## 🧪 Verification Steps

### Before Deployment

- [ ] Run `npm run verify:env` locally to check environment variables
- [ ] Ensure all VITE\_ variables are set in your local .env file

### After Deployment

- [ ] Check Netlify build logs for successful completion
- [ ] Visit your site and open browser console (F12)
- [ ] Look for these messages in the console:
  - "✅ All required environment variables are present"
  - "✅ RP Cars app rendered successfully"
- [ ] Verify no errors in the console

## 🚨 If Issues Persist

If you still see a blank screen after following these steps:

### 1. Check Browser Console

- Press F12 → Console tab
- Look for error messages
- Check if environment variables are being loaded

### 2. Check Network Tab

- Press F12 → Network tab
- Reload the page
- Look for 404 errors on JS/CSS files

### 3. Verify Service Worker

- The service worker has been disabled in our code
- In Application tab, the Service Workers section should be empty

### 4. Try Incognito Mode

- Open your site in an incognito/private window
- This ensures no cached files are interfering

## 📞 Support Information

If you continue to experience issues after following these steps, please provide:

1. **Netlify deploy logs**
2. **Browser console output** (first 200 lines)
3. **Network tab failures** (404/500 errors)
4. **Screenshot of Application → Service Workers tab**
5. **Screenshot of Application → Cache Storage tab**

## 📋 Quick Reference

### Netlify Dashboard Navigation

```
1. Go to https://netlify.com
2. Log in to your account
3. Select your site
4. Site settings → Build & deploy → Environment (for variables)
5. Deploys tab (for clearing cache and redeploying)
```

### Required Environment Variables Summary

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Deployment Command Sequence

```
1. Set environment variables in Netlify dashboard
2. Go to Deploys tab
3. Click "Trigger deploy" → "Clear cache and deploy site"
4. Wait for deployment to complete
5. Verify site is working
```

---

**This fix addresses the root cause of the blank screen issue. The key is ensuring all required VITE environment variables are properly configured in Netlify.**
