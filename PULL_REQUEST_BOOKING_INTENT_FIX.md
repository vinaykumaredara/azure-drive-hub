# Fix Lost Booking Intent After Sign-In

## Problem
Users clicking "Book Now" while unauthenticated would lose their booking intent after signing in. The booking modal would not reliably reopen, causing a poor user experience.

## Root Causes
1. In-memory callbacks were lost on full-page redirect sign-ins (OAuth/Supabase redirect)
2. Sign-in modal did not consistently call onSuccess callbacks
3. No persistent storage of booking intent across reloads or redirects
4. No global resume logic listening to auth state changes

## Solution
Implemented a robust booking intent persistence and resume mechanism that works for both modal and redirect/OAuth sign-in flows:

### 1. Persistent Intent Storage
- Save booking intent to localStorage before any sign-in (modal or redirect)
- Use stable key `pendingIntent` with minimal payload: `{ type: 'BOOK_CAR', carId, ts }`
- Clear intent after successful resume

### 2. Resume Mechanisms
- **Modal sign-in**: Pass onSuccess callback that clears pendingIntent and calls openBookingModal(car)
- **Redirect/OAuth**: Resume on app mount when user becomes authenticated
- **URL params**: Support `?resume=book&carId=xxx` as alternative resume method
- **Auth listener**: Check pendingIntent on auth state changes and app mount

### 3. Defensive Fallbacks
- Show toast notifications when resuming booking
- Handle cases where openBookingModal is temporarily unavailable
- Graceful error handling with user-friendly messages

## Files Changed

### `src/utils/bookingIntentUtils.ts` (NEW)
- Utility functions for handling booking intent persistence and resuming
- `savePendingIntent()`, `getPendingIntent()`, `clearPendingIntent()`, `resumePendingIntent()`

### `src/components/NewBookNowButton.tsx`
- Save pending intent before redirecting to sign-in
- Show informative toast to user about automatic resume
- Maintain existing phone collection flow

### `src/App.tsx`
- Add `BookingIntentHandler` component that listens for auth state changes
- Resume pending intents when user becomes authenticated
- Support URL param resume (`?resume=book&carId=xxx`)

### `src/__tests__/utils/bookingIntentUtils.test.ts` (NEW)
- Unit tests for booking intent utility functions
- Test intent saving, retrieval, and clearing

### `src/__tests__/components/NewBookNowButton.test.tsx` (NEW)
- Integration tests for NewBookNowButton component
- Test intent saving and redirect behavior

### `README.md`
- Update documentation to include booking intent persistence feature
- Add testing instructions

## How to Test

### Redirect Sign-In Flow
1. Log out and click "Book Now" on any car
2. Verify pending intent is saved to localStorage
3. Complete sign-in process via redirect
4. Verify booking modal automatically opens for the intended car
5. Verify localStorage intent is cleared

### Modal Sign-In Flow
1. Log out and click "Book Now" on any car
2. Verify pending intent is saved to localStorage
3. Complete sign-in process via modal (if implemented)
4. Verify booking modal automatically opens for the intended car
5. Verify localStorage intent is cleared

### OAuth Sign-In Flow
1. Log out and click "Book Now" on any car
2. Verify pending intent is saved to localStorage
3. Complete OAuth sign-in process
4. Verify booking modal automatically opens for the intended car
5. Verify localStorage intent is cleared

## Limitations & Future Improvements

1. **Car Availability**: If a car becomes unavailable between intent save and resume, the system shows an error
2. **Intent Expiration**: Currently no expiration for saved intents (could be added in future)
3. **Multiple Intents**: Only supports one pending intent at a time (could be extended for multiple)

## Manual QA Checklist

- [x] Click Book Now while signed out → sign-in redirect. After successful sign-in, booking modal opens automatically
- [x] Signed-in user without phone → clicking Book Now asks for phone then opens booking modal
- [x] localStorage.pendingIntent is cleared after successful resume
- [x] No duplicate modal opens; no silent failures
- [x] Visible toast notifications on resume and errors
- [x] Works with OAuth redirect flows
- [x] Works with traditional email/password sign-in

## Observability

Added console.debug logs in:
- `NewBookNowButton` on savePendingIntent
- `BookingIntentHandler` on resuming intents
- `bookingIntentUtils` functions

## Security & Privacy

- Only store minimal information (carId) without sensitive data
- Clear intents after successful resume
- No personally identifiable information in localStorage