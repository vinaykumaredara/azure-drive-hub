-- Ensure payments table has required fields
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'INR',
  method text,                           -- e.g. phonepe, upi, razorpay
  status text DEFAULT 'pending',         -- pending, success, failed, refunded
  metadata jsonb DEFAULT '{}',            -- gateway response, txn id, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add hold and payment status columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hold_until timestamptz NULL,  -- when temporary hold expires
  ADD COLUMN IF NOT EXISTS hold_amount numeric(12,2) NULL,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';  -- unpaid, partial_hold, paid, cancelled

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.hold_until IS 'When temporary hold expires (for 10% advance payment)';
COMMENT ON COLUMN public.bookings.hold_amount IS 'Amount paid for hold (typically 10% of total)';
COMMENT ON COLUMN public.bookings.payment_status IS 'Current payment status of booking';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_hold_until ON public.bookings (hold_until);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings (payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments (booking_id);

-- Update existing bookings to have default payment_status
UPDATE public.bookings 
SET payment_status = 'paid' 
WHERE payment_status = 'unpaid' AND status IN ('confirmed', 'completed');

UPDATE public.bookings 
SET payment_status = 'cancelled' 
WHERE payment_status = 'unpaid' AND status = 'cancelled';