# Booking Flow QA Checklist

## Pre-requisites
- [ ] Test car with multiple images exists in admin dashboard
- [ ] User account is created and logged in
- [ ] Development server is running (`npm run dev`)

## Navigation Testing
- [ ] Clicking "Book Now" on car card navigates to `/booking/:carId`
- [ ] Direct URL access to `/booking/:carId` loads booking page
- [ ] Back button works correctly between steps
- [ ] Navigation preserves form data when going back

## Step 1: Date & Time Selection
- [ ] Pickup date picker works and shows calendar
- [ ] Return date picker works and shows calendar
- [ ] Time pickers work for both pickup and return
- [ ] Minimum booking duration validation (12 hours) works
- [ ] Same-day bookings are allowed with proper validation
- [ ] End date must be after start date validation works
- [ ] Price calculation updates correctly based on dates
- [ ] Continue button is disabled when dates are invalid
- [ ] Continue button is enabled when dates are valid

## Step 2: License Upload
- [ ] License upload component renders correctly
- [ ] File selection works for image files
- [ ] Camera capture works on mobile devices
- [ ] Image preview shows after upload
- [ ] Success message displays after upload
- [ ] Continue button is disabled before license upload
- [ ] Continue button is enabled after license upload

## Step 3: Terms & Conditions
- [ ] Terms & Conditions section displays correctly
- [ ] Terms list is visible and readable
- [ ] Checkbox for accepting terms works
- [ ] Continue button is disabled when terms not accepted
- [ ] Continue button is enabled when terms are accepted

## Step 4: Payment Processing
- [ ] Payment options section displays correctly
- [ ] Total amount calculation is correct
- [ ] Deposit calculation (10%) is correct
- [ ] Payment button shows processing state when clicked
- [ ] Mock payment redirect works correctly
- [ ] Mock payment success page displays correctly

## Edge Cases & Error Handling
- [ ] Unauthenticated user redirected to login with return path
- [ ] User without phone number redirected to profile
- [ ] Invalid car ID shows appropriate error message
- [ ] Network errors during car fetch show error message
- [ ] Large image files are handled gracefully
- [ ] Multiple rapid clicks on payment button are debounced
- [ ] Browser back button works correctly
- [ ] Page refresh preserves entered data (where possible)

## Mobile Responsiveness
- [ ] All steps are usable on mobile devices
- [ ] Date pickers work on touch devices
- [ ] Camera capture works on mobile
- [ ] Buttons are appropriately sized for touch
- [ ] Layout adapts to different screen sizes

## Accessibility
- [ ] All buttons have appropriate aria-labels
- [ ] Form inputs have proper labels
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Color contrast meets accessibility standards

## Performance
- [ ] Page loads within 2 seconds
- [ ] Image loading doesn't block UI
- [ ] Transitions are smooth
- [ ] No memory leaks detected

## Cross-browser Compatibility
- [ ] Works correctly on Chrome
- [ ] Works correctly on Firefox
- [ ] Works correctly on Safari
- [ ] Works correctly on Edge

## Security
- [ ] No sensitive data in URL parameters
- [ ] No console errors or warnings
- [ ] Payment processing is secure (even in mock)
- [ ] User data is properly validated

## Post-Test Cleanup
- [ ] Remove any test data created during testing
- [ ] Reset any modified settings
- [ ] Document any issues found