/**
 * Secure logging utility for production environments
 * Sanitizes sensitive data before logging
 */

const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Sanitizes sensitive strings by masking the middle portion
 * @param data - String to sanitize (user IDs, tokens, etc.)
 * @returns Sanitized string with masked content
 */
export const sanitizeForLogging = (data: string): string => {
  if (!data) return '****';
  
  if (data.length > 8) {
    return data.substring(0, 4) + '****' + data.substring(data.length - 4);
  }
  return '****';
};

/**
 * Sanitizes objects by removing or masking sensitive fields
 */
export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'phone', 'email'];
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '****';
    } else if (typeof value === 'string' && value.length > 20) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Safe info logging - only logs in development
 */
export const logInfo = (event: string, metadata?: Record<string, any>) => {
  if (IS_PRODUCTION) {
    // In production, send to external logging service (Sentry, LogRocket, etc.)
    // For now, we skip logging to prevent data exposure
    return;
  }
  console.log(`[INFO] ${event}`, metadata ? sanitizeObject(metadata) : '');
};

/**
 * Safe error logging - sanitizes error details
 */
export const logError = (event: string, error?: any, metadata?: Record<string, any>) => {
  if (IS_PRODUCTION) {
    // In production, send to external error tracking service
    // For now, we skip logging to prevent data exposure
    return;
  }
  
  const errorMessage = error?.message || String(error);
  console.error(`[ERROR] ${event}:`, errorMessage, metadata ? sanitizeObject(metadata) : '');
};

/**
 * Safe debug logging - only in development
 */
export const logDebug = (event: string, metadata?: Record<string, any>) => {
  if (IS_PRODUCTION) return;
  console.debug(`[DEBUG] ${event}`, metadata ? sanitizeObject(metadata) : '');
};

/**
 * Safe warning logging
 */
export const logWarn = (event: string, metadata?: Record<string, any>) => {
  if (IS_PRODUCTION) return;
  console.warn(`[WARN] ${event}`, metadata ? sanitizeObject(metadata) : '');
};
