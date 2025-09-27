# Booking Flow Implementation

## Overview

This document describes the implementation of the complete booking flow with authentication, license upload, payment options, and hold functionality.

## Features Implemented

1. **Authentication Redirect**
   - Save booking draft in session storage when user is not authenticated
   - Redirect to login page with return URL
   - Restore booking draft after successful login

2. **License Upload**
   - Required before payment processing
   - Upload to private Supabase Storage bucket
   - Store metadata in licenses table
   - Admin verification workflow

3. **Payment Options**
   - Full payment option
   - 10% advance payment with 24-hour hold
   - Clear UI for payment mode selection

4. **Hold Management**
   - 24-hour hold expiration
   - Automatic cleanup of expired holds
   - Real-time updates to admin dashboard

5. **Database Changes**
   - Added license_path and license_verified columns to users table
   - Added hold_until, hold_amount, and payment_status columns to bookings table
   - Enhanced payments table with additional fields

## File Structure

```
src/
├── components/
│   ├── LicenseUpload.tsx          # License upload component
│   ├── PaymentOptions.tsx         # Payment mode selection UI
│   └── HoldNotice.tsx             # Hold expiration notice
├── hooks/
│   └── useBooking.ts              # Booking state management
├── pages/
│   ├── Booking.tsx                # Main booking page with multi-step flow
│   └── Auth.tsx                   # Authentication with redirect handling
├── services/
│   ├── licenseService.ts          # License upload and management
│   └── payments.ts                # Payment processing
└── supabase/
    ├── migrations/
    │   ├── 20250921_add_user_license.sql
    │   └── 20250921_add_payments_and_holds.sql
    └── functions/
        ├── booking-redirect/
        ├── create-hold/
        ├── create-payment-intent/
        ├── verify-license-upload/
        ├── complete-payment/
        └── cleanup-expired-holds/
```

## Database Schema Changes

### Users Table
```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS license_path text,         -- storage path for license
  ADD COLUMN IF NOT EXISTS license_verified boolean DEFAULT false;
```

### Bookings Table
```sql
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hold_until timestamptz NULL,  -- when temporary hold expires
  ADD COLUMN IF NOT EXISTS hold_amount numeric(12,2) NULL,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';  -- unpaid, partial_hold, paid, cancelled
```

### Payments Table
```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'INR',
  method text,                           -- e.g. phonepe, upi, razorpay
  status text DEFAULT 'pending',         -- pending, success, failed, refunded
  metadata jsonb DEFAULT '{}'            -- gateway response, txn id, etc
);
```

## Edge Functions

### create-hold
Creates a booking with hold functionality:
- Validates booking dates
- Checks for conflicts
- Creates booking record with hold information
- Creates payment record for hold amount

### cleanup-expired-holds
Scheduled function that runs every 10 minutes:
- Finds bookings with expired holds
- Updates payment_status to 'unpaid'
- Clears hold information

### complete-payment
Handles payment completion:
- Updates payment status
- Updates booking status to 'paid'
- Marks car as booked

## Frontend Components

### Booking Flow
Multi-step process:
1. **Date Selection** - Select pickup and return dates/times
2. **License Upload** - Required before payment
3. **Payment Options** - Choose between full payment or 10% hold

### License Upload
- File validation (images/PDF, max 5MB)
- Upload to private storage bucket
- Database record creation
- Success feedback

### Payment Options
- Radio group for payment mode selection
- Clear display of amounts for each option
- Hold notice with countdown timer

## Security Considerations

1. **Private Storage**
   - Licenses stored in private bucket
   - Access controlled via RLS policies
   - Signed URLs for admin preview

2. **Authentication**
   - Session storage for draft bookings
   - Secure redirect with return URLs
   - Edge function authentication validation

3. **Data Validation**
   - Client-side and server-side validation
   - Conflict detection for bookings
   - Proper error handling

## Admin Dashboard Updates

- Payment status badges (Hold, Paid, Unpaid)
- Hold expiration notices
- Hold amount display
- Real-time updates via Supabase realtime

## Testing

To test the implementation:

1. **Authentication Flow**
   - Start booking without logging in
   - Verify redirect to login page
   - Complete login and verify return to booking

2. **License Upload**
   - Upload license image/PDF
   - Verify storage and database record
   - Check admin dashboard for license status

3. **Payment Options**
   - Select full payment option
   - Select 10% hold option
   - Verify hold creation and countdown

4. **Hold Expiration**
   - Create booking with hold
   - Wait for expiration or manually trigger cleanup
   - Verify booking status update

## Deployment

1. Apply database migrations:
   ```bash
   supabase migration up
   ```

2. Deploy Edge Functions:
   ```bash
   supabase functions deploy booking-redirect
   supabase functions deploy create-hold
   supabase functions deploy create-payment-intent
   supabase functions deploy verify-license-upload
   supabase functions deploy complete-payment
   supabase functions deploy cleanup-expired-holds
   ```

3. Set up scheduled function for cleanup:
   ```bash
   supabase functions schedule cleanup-expired-holds --interval 10m
   ```

4. Verify frontend components are working correctly

## Future Enhancements

1. **Enhanced License Verification**
   - OCR integration for automatic license data extraction
   - Expiration date detection
   - Automated verification workflows

2. **Payment Gateway Integration**
   - Razorpay/PhonePe integration
   - Webhook handling for payment confirmations
   - Refund processing

3. **Notification System**
   - Email/SMS notifications for hold expiration
   - Payment confirmations
   - Admin alerts for license uploads

4. **Analytics Dashboard**
   - Hold conversion rates
   - Payment method preferences
   - Booking patterns and trends