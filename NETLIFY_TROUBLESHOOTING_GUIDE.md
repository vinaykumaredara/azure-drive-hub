# Netlify Troubleshooting Guide

## Current Status
- GitHub repository is updated with all fixes
- Code has been pushed to the `fix/ci-netlify-qoder` branch
- Netlify is still showing a blank/white screen

## Immediate Actions Required

### 1. Check Netlify Environment Variables
1. Go to your Netlify dashboard
2. Navigate to your site settings
3. Go to "Build & deploy" → "Environment"
4. Ensure the following environment variables are set:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_RAZORPAY_KEY_ID` - Your Razorpay key ID
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### 2. Clear Netlify Cache and Redeploy
1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to "Deploys" tab
4. Click "Trigger deploy" → "Clear cache and deploy site"
5. Wait for the deployment to complete

### 3. Check Netlify Build Logs
1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to "Deploys" tab
4. Click on the latest deploy
5. Check the build logs for any errors

## Common Issues and Solutions

### Issue 1: Missing Environment Variables
**Symptoms**: Blank screen, features not working
**Solution**: 
- Ensure all required VITE environment variables are set in Netlify
- Check that variables are prefixed with `VITE_`

### Issue 2: Service Worker Caching
**Symptoms**: Old version of site showing, features missing
**Solution**:
- Service worker has been disabled in our code
- Clear browser cache and Netlify cache
- Perform hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Issue 3: Build Process Issues
**Symptoms**: Build succeeds but site doesn't work
**Solution**:
- Check that Netlify is using `pnpm` instead of `npm`
- Verify `netlify.toml` configuration:
  ```toml
  [build]
    command = "pnpm install && pnpm run build"
    publish = "dist"
  ```

### Issue 4: Asset Loading Issues
**Symptoms**: Site loads but assets (JS/CSS) fail to load
**Solution**:
- Check browser Network tab for 404 errors
- Verify `vite.config.ts` base path is set correctly:
  ```javascript
  export default defineConfig({
    base: '/',
    // ... other config
  })
  ```

## Debugging Steps

### 1. Browser Console Debugging
1. Open your site in an incognito/private window
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for any error messages
5. Check if environment variables are being loaded correctly

### 2. Network Tab Analysis
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload the page
4. Check for:
   - 404 errors on JS/CSS files
   - Failed API requests
   - Missing assets

### 3. Application Tab Analysis
1. Open Developer Tools (F12)
2. Go to Application tab
3. Check:
   - Service Workers section (should be empty or unregistered)
   - Local Storage
   - Session Storage

## Production Verification Checklist

- [ ] Environment variables set in Netlify
- [ ] Cache cleared and site redeployed
- [ ] No console errors in browser
- [ ] No 404 errors in Network tab
- [ ] Service worker unregistered
- [ ] All features working (Book Now, Phone Modal, Admin Dashboard)

## If Issues Persist

1. **Check Netlify Deploy Settings**:
   - Ensure the correct branch is being deployed
   - Verify build command and publish directory

2. **Manual Deployment Test**:
   - Build locally: `pnpm run build`
   - Deploy `dist` folder manually to Netlify using Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --dir=dist --prod
     ```

3. **Compare Local and Production**:
   - Build locally and compare `dist` folder contents
   - Check file hashes to ensure identical builds

## Contact for Further Assistance

If you continue to experience issues after following these steps, please provide:
1. Netlify deploy logs
2. Browser console output (first 200 lines)
3. Network tab failures (404/500 errors)
4. Screenshot of Application → Service Workers tab
5. Screenshot of Application → Cache Storage tab

This information will help diagnose any remaining issues.