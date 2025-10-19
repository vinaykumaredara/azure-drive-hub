import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OutboxItem {
  id: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  idempotencyKey: string;
  type: 'queueable' | 'non-payment';
  createdAt: number;
  attempts: number;
  lastAttemptAt?: number;
  error?: string;
}

interface OutboxDB extends DBSchema {
  outbox: {
    key: string;
    value: OutboxItem;
    indexes: { 'by-created': number };
  };
}

const DB_NAME = 'rp-cars-outbox';
const DB_VERSION = 1;
const STORE_NAME = 'outbox';
const MAX_ATTEMPTS = 5;

let dbPromise: Promise<IDBPDatabase<OutboxDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<OutboxDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OutboxDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<OutboxDB>) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-created', 'createdAt');
      },
    });
  }
  return dbPromise;
}

/**
 * Enqueue a request for later processing
 */
export async function enqueueRequest(item: Omit<OutboxItem, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
  const db = await getDB();
  
  const outboxItem: OutboxItem = {
    ...item,
    id: `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    attempts: 0,
  };

  await db.add(STORE_NAME, outboxItem);
  
  console.log('📦 Queued request:', outboxItem.id, outboxItem.endpoint);
  
  return outboxItem.id;
}

/**
 * Get all items from the outbox
 */
export async function getOutbox(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'by-created');
}

/**
 * Get a specific item from the outbox
 */
export async function getOutboxItem(id: string): Promise<OutboxItem | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

/**
 * Remove an item from the outbox
 */
export async function removeOutboxItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
  console.log('✅ Removed from outbox:', id);
}

/**
 * Clear all items from the outbox
 */
export async function clearOutbox(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
  console.log('🧹 Cleared outbox');
}

/**
 * Process a single outbox item
 */
export async function processOutboxItem(id: string): Promise<{ success: boolean; error?: string }> {
  const db = await getDB();
  const item = await db.get(STORE_NAME, id);

  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  // Check if max attempts reached
  if (item.attempts >= MAX_ATTEMPTS) {
    console.error('❌ Max attempts reached for:', id);
    return { success: false, error: 'Max attempts reached' };
  }

  try {
    // Update attempt count
    item.attempts += 1;
    item.lastAttemptAt = Date.now();
    await db.put(STORE_NAME, item);

    console.log(`📤 Processing outbox item (attempt ${item.attempts}/${MAX_ATTEMPTS}):`, item.endpoint);

    const response = await fetch(item.endpoint, {
      method: item.method,
      headers: {
        ...item.headers,
        'Idempotency-Key': item.idempotencyKey,
      },
      body: item.body ? JSON.stringify(item.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Success - remove from outbox
    await removeOutboxItem(id);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to process outbox item:', id, error);
    
    // Update error in item
    item.error = error.message;
    await db.put(STORE_NAME, item);
    
    return { success: false, error: error.message };
  }
}

/**
 * Process all items in the outbox
 */
export async function processOutbox(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const items = await getOutbox();
  
  if (items.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  console.log(`📦 Processing ${items.length} queued items...`);

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const result = await processOutboxItem(item.id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  console.log(`✅ Processed outbox: ${succeeded} succeeded, ${failed} failed`);

  return {
    processed: items.length,
    succeeded,
    failed,
  };
}

/**
 * Check if an endpoint is queueable (safe to retry)
 */
export function isQueueableEndpoint(endpoint: string): boolean {
  const queueablePatterns = [
    '/api/contact',
    '/api/messages',
    '/api/feedback',
    '/api/preferences',
    '/api/bookings/draft', // Only drafts, not confirmed bookings
  ];

  const nonQueueablePatterns = [
    '/api/payment',
    '/api/charge',
    '/api/bookings/confirm', // Real bookings with payment
    '/api/checkout',
  ];

  // Check non-queueable first (higher priority)
  if (nonQueueablePatterns.some(pattern => endpoint.includes(pattern))) {
    return false;
  }

  return queueablePatterns.some(pattern => endpoint.includes(pattern));
}

/**
 * Get count of items in outbox
 */
export async function getOutboxCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
