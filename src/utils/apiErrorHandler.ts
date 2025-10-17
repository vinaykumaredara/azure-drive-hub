// Centralized API error handling utility
import { errorLogger } from './errorLogger';
import { toast } from '@/hooks/use-toast';

export interface ApiErrorResponse {
  error: string;
  errorCode?: string;
  details?: string[];
  statusCode?: number;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiErrorHandler {
  /**
   * Handle API errors with specific user-friendly messages
   */
  static handleApiError(
    error: unknown,
    context: {
      component: string;
      action: string;
      showToast?: boolean;
    }
  ): ApiError {
    const { component, action, showToast = true } = context;
    
    let apiError: ApiError;
    
    // Parse error from different sources
    if (error instanceof ApiError) {
      apiError = error;
    } else if (error && typeof error === 'object' && 'error' in error) {
      const errObj = error as ApiErrorResponse;
      apiError = new ApiError(
        errObj.statusCode || 500,
        errObj.errorCode || 'UNKNOWN_ERROR',
        errObj.error || 'An unexpected error occurred',
        errObj.details
      );
    } else if (error instanceof Error) {
      apiError = new ApiError(
        500,
        'INTERNAL_ERROR',
        error.message
      );
    } else {
      apiError = new ApiError(
        500,
        'UNKNOWN_ERROR',
        'An unexpected error occurred'
      );
    }

    // Log error
    errorLogger.logError(apiError, { component, action }, 'high');

    // Show toast if enabled
    if (showToast) {
      const userMessage = this.getUserFriendlyMessage(apiError);
      
      toast({
        title: 'Error',
        description: userMessage,
        variant: 'destructive',
      });
    }

    return apiError;
  }

  /**
   * Convert error codes to user-friendly messages
   */
  private static getUserFriendlyMessage(error: ApiError): string {
    const errorMessages: Record<string, string> = {
      'CAR_NOT_FOUND': 'The requested car could not be found.',
      'CAR_NOT_AVAILABLE': 'This car is no longer available for booking.',
      'OVERLAPPING_BOOKING': 'This car is already booked for the selected dates.',
      'AVAILABILITY_CHECK_FAILED': 'Could not verify car availability. Please try again.',
      'DUPLICATE_BOOKING': 'A booking already exists for this time slot.',
      'INVALID_DATA': 'Invalid booking data. Please refresh and try again.',
      'TIMEOUT_ERROR': 'Request timed out. Please check your connection and try again.',
      'AUTHENTICATION_FAILED': 'Your session has expired. Please log in again.',
      'VALIDATION_ERROR': 'Some information is invalid. Please check your entries.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'NETWORK_ERROR': 'Network error. Please check your connection.',
    };

    return errorMessages[error.errorCode] || error.message;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    const nonRetryableErrors = [
      'CAR_NOT_FOUND',
      'CAR_NOT_AVAILABLE',
      'OVERLAPPING_BOOKING',
      'DUPLICATE_BOOKING',
      'AUTHENTICATION_FAILED',
    ];

    return !nonRetryableErrors.includes(error.errorCode);
  }

  /**
   * Get suggested action for error recovery
   */
  static getRecoveryAction(error: ApiError): string | undefined {
    const actions: Record<string, string> = {
      'CAR_NOT_AVAILABLE': 'Try selecting different dates or another car',
      'OVERLAPPING_BOOKING': 'Choose different dates or browse other cars',
      'INVALID_DATA': 'Refresh the page and try again',
      'TIMEOUT_ERROR': 'Check your connection and retry',
      'AUTHENTICATION_FAILED': 'Log in again to continue',
      'RATE_LIMIT_EXCEEDED': 'Wait 1 minute before trying again',
      'NETWORK_ERROR': 'Check your internet connection',
    };

    return actions[error.errorCode];
  }
}

/**
 * Convenience function for handling API errors
 */
export const handleApiError = (
  error: unknown,
  context: { component: string; action: string; showToast?: boolean }
): ApiError => {
  return ApiErrorHandler.handleApiError(error, context);
};
