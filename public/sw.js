// Enhanced Service Worker with caching strategies and Background Sync

const CACHE_NAME = 'rp-cars-v2.0.0';
const CACHE_VERSION = 2;

// App shell resources to precache
const APP_SHELL = [
  '/',
  '/index.html',
];

// Cache configuration
const CACHE_CONFIG = {
  images: {
    name: 'rp-cars-images-v2',
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  api: {
    name: 'rp-cars-api-v2',
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  static: {
    name: 'rp-cars-static-v2',
    maxEntries: 50,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  },
};

// Install event - precache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('rp-cars-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and dev server
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') {
    return;
  }

  // Strategy: Images - Cache First
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirst(request, CACHE_CONFIG.images));
    return;
  }

  // Strategy: API calls - Network First with fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, CACHE_CONFIG.api));
    return;
  }

  // Strategy: Static assets - Cache First
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'font' ||
      url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)) {
    event.respondWith(cacheFirst(request, CACHE_CONFIG.static));
    return;
  }

  // Strategy: HTML/Navigation - Network First
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, { name: CACHE_NAME }));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Cache First strategy
async function cacheFirst(request, config) {
  const cache = await caches.open(config.name);
  const cached = await cache.match(request);
  
  if (cached) {
    // Return cached and update in background
    fetchAndCache(request, config).catch(() => {});
    return cached;
  }

  return fetchAndCache(request, config);
}

// Network First strategy
async function networkFirst(request, config) {
  try {
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.ok) {
      const cache = await caches.open(config.name);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache fallback
    const cache = await caches.open(config.name);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(CACHE_NAME);
      const offlinePage = await offlineCache.match('/');
      if (offlinePage) return offlinePage;
    }
    
    throw error;
  }
}

// Fetch and cache helper
async function fetchAndCache(request, config) {
  const response = await fetch(request);
  
  if (response.ok) {
    const cache = await caches.open(config.name);
    
    // Implement cache size limits
    const keys = await cache.keys();
    if (keys.length >= (config.maxEntries || 50)) {
      await cache.delete(keys[0]);
    }
    
    cache.put(request, response.clone());
  }
  
  return response;
}

// Background Sync for outbox processing
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'outbox-sync') {
    event.waitUntil(syncOutbox());
  }
});

// Process outbox items
async function syncOutbox() {
  try {
    console.log('[SW] Processing outbox...');
    
    // Open IndexedDB and get outbox items
    const db = await openOutboxDB();
    const items = await getAllOutboxItems(db);
    
    console.log(`[SW] Found ${items.length} items in outbox`);
    
    for (const item of items) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
        
        if (response.ok) {
          // Success - remove from outbox
          await deleteOutboxItem(db, item.id);
          console.log('[SW] Synced item:', item.id);
        } else {
          console.error('[SW] Failed to sync item:', item.id, response.status);
        }
      } catch (error) {
        console.error('[SW] Error syncing item:', item.id, error);
      }
    }
    
    console.log('[SW] Outbox sync complete');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers
function openOutboxDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rp-cars-outbox', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllOutboxItems(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['outbox'], 'readonly');
    const store = transaction.objectStore('outbox');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteOutboxItem(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['outbox'], 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Message handler for manual sync triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_OUTBOX') {
    console.log('[SW] Manual sync requested');
    event.waitUntil(syncOutbox());
  }
});

console.log('[SW] Service Worker loaded');
