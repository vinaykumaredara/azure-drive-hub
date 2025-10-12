# Booking Intent Resume Testing Guide

## Overview

This guide provides instructions for manually testing the booking intent resume functionality to ensure it works correctly in all scenarios.

## Test Scenarios

### 1. Modal Sign-in Flow (Email/Password)

1. Open a private/incognito browser window
2. Navigate to the car listing page
3. Click "Book Now" on any available car
4. Verify that:
   - A toast message appears: "Sign in required - We'll resume your booking automatically after you sign in."
   - The pending intent is saved to localStorage
   - You are redirected to the auth page
5. Sign in using email/password in the modal
6. Verify that:
   - You are redirected back to the car listing page
   - The booking modal opens automatically for the selected car
   - The pending intent is cleared from localStorage

### 2. Redirect OAuth Flow (Google Sign-in)

1. Open a private/incognito browser window
2. Navigate to the car listing page
3. Click "Book Now" on any available car
4. Verify that:
   - A toast message appears: "Sign in required - We'll resume your booking automatically after you sign in."
   - The pending intent is saved to localStorage
   - You are redirected to the auth page
5. Choose Google sign-in (redirect flow)
6. Complete the Google authentication
7. Verify that:
   - You are redirected back to the car listing page
   - The booking modal opens automatically for the selected car
   - The pending intent is cleared from localStorage

### 3. Same-tab Resume (CustomEvent)

1. Open the browser developer tools
2. Navigate to the car listing page
3. Click "Book Now" on any available car
4. In the console, check localStorage:
   ```javascript
   localStorage.getItem('pendingIntent')
   ```
5. Verify the intent is saved
6. Sign in using any method
7. Verify that:
   - The booking modal opens automatically
   - The pending intent is cleared from localStorage

### 4. Cross-tab Resume (localStorage)

1. Open two browser tabs with the application
2. In Tab 1, navigate to the car listing page
3. Click "Book Now" on any available car
4. Verify the intent is saved to localStorage
5. In Tab 2, complete the sign-in process
6. Switch back to Tab 1 and refresh the page
7. Verify that:
   - The booking modal opens automatically
   - The pending intent is cleared from localStorage

## Debugging Tools

### Console Logging

Look for logs with these prefixes:
- `[NewBookNowButton]` - Button click handling
- `[BookingIntent]` - Intent saving/resuming
- `[BookingProvider]` - Provider readiness and resume attempts

### localStorage Inspection

Check for pending intents:
```javascript
localStorage.getItem('pendingIntent')
```

Clear pending intents:
```javascript
localStorage.removeItem('pendingIntent')
```

### CustomEvent Monitoring

Monitor custom events:
```javascript
window.addEventListener('bookingIntentSaved', (e) => console.log('Booking intent saved:', e.detail));
```

## Common Issues and Solutions

### Issue: Booking modal doesn't open after sign-in
**Solution:**
1. Check if the pending intent exists in localStorage
2. Verify console logs for resume attempts
3. Ensure BookingProvider is mounted on the return route

### Issue: Duplicate modals opening
**Solution:**
1. Check for multiple BookingProvider instances
2. Verify idempotency in resume functions

### Issue: Race conditions with lazy loading
**Solution:**
1. Ensure BookingModal is prefetched
2. Check that openBookingModal waits for modal readiness

## Automated Tests

Run specific tests:
```bash
npm test src/__tests__/components/NewBookNowButton.test.tsx
npm test src/__tests__/contexts/BookingContext.test.tsx
```

## Production Testing

1. Build the production version:
   ```bash
   npm run build
   ```

2. Serve the production build:
   ```bash
   npx serve -s dist
   ```

3. Test all scenarios in the production build to ensure no issues with minification or lazy loading.