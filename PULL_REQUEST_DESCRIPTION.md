# Fix post-login redirect causing 404 & ensure phone-collection triggers on restore

## Description
This PR fixes critical issues in the booking flow that were causing post-login redirect 404 errors and preventing phone collection from triggering on booking restoration. The changes ensure a smooth user experience from "Book Now" click through authentication to booking completion.

## Root Cause
1. **Malformed redirect URLs**: Nested query strings in redirect parameters were causing 404 errors
2. **Client-side navigation issues**: Inconsistent use of window.location.href vs navigate() for redirects
3. **Undefined reference error**: Reference to non-existent bookingsRef in UserDashboard
4. **Incomplete flow integration**: Missing connection between Auth completion and phone collection
5. **PhoneModal issues**: Not awaiting Supabase upsert and not refreshing profile after save
6. **Booking restoration issues**: Not validating restored drafts and creating bookings with missing required fields
7. **Error handling issues**: Server errors being swallowed and generic UI messages hiding real causes
8. **Stale closure bug**: handleBookNow was memoized without user/profile dependencies, causing non-responsive buttons after login

## Changes

### Core Fixes
- **`src/hooks/useBooking.ts`**: Simplified saveDraftAndRedirect to use single-level next params only and improved error handling
- **`src/pages/Auth.tsx`**: Enhanced post-login redirect logic with proper client-side navigation and profile loading wait
- **`src/components/PhoneModal.tsx`**: Fixed TypeScript error, await Supabase upsert, and refresh profile after save
- **`src/components/AuthProvider.component.tsx`**: Added refreshProfile function and profileJustUpdated detection
- **`src/contexts/AuthContext.ts`**: Updated context type to include refreshProfile
- **`src/components/EnhancedBookingFlow.tsx`**: Added proper booking restoration logic with validation
- **`src/pages/UserDashboard.tsx`**: Fixed undefined bookingsRef error and improved booking restoration logic
- **`src/components/CarCard.tsx`**: Fixed stale closure bug and improved user feedback
- **`src/components/CarCardModern.tsx`**: Fixed stale closure bug and improved user feedback

### Test Coverage
- **Unit tests**: Verify saveDraftAndRedirect behavior and param formatting
- **Integration tests**: Validate login flow with booking restoration and phone collection

### Infrastructure
- **Netlify config**: Added SPA fallback to prevent 404s in production

## Testing
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Manual QA completed for all flows:
  - Post-login redirect (no 404s)
  - Phone collection for users without phone numbers
  - Booking restoration for users with phone numbers
  - Admin user redirects
  - Error handling with detailed server messages
  - Profile refresh after phone save
  - Book Now button responsiveness after login

## Deployment Notes
- No database migrations required
- No breaking changes to existing APIs
- Server configuration added for SPA fallback (Netlify only)

## Files Changed
1. `src/hooks/useBooking.ts` - Core booking hook logic
2. `src/pages/Auth.tsx` - Authentication and redirect handling
3. `src/components/PhoneModal.tsx` - Phone collection component
4. `src/components/AuthProvider.component.tsx` - Profile refresh functionality
5. `src/contexts/AuthContext.ts` - Updated context type
6. `src/components/EnhancedBookingFlow.tsx` - Booking restoration logic
7. `src/pages/UserDashboard.tsx` - Dashboard with booking restoration
8. `src/components/CarCard.tsx` - Fixed stale closure and improved UX
9. `src/components/CarCardModern.tsx` - Fixed stale closure and improved UX
10. `netlify.toml` - Server configuration for SPA fallback
11. `src/__tests__/bookingFlow.test.ts` - Unit tests
12. `src/__tests__/enhancedBookingFlow.test.ts` - Unit tests for booking restoration
13. `src/__tests__/integration/bookingLoginFlow.test.ts` - Integration tests
14. `src/__tests__/integration/bookingResumeFlow.test.ts` - Integration tests for complete flow
15. `src/__tests__/carCardBooking.test.ts` - Unit tests for CarCard behavior
16. `src/__tests__/integration/postLoginBooking.test.ts` - Integration tests for post-login flow

## Acceptance Criteria
- [x] No post-login 404s
- [x] Phone request triggers when necessary
- [x] Booking resumes correctly after login
- [x] PhoneModal awaits Supabase upsert and refreshes profile
- [x] EnhancedBookingFlow validates restored drafts properly
- [x] Server errors are surfaced to user with detailed messages
- [x] Book Now button is responsive after login
- [x] Tests pass
- [x] All existing functionality preserved

## Related Issues
Fixes issues with booking flow restoration and authentication redirects.