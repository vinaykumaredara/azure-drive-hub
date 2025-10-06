# Booking Flow Fixes - Commit Summary

## Problem Statement
Fix post-login redirect causing 404 & ensure phone-collection triggers on restore

## Root Cause Analysis
1. **Malformed redirect URLs**: Nested query strings causing 404 errors
2. **Client-side navigation issues**: Using window.location.href instead of navigate() for some redirects
3. **Undefined bookingsRef**: Reference to non-existent ref in UserDashboard
4. **Incomplete phone collection flow**: Missing integration between Auth and UserDashboard

## Changes Made

### 1. `src/hooks/useBooking.ts`
- Fixed `saveDraftAndRedirect` to avoid nested query strings
- Simplified redirect logic to use single-level next param only
- Added debug logging for tracking draft persistence

### 2. `src/pages/Auth.tsx`
- Enhanced post-login redirect logic with proper client-side navigation
- Added validation to only navigate to relative paths to avoid 404s
- Improved profile loading wait mechanism with timeout
- Added debug logging for tracking redirect flow

### 3. `src/components/PhoneModal.tsx`
- Fixed TypeScript error with Supabase upsert by adding proper type annotation
- Added `onConflict: 'id'` parameter to upsert call for better handling
- Maintained phone number validation logic

### 4. `src/pages/UserDashboard.tsx`
- Fixed undefined `bookingsRef` error by removing references to non-existent ref
- Updated `fetchNotifications` to use `bookings` state instead of undefined ref
- Removed assignment to `bookingsRef.current` since it's no longer needed
- Enhanced booking restoration logic with proper profile checking

## Test Coverage Added

### Unit Tests (`src/__tests__/bookingFlow.test.ts`)
- Test `saveDraftAndRedirect` sets `pendingBooking` correctly
- Test `saveDraftAndRedirect` produces expected `next` param format
- Test redirectToProfile flag management

### Integration Tests (`src/__tests__/integration/bookingLoginFlow.test.ts`)
- Test sessionStorage handling for booking drafts
- Test redirectToProfile flag persistence and cleanup

## QA Checklist

### Manual Testing Steps
1. **Post-Login Redirect Flow**
   - Log out → Click "Book Now" → Login → Verify no 404, proper dashboard redirect

2. **Phone Collection Flow**
   - User without phone → Log out → Click "Book Now" → Login → Verify PhoneModal appears

3. **Booking Restoration**
   - User with phone → Log out → Click "Book Now" → Login → Verify booking draft restored

4. **Admin Redirects**
   - Admin login → Verify redirect to `/admin` after login

## Server Configuration
Added Netlify redirect configuration to prevent 404s in production:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Acceptance Criteria Met
- ✅ No post-login 404s
- ✅ Phone request triggers when necessary
- ✅ Booking resumes correctly after login
- ✅ Tests pass
- ✅ All existing functionality preserved

## Files Modified
- `src/hooks/useBooking.ts`
- `src/pages/Auth.tsx`
- `src/components/PhoneModal.tsx`
- `src/pages/UserDashboard.tsx`
- `src/__tests__/bookingFlow.test.ts` (new)
- `src/__tests__/integration/bookingLoginFlow.test.ts` (new)
- `BOOKING_FLOW_FIXES_README.md` (new)