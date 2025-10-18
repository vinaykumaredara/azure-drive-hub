/**
 * Date and time validation utilities for booking flow
 * Ensures minimum rental duration and valid date ranges
 */

export interface DateTimeValidationResult {
  isValid: boolean;
  error?: string;
  hours?: number;
  days?: number;
}

/**
 * Validates that booking duration is at least 12 hours
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param startTime - Start time string (HH:MM)
 * @param endDate - End date string (YYYY-MM-DD)
 * @param endTime - End time string (HH:MM)
 * @returns Validation result with hours/days if valid
 */
export function validateBookingDuration(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): DateTimeValidationResult {
  if (!startDate || !endDate || !startTime || !endTime) {
    return {
      isValid: false,
      error: 'Please select all date and time fields'
    };
  }

  // Create Date objects for comparison
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date or time format'
    };
  }

  // Check if end is after start
  if (end <= start) {
    return {
      isValid: false,
      error: 'Return date/time must be after pickup date/time'
    };
  }

  // Calculate duration in milliseconds
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const durationDays = Math.ceil(durationHours / 24);

  // Minimum 12 hours required
  const MIN_HOURS = 12;
  
  if (durationHours < MIN_HOURS) {
    return {
      isValid: false,
      error: `Minimum rental duration is ${MIN_HOURS} hours. Current duration: ${durationHours.toFixed(1)} hours`
    };
  }

  return {
    isValid: true,
    hours: durationHours,
    days: durationDays
  };
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
}

/**
 * Formats duration for display
 */
export function formatDuration(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  
  if (days === 0) {
    return `${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  }
  
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
}
