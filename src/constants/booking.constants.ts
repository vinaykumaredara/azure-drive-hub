/**
 * Booking-related constants
 * @module constants/booking
 */

/**
 * Add-on prices in INR per day
 */
export const ADDON_PRICES = {
  driver: 500,
  gps: 200,
  childSeat: 150,
  insurance: 300,
} as const;

/**
 * Add-on display names
 */
export const ADDON_NAMES = {
  driver: 'Professional Driver',
  gps: 'GPS Navigation',
  childSeat: 'Child Safety Seat',
  insurance: 'Premium Insurance',
} as const;

/**
 * Add-on descriptions
 */
export const ADDON_DESCRIPTIONS = {
  driver: 'Experienced driver for your trip',
  gps: 'Built-in GPS with latest maps',
  childSeat: 'Safety seat for children',
  insurance: 'Comprehensive coverage',
} as const;

/**
 * Booking step configuration
 */
export const BOOKING_STEPS = {
  phone: {
    id: 'phone' as const,
    title: 'Phone Number',
    description: 'Verify your contact information',
  },
  dates: {
    id: 'dates' as const,
    title: 'Select Dates & Times',
    description: 'Choose pickup and return times',
  },
  terms: {
    id: 'terms' as const,
    title: 'Terms & Conditions',
    description: 'Review and accept terms',
  },
  license: {
    id: 'license' as const,
    title: 'Upload License',
    description: 'Provide your driving license',
  },
  payment: {
    id: 'payment' as const,
    title: 'Payment Options',
    description: 'Choose your payment method',
  },
  confirmation: {
    id: 'confirmation' as const,
    title: 'Booking Confirmed',
    description: 'Your booking is complete',
  },
} as const;

/**
 * Time slots for booking
 */
export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

/**
 * Service charge percentage
 */
export const SERVICE_CHARGE_PERCENT = 5;

/**
 * Advance payment percentage
 */
export const ADVANCE_PAYMENT_PERCENT = 10;

/**
 * Booking hold duration in milliseconds (24 hours)
 */
export const BOOKING_HOLD_DURATION = 24 * 60 * 60 * 1000;

/**
 * Session storage keys
 */
export const STORAGE_KEYS = {
  PENDING_BOOKING: 'pendingBooking',
  REDIRECT_TO_PROFILE: 'redirectToProfileAfterLogin',
} as const;
