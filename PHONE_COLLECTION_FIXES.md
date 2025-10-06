# Phone Collection Fix Implementation

## Summary

This implementation fixes the critical issue where users could proceed with booking without providing their phone number. The solution ensures that:

1. Users must provide their phone number before booking
2. Phone numbers are stored in the canonical `users` table
3. The booking flow properly handles authentication states
4. Drafts are preserved across the authentication flow

## Files Changed

### 1. `src/hooks/use-auth.ts` (NEW)
- Shim file to resolve import errors
- Re-exports `useAuth` from the correct location

### 2. `src/components/AuthProvider.component.tsx`
- Enhanced to fetch and expose user profile data including phone number
- Added `profile` and `profileLoading` states
- Implemented useEffect to fetch user profile from the `users` table

### 3. `src/components/CarCard.tsx`
- Updated `handleBookNow` function to check for phone number
- Added proper handling of profile loading states
- Implemented redirect to profile page when user has no phone number

### 4. `src/components/CarCardModern.tsx`
- Updated `handleBookNow` function to check for phone number
- Added proper handling of profile loading states
- Implemented redirect to profile page when user has no phone number

### 5. `src/hooks/useBooking.ts`
- Enhanced `saveDraftAndRedirect` to support `redirectToProfile` option
- This allows the booking flow to redirect users to their profile page to add phone number

### 6. `src/components/PhoneModal.tsx` (NEW)
- Created PhoneModal component for collecting phone numbers
- Implemented proper form handling and Supabase integration
- Added user feedback through toast notifications

### 7. `src/components/EnhancedBookingFlow.tsx`
- Added phone number validation in the booking flow
- Implemented `onAttemptConfirm` function to check for phone number before proceeding

### 8. `__tests__/phoneCollection.test.tsx` (NEW)
- Created comprehensive test suite for phone collection functionality
- Tests cover all scenarios: unauthenticated users, users without phone numbers, users with phone numbers, and loading states

## QA Checklist

### Compile & Runtime
- [ ] `pnpm dev` runs without Vite import-analysis errors
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console

### Auth & Profile
- [ ] AuthProvider exposes user, profile, profileLoading
- [ ] profile.phone is authoritative (from users table)
- [ ] Profile data is fetched correctly on auth state change

### Book Now Behavior
- [ ] Logged out → draft saved, redirect to `/auth?next=...`
- [ ] Logged in, profile.phone missing → redirect to profile (draft preserved)
- [ ] Logged in, profile.phone present → opens booking flow immediately
- [ ] Profile loading state properly handled (spinner/toast shown)

### Booking Resume
- [ ] After saving phone, booking flow resumes with draft restored
- [ ] sessionStorage.getItem('pendingBooking') contains draft after clicking Book Now while logged out

### Admin Visibility
- [ ] Created booking appears immediately in admin dashboard (or after refresh)

### Security
- [ ] No secrets in the repo (.env files with service keys removed)
- [ ] Only public keys remain in client-side config

### Tests
- [ ] Unit tests pass (`pnpm test`)
- [ ] New test suite verifies all Book Now behaviors
- [ ] Test coverage for all scenarios (auth states, phone presence/absence)

## Manual Testing Steps

1. **Test with unauthenticated user:**
   - Open the site while logged out
   - Click "Book Now" on any car
   - Verify redirect to `/auth?next=...`
   - Check that sessionStorage contains pendingBooking draft

2. **Test with authenticated user without phone:**
   - Log in with a test user that has no phone number in the users table
   - Click "Book Now" on any car
   - Verify redirect to profile page to add phone number
   - Check that draft is preserved

3. **Test with authenticated user with phone:**
   - Log in with a test user that has a phone number
   - Click "Book Now" on any car
   - Verify that booking flow opens immediately

4. **Test profile loading state:**
   - Simulate slow network conditions
   - Click "Book Now" while profile is loading
   - Verify that appropriate feedback is shown

5. **Test PhoneModal (if implemented):**
   - Use a user without phone number
   - Trigger phone collection flow
   - Enter and save phone number
   - Verify booking flow resumes

6. **Test admin sync:**
   - Complete a booking flow
   - Verify booking appears in admin dashboard
   - Check that bookings table is updated correctly

## Common Pitfalls & Debugging

1. **Wrong file path or name:**
   - Double-check exact filename & export
   - Vite path alias may mask typos in dev but will still fail in production

2. **Case sensitivity:**
   - On Windows it can be lenient; CI (Linux) will fail
   - Always use exact case for imports

3. **Race conditions:**
   - Ensure profileLoading check on handlers
   - Show spinner or appropriate feedback during loading

4. **Missing modal-root:**
   - Ensure modal-root exists in index.html for portal mounting

5. **Secrets leaked:**
   - Scan for .env in commits and remove any service_role keys