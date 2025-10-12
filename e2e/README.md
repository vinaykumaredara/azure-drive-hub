# E2E Testing with Playwright

## Setup

Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run tests in UI mode:
```bash
npx playwright test --ui
```

Run specific test file:
```bash
npx playwright test e2e/bookingFlow.spec.ts
```

Debug tests:
```bash
npx playwright test --debug
```

## Test Coverage

The booking flow E2E tests cover:

1. **Modal Opening**
   - Click "Book Now" button
   - Verify modal appears with proper z-index
   - Check auto-focus on phone input

2. **Complete Booking Flow**
   - Phone number entry and validation
   - Date selection (pickup/return)
   - Terms acceptance
   - License upload/selection
   - Payment option selection
   - Final confirmation

3. **Validation**
   - Phone number format validation
   - Date selection validation
   - Required field checks

4. **Navigation**
   - Back button functionality
   - Progress indicators
   - Step preservation on navigation

5. **Accessibility**
   - Keyboard navigation (Escape key)
   - Overlay click to close
   - ARIA labels and roles

6. **Error Handling**
   - Network error scenarios
   - Double submission prevention
   - Payment gateway errors

7. **Responsive Design**
   - Mobile viewport testing
   - Touch interactions

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries on failure
- Screenshot capture on errors
- Video recording on test failures
- Trace collection for debugging
