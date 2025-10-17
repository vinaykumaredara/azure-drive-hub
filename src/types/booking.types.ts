/**
 * Booking type definitions and interfaces
 * @module types/booking
 */

/**
 * Represents a booking draft stored in session storage
 */
export interface BookingDraft {
  /** Unique identifier for the car */
  carId: string;
  /** Pickup date and time information */
  pickup: BookingDateTime;
  /** Return date and time information */
  return: BookingDateTime;
  /** Selected add-ons for the booking */
  addons: BookingAddons;
  /** Calculated totals for the booking */
  totals: BookingTotals;
}

/**
 * Date and time information for booking
 */
export interface BookingDateTime {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Time in HH:mm format */
  time: string;
}

/**
 * Available add-ons for a booking
 */
export interface BookingAddons {
  driver?: boolean;
  gps?: boolean;
  childSeat?: boolean;
  insurance?: boolean;
}

/**
 * Calculated totals for a booking
 */
export interface BookingTotals {
  /** Subtotal before service charge */
  subtotal: number;
  /** Service charge amount */
  serviceCharge: number;
  /** Total amount including all charges */
  total: number;
}

/**
 * Options for saving a booking draft
 */
export interface SaveDraftOptions {
  /** Whether to redirect to user profile after login */
  redirectToProfile?: boolean;
}

/**
 * Booking data state
 */
export interface BookingData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  phoneNumber: string | null;
  extras: BookingAddons;
  totalDays: number;
  holdId: string | null;
  holdExpiry: string | null;
  termsAccepted: boolean;
  licenseId: string | null;
  advanceBooking: boolean;
  advanceAmount: number;
}

/**
 * Booking step identifiers
 */
export type BookingStep = 'dates' | 'phone' | 'extras' | 'terms' | 'license' | 'payment' | 'confirmation';

/**
 * Payment mode options
 */
export type PaymentMode = 'full' | 'hold';

/**
 * Result from booking hold creation
 */
export interface BookingHoldResult {
  success: boolean;
  holdId?: string;
  bookingId?: string;
  holdExpiry?: string;
  holdUntil?: string;
  error?: string;
  errorCode?: string;
}
