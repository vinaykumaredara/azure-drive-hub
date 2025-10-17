/**
 * Custom hook for booking validation
 * @module hooks/useBookingValidation
 */

import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  validatePhoneNumber,
  validateBookingDraft,
  validateBookingData,
  validateDateRange,
} from '@/utils/booking/validation';
import type { BookingData, BookingDraft } from '@/types/booking.types';

/**
 * Hook for booking validation with user feedback
 * @returns Validation functions
 */
export const useBookingValidation = () => {
  /**
   * Validates phone number and shows toast on error
   */
  const validatePhone = useCallback((phoneNumber: string): boolean => {
    if (!phoneNumber) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return false;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit Indian mobile number',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  }, []);

  /**
   * Validates booking draft and shows toast on error
   */
  const validateDraft = useCallback((draft: BookingDraft): boolean => {
    const result = validateBookingDraft(draft);
    if (!result.valid) {
      toast({
        title: 'Validation Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    return result.valid;
  }, []);

  /**
   * Validates booking data and shows toast on error
   */
  const validateData = useCallback((bookingData: BookingData): boolean => {
    const result = validateBookingData(bookingData);
    if (!result.valid) {
      toast({
        title: 'Validation Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    return result.valid;
  }, []);

  /**
   * Validates date range and shows toast on error
   */
  const validateDates = useCallback(
    (startDate: string, endDate: string): boolean => {
      const result = validateDateRange(startDate, endDate);
      if (!result.valid) {
        toast({
          title: 'Invalid Dates',
          description: result.error,
          variant: 'destructive',
        });
      }
      return result.valid;
    },
    []
  );

  return {
    validatePhone,
    validateDraft,
    validateData,
    validateDates,
  };
};
