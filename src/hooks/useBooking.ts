/**
 * Custom hook for managing booking operations
 * @module hooks/useBooking
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import type {
  BookingDraft,
  SaveDraftOptions,
  PaymentMode,
  BookingHoldResult,
} from '@/types/booking.types';
import {
  saveBookingDraft,
  getBookingDraft,
  clearBookingDraft as clearDraftStorage,
  setRedirectToProfile,
} from '@/utils/booking/storage';
import { validateBookingDraft } from '@/utils/booking/validation';
import { logError, logInfo } from '@/utils/logger';

/**
 * Hook for managing booking operations
 * Provides functionality for draft management, validation, and booking creation
 * @returns Booking management functions and state
 */
export const useBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingBooking, setPendingBooking] = useState<BookingDraft | null>(
    null
  );

  /**
   * Load pending booking from session storage on mount
   */
  useEffect(() => {
    const draft = getBookingDraft();
    if (draft) {
      setPendingBooking(draft);
      logInfo('Pending booking loaded from session storage');
    }
  }, []);

  /**
   * Saves booking draft and redirects to login
   * @param draft - Booking draft to save
   * @param options - Save options
   */
  const saveDraftAndRedirect = useCallback(
    (draft: BookingDraft, options: SaveDraftOptions = {}) => {
      saveBookingDraft(draft);
      logInfo('Booking draft saved, redirecting to login');

      if (options.redirectToProfile) {
        setRedirectToProfile(true);
      }

      navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
    },
    [navigate]
  );

  /**
   * Clears the booking draft from storage and state
   */
  const clearDraft = useCallback(() => {
    clearDraftStorage();
    setPendingBooking(null);
    logInfo('Booking draft cleared');
  }, []);

  /**
   * Checks if user has a verified license
   * @returns Promise resolving to true if license is verified
   */
  const checkLicenseStatus = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const { data: licenses, error } = await supabase
        .from('licenses')
        .select('id, verified')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      const hasVerifiedLicense =
        licenses &&
        licenses.length > 0 &&
        (licenses[0] as { verified: boolean }).verified;

      return !!hasVerifiedLicense;
    } catch (error) {
      logError('License status check failed', error);
      toast({
        title: 'Error',
        description: 'Failed to check license status',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  /**
   * Creates a booking hold
   * @param draft - Booking draft data
   * @param payMode - Payment mode (full or hold)
   * @returns Promise resolving to booking hold result or null
   */
  const createBookingHold = useCallback(
    async (
      draft: BookingDraft,
      payMode: PaymentMode
    ): Promise<BookingHoldResult | null> => {
      logInfo('Creating booking hold', { payMode, hasUser: !!user });

      // Redirect to login if user is not authenticated
      if (!user) {
        saveDraftAndRedirect(draft);
        return null;
      }

      // Validate draft before submission
      const validationResult = validateBookingDraft(draft);
      if (!validationResult.valid) {
        toast({
          title: 'Validation Error',
          description: validationResult.error,
          variant: 'destructive',
        });
        return null;
      }

      try {
        logInfo('Calling create-hold edge function');

        const { data, error } = await supabase.functions.invoke('create-hold', {
          body: {
            carId: draft.carId,
            pickup: draft.pickup,
            return: draft.return,
            addons: draft.addons,
            totals: draft.totals,
            payMode,
          },
        });

        // Handle network errors
        if (error) {
          logError('Edge function invocation error', error);

          if (
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError')
          ) {
            toast({
              title: 'Connection Error',
              description:
                'Unable to connect to the server. Please check your internet connection.',
              variant: 'destructive',
            });
            return null;
          }

          throw error;
        }

        // Handle unsuccessful booking creation
        if (!data?.success) {
          const errorMsg = data?.error || 'Failed to create booking hold';
          logError('Booking hold creation failed', new Error(errorMsg));

          toast({
            title: 'Booking Failed',
            description: getUserFriendlyError(errorMsg),
            variant: 'destructive',
          });

          return {
            success: false,
            error: errorMsg,
            errorCode: data?.errorCode,
          };
        }

        // Success
        logInfo('Booking hold created successfully');
        toast({
          title: 'Booking Hold Created',
          description:
            payMode === 'hold'
              ? 'Your booking is reserved for 24 hours. Complete payment within this time.'
              : 'Booking created successfully.',
        });

        return data as BookingHoldResult;
      } catch (error) {
        logError('Booking hold creation error', error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create booking. Please try again.';

        // Only show toast if we haven't already
        if (!isErrorAlreadyDisplayed(errorMessage)) {
          toast({
            title: 'Booking Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        }

        return null;
      }
    },
    [user, saveDraftAndRedirect]
  );

  return {
    pendingBooking,
    saveDraftAndRedirect,
    clearDraft,
    checkLicenseStatus,
    createBookingHold,
  };
};

/**
 * Gets user-friendly error message
 * @param errorMsg - Raw error message
 * @returns User-friendly error message
 */
const getUserFriendlyError = (errorMsg: string): string => {
    const lowerMsg = errorMsg.toLowerCase();

    if (
      lowerMsg.includes('not available') ||
      lowerMsg.includes('already booked')
    ) {
      return 'This car is not available for the selected dates. Please choose different dates or another car.';
    }

    if (
      lowerMsg.includes('invalid date') ||
      lowerMsg.includes('must be after')
    ) {
      return 'The selected dates are invalid. Please ensure return date is after pickup date.';
    }

    if (lowerMsg.includes('rate limit')) {
      return 'Too many booking attempts. Please wait a moment and try again.';
    }

    if (lowerMsg.includes('validation') || lowerMsg.includes('invalid input')) {
      return 'Some booking information is invalid. Please check all fields and try again.';
    }

  return errorMsg;
};

/**
 * Checks if error has already been displayed to avoid duplicates
 * @param errorMessage - Error message to check
 * @returns True if error was already displayed
 */
const isErrorAlreadyDisplayed = (errorMessage: string): boolean => {
  const displayedErrors = [
    'This car is not available',
    'The selected dates are invalid',
    'Too many booking attempts',
    'Some booking information is invalid',
  ];

  return displayedErrors.some((msg) => errorMessage.startsWith(msg));
};