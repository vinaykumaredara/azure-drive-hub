import { v4 as uuidv4 } from 'uuid';

interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  baseDelay?: number;
  timeout?: number;
  idempotencyKey?: string;
  onRetry?: (attempt: number, error: any) => void;
}

interface FetchResult<T = any> {
  res: Response;
  body: T;
}

interface ErrorResponse {
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  };
}

const DEFAULT_RETRIES = 4;
const DEFAULT_BASE_DELAY = 500;
const DEFAULT_TIMEOUT = 10000;

/**
 * Fetch wrapper with timeout, exponential backoff, and idempotency support
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<FetchResult<T>> {
  const {
    method = 'GET',
    retries = DEFAULT_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
    timeout = DEFAULT_TIMEOUT,
    idempotencyKey,
    onRetry,
    headers = {},
    ...restOptions
  } = options;

  // Determine if request is idempotent (safe to retry)
  const isIdempotent = method === 'GET' || method === 'HEAD' || Boolean(idempotencyKey);

  // Generate idempotency key for POST/PUT/PATCH if not provided
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (idempotencyKey) {
    finalHeaders['Idempotency-Key'] = idempotencyKey;
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...restOptions,
        method,
        headers: finalHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let body: T | null = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          body = await response.json();
        } catch {
          body = null as T;
        }
      }

      if (!response.ok) {
        const errorBody = body as unknown as ErrorResponse;
        
        // Check if server explicitly says not retryable
        if (errorBody?.error?.retryable === false) {
          throw {
            res: response,
            body: errorBody,
            retryable: false,
          };
        }

        // 5xx errors are retryable
        if (response.status >= 500 && attempt < retries && isIdempotent) {
          throw {
            res: response,
            body: errorBody,
            retryable: true,
          };
        }

        // 408 Request Timeout, 429 Too Many Requests are retryable
        if ((response.status === 408 || response.status === 429) && attempt < retries && isIdempotent) {
          throw {
            res: response,
            body: errorBody,
            retryable: true,
          };
        }

        // Non-retryable client errors
        throw {
          res: response,
          body: errorBody,
          retryable: false,
        };
      }

      return { res: response, body: body as T };
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry if not idempotent
      if (!isIdempotent) {
        throw error;
      }

      // Don't retry if explicitly marked as non-retryable
      if (error.retryable === false) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= retries) {
        throw error;
      }

      // Network errors or aborts are retryable
      const isNetworkError = error.name === 'AbortError' || error.name === 'TypeError';
      const isRetryableError = error.retryable === true || isNetworkError;

      if (!isRetryableError) {
        throw error;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * baseDelay + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`Retrying request (attempt ${attempt + 1}/${retries}):`, url);
    }
  }

  throw lastError;
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(prefix = 'idem'): string {
  return `${prefix}_${uuidv4()}`;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (error?.retryable === false) return false;
  if (error?.retryable === true) return true;
  
  // Network errors are retryable
  if (error?.name === 'AbortError' || error?.name === 'TypeError') {
    return true;
  }

  // 5xx errors are retryable
  if (error?.res?.status >= 500) {
    return true;
  }

  return false;
}
