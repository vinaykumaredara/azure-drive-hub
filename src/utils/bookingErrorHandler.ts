// Comprehensive booking error handling utility
import { errorLogger, ErrorContext } from './errorLogger';
import { toast } from '@/hooks/use-toast';

export enum BookingErrorCode {
  CAR_NOT_AVAILABLE = 'CAR_NOT_AVAILABLE',
  INVALID_DATES = 'INVALID_DATES',
  DATES_IN_PAST = 'DATES_IN_PAST',
  OVERLAPPING_BOOKING = 'OVERLAPPING_BOOKING',
  MISSING_LICENSE = 'MISSING_LICENSE',
  INVALID_LICENSE = 'INVALID_LICENSE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface BookingError {
  code: BookingErrorCode;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  isRetryable: boolean;
  suggestedAction?: string;
}

const errorMap: Record<BookingErrorCode, Omit<BookingError, 'technicalDetails'>> = {
  [BookingErrorCode.CAR_NOT_AVAILABLE]: {
    code: BookingErrorCode.CAR_NOT_AVAILABLE,
    message: 'The selected car is no longer available',
    userMessage: 'This car is currently unavailable. Please select different dates or another car.',
    isRetryable: false,
    suggestedAction: 'Try selecting different dates or browse other available cars'
  },
  [BookingErrorCode.INVALID_DATES]: {
    code: BookingErrorCode.INVALID_DATES,
    message: 'Invalid date range provided',
    userMessage: 'The selected dates are invalid. Please check your pickup and return dates.',
    isRetryable: true,
    suggestedAction: 'Ensure return date is after pickup date'
  },
  [BookingErrorCode.DATES_IN_PAST]: {
    code: BookingErrorCode.DATES_IN_PAST,
    message: 'Booking dates cannot be in the past',
    userMessage: 'You cannot book dates in the past. Please select future dates.',
    isRetryable: true,
    suggestedAction: 'Select dates starting from today or later'
  },
  [BookingErrorCode.OVERLAPPING_BOOKING]: {
    code: BookingErrorCode.OVERLAPPING_BOOKING,
    message: 'This car is already booked for selected dates',
    userMessage: 'This car is already booked during your selected time. Please choose different dates.',
    isRetryable: false,
    suggestedAction: 'Select different dates or choose another car'
  },
  [BookingErrorCode.MISSING_LICENSE]: {
    code: BookingErrorCode.MISSING_LICENSE,
    message: 'Driver license is required',
    userMessage: 'Please upload your driver\'s license to continue booking.',
    isRetryable: true,
    suggestedAction: 'Upload a valid driver\'s license in the license step'
  },
  [BookingErrorCode.INVALID_LICENSE]: {
    code: BookingErrorCode.INVALID_LICENSE,
    message: 'License verification failed',
    userMessage: 'Your license could not be verified. Please upload a clear, valid license.',
    isRetryable: true,
    suggestedAction: 'Upload a clearer photo of your valid driver\'s license'
  },
  [BookingErrorCode.PAYMENT_FAILED]: {
    code: BookingErrorCode.PAYMENT_FAILED,
    message: 'Payment processing failed',
    userMessage: 'Payment could not be processed. Please check your payment details and try again.',
    isRetryable: true,
    suggestedAction: 'Verify your payment information and try again'
  },
  [BookingErrorCode.NETWORK_ERROR]: {
    code: BookingErrorCode.NETWORK_ERROR,
    message: 'Network connection error',
    userMessage: 'Connection lost. Please check your internet connection and try again.',
    isRetryable: true,
    suggestedAction: 'Check your internet connection and retry'
  },
  [BookingErrorCode.RATE_LIMIT]: {
    code: BookingErrorCode.RATE_LIMIT,
    message: 'Too many requests',
    userMessage: 'Too many booking attempts. Please wait a moment before trying again.',
    isRetryable: true,
    suggestedAction: 'Wait 1 minute before trying again'
  },
  [BookingErrorCode.AUTHENTICATION_ERROR]: {
    code: BookingErrorCode.AUTHENTICATION_ERROR,
    message: 'Authentication failed',
    userMessage: 'Your session has expired. Please log in again to continue.',
    isRetryable: true,
    suggestedAction: 'Log in again to continue booking'
  },
  [BookingErrorCode.VALIDATION_ERROR]: {
    code: BookingErrorCode.VALIDATION_ERROR,
    message: 'Invalid booking data',
    userMessage: 'Some booking information is invalid. Please review and correct your entries.',
    isRetryable: true,
    suggestedAction: 'Check all fields and ensure they are filled correctly'
  },
  [BookingErrorCode.SERVER_ERROR]: {
    code: BookingErrorCode.SERVER_ERROR,
    message: 'Server error occurred',
    userMessage: 'Something went wrong on our end. Please try again in a few moments.',
    isRetryable: true,
    suggestedAction: 'Try again in a few moments or contact support if the issue persists'
  },
  [BookingErrorCode.UNKNOWN_ERROR]: {
    code: BookingErrorCode.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    isRetryable: true,
    suggestedAction: 'Try again or contact support if the issue persists'
  }
};

export class BookingErrorHandler {
  private static parseErrorMessage(errorMessage: string): BookingErrorCode {
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('not available') || lowerMessage.includes('unavailable')) {
      return BookingErrorCode.CAR_NOT_AVAILABLE;
    }
    if (lowerMessage.includes('conflict') || lowerMessage.includes('already booked')) {
      return BookingErrorCode.OVERLAPPING_BOOKING;
    }
    if (lowerMessage.includes('invalid date') || lowerMessage.includes('date/time must be after')) {
      return BookingErrorCode.INVALID_DATES;
    }
    if (lowerMessage.includes('past')) {
      return BookingErrorCode.DATES_IN_PAST;
    }
    if (lowerMessage.includes('license')) {
      return BookingErrorCode.MISSING_LICENSE;
    }
    if (lowerMessage.includes('payment')) {
      return BookingErrorCode.PAYMENT_FAILED;
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return BookingErrorCode.NETWORK_ERROR;
    }
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
      return BookingErrorCode.RATE_LIMIT;
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('not authenticated')) {
      return BookingErrorCode.AUTHENTICATION_ERROR;
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid input')) {
      return BookingErrorCode.VALIDATION_ERROR;
    }
    if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
      return BookingErrorCode.SERVER_ERROR;
    }
    
    return BookingErrorCode.UNKNOWN_ERROR;
  }

  static handleError(
    error: unknown,
    context: ErrorContext,
    options: {
      showToast?: boolean;
      returnError?: boolean;
    } = {}
  ): BookingError {
    const { showToast = true, returnError = false } = options;
    
    let errorCode: BookingErrorCode;
    let technicalDetails = '';
    
    // Parse error from different sources
    if (error instanceof Error) {
      technicalDetails = error.message;
      errorCode = this.parseErrorMessage(error.message);
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      technicalDetails = errorObj.message || errorObj.error || JSON.stringify(error);
      errorCode = this.parseErrorMessage(technicalDetails);
    } else if (typeof error === 'string') {
      technicalDetails = error;
      errorCode = this.parseErrorMessage(error);
    } else {
      technicalDetails = 'Unknown error type';
      errorCode = BookingErrorCode.UNKNOWN_ERROR;
    }

    // Get error details from map
    const errorDetails = errorMap[errorCode];
    const bookingError: BookingError = {
      ...errorDetails,
      technicalDetails
    };

    // Log error with appropriate severity
    const severity = 
      errorCode === BookingErrorCode.VALIDATION_ERROR || 
      errorCode === BookingErrorCode.INVALID_DATES 
        ? 'low' 
        : errorCode === BookingErrorCode.SERVER_ERROR 
        ? 'critical' 
        : 'high';

    errorLogger.logError(
      error instanceof Error ? error : new Error(technicalDetails),
      context,
      severity
    );

    // Show toast notification
    if (showToast) {
      toast({
        title: bookingError.code === BookingErrorCode.UNKNOWN_ERROR ? 'Booking Error' : 'Booking Failed',
        description: bookingError.userMessage,
        variant: 'destructive',
      });

      // Show action hint if available
      if (bookingError.suggestedAction) {
        setTimeout(() => {
          toast({
            title: 'Suggestion',
            description: bookingError.suggestedAction,
          });
        }, 2000);
      }
    }

    if (returnError) {
      return bookingError;
    }

    return bookingError;
  }

  static isRetryable(error: BookingError): boolean {
    return error.isRetryable;
  }

  static getRecoveryAction(error: BookingError): string | undefined {
    return error.suggestedAction;
  }
}

// Convenience function for common booking error handling
export const handleBookingError = (
  error: unknown,
  context: Partial<ErrorContext> = {}
): BookingError => {
  return BookingErrorHandler.handleError(error, {
    component: context.component || 'BookingFlow',
    action: context.action || 'unknown',
    ...context
  });
};
