# Offline Resilience System

## Overview

This document describes the comprehensive offline and error-handling system implemented for RP Cars. The system provides robust network detection, automatic retry with exponential backoff, local queuing for failed requests, and Service Worker-based caching.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Network    │    │    Fetch     │    │   Outbox     │  │
│  │   Status     │◄───┤   Wrapper    │◄───┤   Manager    │  │
│  │   Hook       │    │  (Retry)     │    │  (IndexedDB) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UI Components (Banner, Toast)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Service Worker                           │
├──────────────────────────────────────────────────────────────┤
│  • Precache app shell                                         │
│  • Runtime caching (images, API, static)                      │
│  • Background Sync (process outbox when online)               │
│  • Cache strategies: Network-first, Cache-first               │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Backend (Supabase)                        │
├──────────────────────────────────────────────────────────────┤
│  • Idempotency middleware                                     │
│  • Standard error format with retryable flags                 │
│  • Timeout handling                                           │
└──────────────────────────────────────────────────────────────┘
```

## Components

### 1. Network Status Hook (`useNetworkStatus.ts`)

Provides comprehensive network detection:
- **navigator.onLine**: Browser's network status
- **Heartbeat check**: Active connectivity verification every 15s
- **Failure threshold**: Requires 2 consecutive failures before marking offline
- **Debouncing**: Prevents flapping between online/offline states

**Usage:**
```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const { online, effectiveOnline, lastCheckedAt } = useNetworkStatus();
```

### 2. Fetch Wrapper (`fetchWithRetry.ts`)

Robust fetch implementation with:
- **Timeout**: 10s default with AbortController
- **Exponential backoff**: Base 500ms delay with jitter
- **Retry logic**: Up to 4 attempts for idempotent requests
- **Idempotency support**: Automatic key generation and header attachment
- **Error classification**: Distinguishes retryable vs non-retryable errors

**Usage:**
```typescript
import { fetchWithRetry, generateIdempotencyKey } from '@/lib/fetchWithRetry';

// GET request (auto-retryable)
const { body } = await fetchWithRetry('/api/cars');

// POST with idempotency
const { body } = await fetchWithRetry('/api/bookings/draft', {
  method: 'POST',
  idempotencyKey: generateIdempotencyKey('booking'),
  body: JSON.stringify(data),
  onRetry: (attempt, error) => {
    console.log(`Retry ${attempt}:`, error);
  }
});
```

### 3. Outbox Queue (`outbox.ts`)

IndexedDB-based local queue for failed requests:
- **Automatic queuing**: Failed queueable requests saved locally
- **Background processing**: Auto-sync when network restored
- **Max attempts**: 5 attempts per item before giving up
- **Safe endpoints**: Whitelist prevents queuing sensitive operations

**Queueable endpoints:**
- `/api/contact` - Contact forms
- `/api/messages` - Chat messages
- `/api/feedback` - User feedback
- `/api/preferences` - User settings
- `/api/bookings/draft` - Draft bookings (NOT confirmed)

**Non-queueable (blocked when offline):**
- `/api/payment` - Payment operations
- `/api/charge` - Charge operations
- `/api/bookings/confirm` - Confirmed bookings
- `/api/checkout` - Checkout operations

**Usage:**
```typescript
import { enqueueRequest, processOutbox, isQueueableEndpoint } from '@/lib/outbox';

// Queue a request
if (!navigator.onLine && isQueueableEndpoint(endpoint)) {
  await enqueueRequest({
    endpoint,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    idempotencyKey: generateIdempotencyKey(),
    type: 'queueable',
  });
}

// Process queue manually
await processOutbox();
```

### 4. Offline Banner Component

Persistent UI indicator showing:
- **Network status**: Online/offline state
- **Queue count**: Number of pending requests
- **Sync button**: Manual sync trigger
- **Last checked time**: Last connectivity check timestamp

### 5. Service Worker (`public/sw.js`)

Enhanced caching and background sync:

**Precaching:**
- App shell (/, /index.html)
- Critical assets loaded at install

**Runtime Caching Strategies:**
- **Images**: Cache-first with 100 entry limit, 30-day expiration
- **API**: Network-first with 5-minute cache fallback
- **Static assets**: Cache-first with 7-day expiration
- **Navigation**: Network-first with offline page fallback

**Background Sync:**
- Automatic outbox processing when network restored
- Manual sync via `postMessage` API

### 6. Server-Side Idempotency

Middleware for preventing duplicate operations:
- **Idempotency-Key header**: Client sends unique key
- **Response caching**: Server caches response by key
- **Replay protection**: Returns cached response for duplicate keys
- **User verification**: Keys scoped to user ID

**Database Schema:**
```sql
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID,
  request_body JSONB,
  response_body JSONB,
  status_code INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## User Experience

### Offline State
1. User goes offline
2. Banner appears: "You're offline - some features are unavailable"
3. Queued requests shown: "3 queued"
4. User can continue browsing cached content

### Making Requests Offline
1. User tries to submit form
2. If queueable: "Saved locally. Will sync when you're back online."
3. If payment: "Payment not completed - no charge was made. Retry when online."

### Coming Back Online
1. Network restored
2. Automatic sync triggered
3. Toast: "Sync Complete - 3 queued action(s) synced successfully"
4. Banner dismisses automatically

### Request Timeout
1. Request exceeds 10s timeout
2. Toast: "Request timed out. Retry"
3. Retry button provided

## Testing Locally

### 1. Test Network Detection
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Network tab > Throttling dropdown
3. Select "Offline"
4. Verify banner appears
5. Select "Online"
6. Verify banner disappears
```

### 2. Test Outbox Queue
```bash
1. Go offline (Chrome DevTools)
2. Submit a contact form
3. Check IndexedDB: Application > IndexedDB > rp-cars-outbox
4. Verify item saved
5. Go online
6. Verify auto-sync and item removed
```

### 3. Test Service Worker
```bash
1. Build production: npm run build
2. Serve: npx serve dist
3. Load site in browser
4. Check Application > Service Workers
5. Verify SW registered
6. Go offline
7. Reload page - should load from cache
8. Verify images cached: Application > Cache Storage
```

### 4. Test Retry Logic
```javascript
// In browser console
import { fetchWithRetry } from './src/lib/fetchWithRetry';

// Simulate slow/failing endpoint
fetchWithRetry('https://httpstat.us/500?sleep=2000', {
  retries: 3,
  onRetry: (attempt, error) => {
    console.log(`Retry ${attempt}:`, error);
  }
});
```

### 5. Test Idempotency
```bash
# Same request twice with same key
curl -X POST http://localhost:3000/api/bookings/draft \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"car_id": "123", "dates": "..."}'

# Second call should return cached response with header:
# X-Idempotent-Replay: true
```

## Manual QA Checklist

- [ ] Offline banner appears when network disconnected
- [ ] Banner shows correct queue count
- [ ] Queued items persist across page reloads
- [ ] Auto-sync triggers when network restored
- [ ] Manual sync button works
- [ ] Payment operations blocked when offline
- [ ] Contact forms queue successfully
- [ ] Cached images load when offline
- [ ] App shell loads from cache offline
- [ ] Retry logic respects exponential backoff
- [ ] Idempotency prevents duplicate operations
- [ ] Timeout shows clear error message
- [ ] Last checked time updates regularly

## Performance Metrics

### Before Implementation
- No offline support
- No retry logic
- No request queuing
- Manual page reload required on network errors

### After Implementation
- Full offline navigation via cached app shell
- Automatic retry for transient failures
- Local queue preserves user actions
- Background sync when network restored
- Improved perceived performance via caching

## Known Limitations

1. **IndexedDB storage limits**: Browser-dependent (typically 50MB-2GB)
2. **Background Sync support**: Not available in all browsers (Safari)
3. **Service Worker scope**: Only works on HTTPS (or localhost)
4. **Payment safety**: Payments never queued - requires real-time confirmation

## Future Improvements

1. **Conflict resolution**: Handle concurrent updates when syncing
2. **Partial updates**: Support for PATCH with delta changes
3. **Compression**: Compress queued payloads to save storage
4. **Analytics**: Track offline usage patterns
5. **Smart caching**: ML-based prediction of cacheable resources
6. **Progressive enhancement**: Tiered features based on connectivity

## Security Considerations

- ✅ No payment data stored in outbox or cache
- ✅ Idempotency keys scoped to user ID
- ✅ Service Worker only caches public resources
- ✅ Auth tokens never cached
- ✅ HTTPS required for Service Worker in production

## Dependencies Added

```json
{
  "idb": "^8.0.0",  // IndexedDB wrapper
  "uuid": "^10.0.0" // Idempotency key generation
}
```

## Migration Database

To enable idempotency, run this migration:

```sql
-- Create idempotency keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  request_body JSONB,
  response_body JSONB,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_idempotency_keys_user_id ON public.idempotency_keys(user_id);

-- Index for cleanup
CREATE INDEX idx_idempotency_keys_created_at ON public.idempotency_keys(created_at);

-- Auto-cleanup old keys (7 days)
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-idempotency', '0 0 * * *', 'SELECT cleanup_old_idempotency_keys()');
```

## Support

For issues or questions:
1. Check console logs (prefix: `[SW]` for Service Worker)
2. Inspect IndexedDB: DevTools > Application > IndexedDB
3. Check Service Worker: DevTools > Application > Service Workers
4. Review network logs for retry attempts

## License

Same as main project.
