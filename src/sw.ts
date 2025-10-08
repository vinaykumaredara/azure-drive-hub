// Enhanced Service Worker for caching and offline support with better performance

const CACHE_NAME = 'rp-cars-v2';
const urlsToCache = ['/', '/index.html', '/src/assets/*'];

// Enhanced cache strategy with versioning
const cacheStrategy = {
  // Cache static assets with long-term caching
  staticAssets: [/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i],
  // Cache API responses with shorter expiration
  apiResponses: ['/api/'],
};

// Install event - cache essential resources with better strategy
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate new service worker immediately
        return (self as any).skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event: any) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
            return undefined;
          })
        );
      })
      .then(() => {
        // Claim clients to activate service worker immediately
        return (self as any).clients.claim();
      })
  );
});

// Fetch event - enhanced caching strategy
self.addEventListener('fetch', (event: any) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Check if request is for static assets
  const isStaticAsset = cacheStrategy.staticAssets.some(pattern =>
    pattern.test(event.request.url)
  );

  // Check if request is for API
  const isAPI = cacheStrategy.apiResponses.some(pattern =>
    pattern.test(event.request.url)
  );

  // Network-first strategy for API requests
  if (isAPI) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(response => {
        // Return cached version or fetch from network
        return (
          response ||
          fetch(event.request).then(response => {
            // Cache the response for future requests
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return (
          response ||
          fetch(event.request).then(response => {
            // Cache the response for future requests (only successful responses)
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
        );
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 404 });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event: any) => {
  const title = 'RP Cars';
  const options = {
    body: event.data.text(),
    icon: '/logo.svg',
    badge: '/logo.svg',
  };

  event.waitUntil((self as any).registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil((self as any).clients.openWindow('/'));
});
