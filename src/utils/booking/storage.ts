/**
 * Booking storage utilities for session management
 * @module utils/booking/storage
 */

import { BookingDraft } from '@/types/booking.types';

const STORAGE_KEYS = {
  PENDING_BOOKING: 'pendingBooking',
  REDIRECT_TO_PROFILE: 'redirectToProfileAfterLogin',
} as const;

/**
 * Saves a booking draft to session storage
 * @param draft - Booking draft to save
 */
export const saveBookingDraft = (draft: BookingDraft): void => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.PENDING_BOOKING, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save booking draft:', error);
  }
};

/**
 * Retrieves a booking draft from session storage
 * @returns Booking draft or null if not found
 */
export const getBookingDraft = (): BookingDraft | null => {
  try {
    const draftRaw = sessionStorage.getItem(STORAGE_KEYS.PENDING_BOOKING);
    if (!draftRaw) return null;
    return JSON.parse(draftRaw) as BookingDraft;
  } catch (error) {
    console.error('Failed to parse booking draft:', error);
    clearBookingDraft();
    return null;
  }
};

/**
 * Clears the booking draft from session storage
 */
export const clearBookingDraft = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.PENDING_BOOKING);
  sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_TO_PROFILE);
};

/**
 * Sets the redirect to profile flag
 * @param shouldRedirect - Whether to redirect to profile after login
 */
export const setRedirectToProfile = (shouldRedirect: boolean): void => {
  if (shouldRedirect) {
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_TO_PROFILE, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_TO_PROFILE);
  }
};

/**
 * Checks if should redirect to profile after login
 * @returns True if should redirect, false otherwise
 */
export const shouldRedirectToProfile = (): boolean => {
  return sessionStorage.getItem(STORAGE_KEYS.REDIRECT_TO_PROFILE) === 'true';
};
