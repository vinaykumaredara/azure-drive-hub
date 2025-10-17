/**
 * Booking validation utilities
 * @module utils/booking/validation
 */

import { BookingDraft, BookingData } from '@/types/booking.types';

/**
 * Validates phone number format (Indian format)
 * @param phoneNumber - Phone number to validate
 * @returns True if valid, false otherwise
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  return phoneRegex.test(cleanedPhone);
};

/**
 * Validates booking draft data
 * @param draft - Booking draft to validate
 * @returns Validation result with error message if invalid
 */
export const validateBookingDraft = (
  draft: BookingDraft
): { valid: boolean; error?: string } => {
  if (!draft.carId) {
    return { valid: false, error: 'Car ID is required' };
  }

  if (!draft.pickup?.date || !draft.pickup?.time) {
    return { valid: false, error: 'Pickup date and time are required' };
  }

  if (!draft.return?.date || !draft.return?.time) {
    return { valid: false, error: 'Return date and time are required' };
  }

  const pickupDate = new Date(`${draft.pickup.date}T${draft.pickup.time}`);
  const returnDate = new Date(`${draft.return.date}T${draft.return.time}`);

  if (returnDate <= pickupDate) {
    return { valid: false, error: 'Return date must be after pickup date' };
  }

  if (pickupDate < new Date()) {
    return { valid: false, error: 'Pickup date cannot be in the past' };
  }

  return { valid: true };
};

/**
 * Validates booking data before submission
 * @param bookingData - Booking data to validate
 * @returns Validation result with error message if invalid
 */
export const validateBookingData = (
  bookingData: BookingData
): { valid: boolean; error?: string } => {
  if (!bookingData.startDate || !bookingData.endDate) {
    return { valid: false, error: 'Dates are required' };
  }

  if (!bookingData.phoneNumber) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (!validatePhoneNumber(bookingData.phoneNumber)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  if (!bookingData.termsAccepted) {
    return { valid: false, error: 'You must accept the terms and conditions' };
  }

  return { valid: true };
};

/**
 * Validates date range
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Validation result with error message if invalid
 */
export const validateDateRange = (
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }

  if (start < new Date()) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }

  return { valid: true };
};
