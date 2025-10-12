/**
 * Simple in-memory rate limiter for Edge Functions
 * For production, consider using Redis or Supabase for distributed rate limiting
 */

interface RateLimitConfig {
  tokensPerInterval: number;
  interval: 'second' | 'minute' | 'hour';
}

interface RateLimitEntry {
  tokens: number;
  lastReset: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Get interval in milliseconds
 */
function getIntervalMs(interval: 'second' | 'minute' | 'hour'): number {
  switch (interval) {
    case 'second': return 1000;
    case 'minute': return 60000;
    case 'hour': return 3600000;
  }
}

/**
 * Check if a client is within rate limits
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const intervalMs = getIntervalMs(config.interval);
  
  let entry = rateLimitStore.get(identifier);
  
  // Clean up old entries periodically (simple cleanup)
  if (rateLimitStore.size > 10000) {
    // Clear entries older than 1 hour
    const oneHourAgo = now - 3600000;
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.lastReset < oneHourAgo) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!entry || now - entry.lastReset > intervalMs) {
    // Reset tokens
    rateLimitStore.set(identifier, {
      tokens: config.tokensPerInterval - 1,
      lastReset: now
    });
    return true;
  }
  
  if (entry.tokens > 0) {
    // Consume a token
    entry.tokens--;
    rateLimitStore.set(identifier, entry);
    return true;
  }
  
  // Rate limit exceeded
  return false;
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  return forwardedFor?.split(',')[0]?.trim() || 
         realIp || 
         cfConnectingIp || 
         'unknown';
}
