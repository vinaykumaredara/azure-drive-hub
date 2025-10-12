# Booking Flow Resume System

## Overview

This document describes the booking intent and resume system that ensures users can seamlessly continue their booking after signing in.

## Architecture

### Components

1. **bookingIntent.ts** - Manages booking intent persistence in localStorage
2. **useBookingResume.ts** - Hook that automatically resumes bookings after sign-in
3. **CarCard/CarCardModern** - Saves booking intent before redirecting to auth
4. **UserDashboard** - Integrates resume logic with phone collection flow

### Flow Diagram

```
User clicks "Book Now" (not signed in)
    ↓
bookingIntentStorage.save({ type: 'BOOK_CAR', carId, timestamp })
    ↓
saveDraftAndRedirect() → /auth
    ↓
User signs in
    ↓
useBookingResume() detects user + checks localStorage
    ↓
Fetches car details from Supabase
    ↓
IF no phone: show PhoneModal → THEN open booking
IF phone exists: open booking immediately
    ↓
Clear intent from localStorage
```

## Key Features

### 1. Intent Expiration
- Intents expire after 1 hour (configurable)
- Expired intents are automatically cleared
- Prevents stale bookings from being resumed

### 2. Race Condition Prevention
- `isResuming` state prevents duplicate resume attempts
- Intent cleared BEFORE opening modal to prevent loops
- Profile loading state checked before resume

### 3. Cross-Tab Support
- CustomEvent `bookingIntentSaved` dispatched when intent saved
- Other tabs can listen and sync state
- Useful for multi-window scenarios

### 4. Defensive Logging
- All key actions logged with `[Component] Action - Details` format
- Easy to filter in DevTools: `[BookingResume]`, `[BookNow]`, etc.
- Errors logged with full context

## Console Log Format

```typescript
// Entry points
[BookNow] Button clicked { carId, user, profile }
[handleBookNow] ENTRY { carId, user, profile, profileLoading, computedIsAvailable }

// Intent management
[BookingIntent] Saved { type, carId, timestamp }
[BookingIntent] Cleared

// Resume flow
[BookingResume] Attempting resume { type, carId, timestamp }
[BookingResume] Car fetched, opening flow { id, title, ... }
[BookingResume] Event received, attempting resume
[BookingResume] Intent expired
[BookingResume] ERROR { error details }

// Dashboard integration
[UserDashboard] Resumed car detected { car }
[UserDashboard] No phone, showing phone modal
[UserDashboard] Phone exists, opening booking
[UserDashboard] Opening booking after phone collection
```

## QA Checklist

### Pre-Login Flow
- [ ] Click "Book Now" (signed-out) → Intent saved to localStorage
- [ ] Intent object has correct structure: `{ type: 'BOOK_CAR', carId: string, timestamp: number }`
- [ ] Redirected to `/auth` with return URL
- [ ] After sign-in, automatically returns to original page

### Resume Flow - With Phone
- [ ] After sign-in, booking modal opens automatically
- [ ] Car details pre-filled correctly
- [ ] Phone step pre-filled with user's phone
- [ ] Intent cleared from localStorage after resume
- [ ] Console shows: `[BookingResume] Attempting resume` → `Car fetched` → `opening flow`

### Resume Flow - Without Phone
- [ ] After sign-in, phone modal opens first
- [ ] User enters phone → Phone modal closes
- [ ] Booking modal opens after phone collection
- [ ] All details pre-filled correctly
- [ ] Console shows: `[UserDashboard] No phone, showing phone modal` → `Opening booking after phone collection`

### Edge Cases
- [ ] Intent expires after 1 hour → Not resumed, no errors
- [ ] Car deleted between save and resume → Error toast shown
- [ ] Multiple tabs open → Resume works in all tabs
- [ ] Network error during resume → Error toast shown with details
- [ ] User cancels sign-in → Intent remains, can try again

### Button Behavior
- [ ] "Book Now" and "Contact" buttons are side-by-side (not overlapping)
- [ ] Buttons have adequate spacing: `gap-2 sm:gap-3`
- [ ] Buttons have minimum width: `min-w-[80px]` and `min-w-[90px]`
- [ ] "Book Now" has `type="button"` attribute
- [ ] Both buttons call `e.stopPropagation()` to prevent parent handlers
- [ ] Clicking "Contact" never triggers booking flow
- [ ] Clicking "Book Now" (disabled) shows toast explaining why

### Performance
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] No memory leaks (check event listeners cleaned up)
- [ ] Resume happens within 1 second of sign-in
- [ ] No duplicate API calls to fetch car details

## Debugging Guide

### "Book Now" Not Working

1. **Check button click logs:**
   ```
   Filter console by: [BookNow]
   Expected: [BookNow] Button clicked { carId: "xyz", user: true/false, profile: true/false }
   ```

2. **If no logs appear:**
   - Check button element in DevTools
   - Verify `onClick` handler attached: `getEventListeners($0)`
   - Check for overlapping elements (z-index, pointer-events)
   - Look for parent click handlers stealing events

3. **If logs appear but modal doesn't open:**
   - Check `[handleBookNow] ENTRY` log for state values
   - Look for validation errors (availability, loading state)
   - Check if `EnhancedBookingFlow` component mounted
   - Verify `isBookingFlowOpen` state updates

### Resume Not Working

1. **Check localStorage:**
   ```javascript
   localStorage.getItem('pendingIntent')
   // Expected: {"type":"BOOK_CAR","carId":"...","timestamp":1234567890}
   ```

2. **Check console logs:**
   ```
   Filter by: [BookingResume]
   Expected flow:
   [BookingResume] Attempting resume
   → Car fetched, opening flow
   → (Dashboard) Resumed car detected
   → (Dashboard) Opening booking
   ```

3. **Common issues:**
   - Intent expired (check timestamp vs current time)
   - Profile still loading (`profileLoading: true`)
   - Car not found in database
   - Network error fetching car
   - `useBookingResume` not called (check UserDashboard imports)

### Contact Button Triggering Booking

1. **Check button structure:**
   - Both buttons should be siblings in same flex container
   - Both should have `type="button"`
   - Both should call `e.stopPropagation()`

2. **Check z-index:**
   - Parent container: `relative z-10`
   - No overlapping position:absolute elements

3. **Check console logs:**
   ```
   Click Contact → Should see: [Contact] Button clicked { carId }
   Should NOT see: [BookNow] Button clicked
   ```

## Migration Notes

### From Old System
- Old system used only `sessionStorage.pendingBooking`
- New system adds `localStorage.pendingIntent` for cross-reload support
- Legacy fallback still exists in UserDashboard for compatibility
- Can safely remove legacy code after testing confirms new system works

### Breaking Changes
- None - new system is additive
- Old flows continue to work via fallback logic

## Future Improvements

1. **Server-side intent storage**
   - Store intents in database instead of localStorage
   - Survives browser cache clear
   - Works across devices

2. **Analytics**
   - Track intent save rate
   - Track resume success rate
   - Identify drop-off points

3. **Multi-car bookings**
   - Support multiple cars in one intent
   - Batch resume for efficiency

4. **Push notifications**
   - Remind user of pending booking via email/SMS
   - Link directly to resume flow
