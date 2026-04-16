const CACHE_NAME = 'pwa-master-cache-v3'; // Versioned for easy updates

// Cache version for debugging
const CACHE_VERSION = '3.0.0';

// =============================================
// URLS TO CACHE (Offline resources)
// Recommended: Cache core assets for offline functionality
// =============================================
const urlsToCache = [
  '/', // Root/homepage
  '/index.html', // Main HTML file
  '/manifest.json', // Web app manifest
  '/offline.html', // Offline fallback page (recommended to create)
  '/fallback.html', // Alternative fallback

  // Core CSS files (add your actual paths)
  // '/css/styles.css',
  // '/css/main.css',

  // Core JavaScript files
  // '/js/app.js',
  // '/js/main.js',

  // Icons - all common sizes from your manifests
  '/favicon.ico',
  '/logo16.png',
  '/logo32.png',
  '/logo48.png',
  '/logo64.png',
  '/logo96.png',
  '/logo120.png',
  '/logo128.png',
  '/logo152.png',
  '/logo180.png',
  '/logo192.png',
  '/logo512.png',
  '/maskable_icon.png',
  '/icon-48x48.png',
  '/icon-96x96.png',
  '/icon-192x192.png',

  // Alternative icon paths from your inputs
  '/icons/logo192.png',
];

// =============================================
// INSTALL EVENT
// Caches specified resources and activates immediately
// =============================================
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version ${CACHE_VERSION}`);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete, skipping waiting');
        return self.skipWaiting(); // Forces waiting service worker to become active
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// =============================================
// ACTIVATE EVENT
// Cleans up old caches and claims control immediately
// =============================================
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version ${CACHE_VERSION}`);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        console.log('[Service Worker] Existing caches:', cacheNames);

        // List of cache names to keep (current and any others we want to preserve)
        const cachesToKeep = [CACHE_NAME];

        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cachesToKeep.includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim(); // Takes control of all clients immediately
      })
  );
});

// =============================================
// FETCH EVENT
// Implements Cache-First strategy with network fallback
// =============================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (optional, can be enabled for specific use cases)
  // if (!event.request.url.startsWith(self.location.origin)) {
  //   return;
  // }

  // Skip analytics/beacon requests (optional optimization)
  if (
    event.request.url.includes('/analytics/') ||
    event.request.url.includes('/beacon/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Otherwise fetch from network
      console.log('[Service Worker] Fetching from network:', event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          // Clone response for caching
          const responseToCache = networkResponse.clone();

          // Cache the fetched response for future offline use
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              console.log(
                '[Service Worker] Caching new resource:',
                event.request.url
              );
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.warn('[Service Worker] Failed to cache resource:', error);
            });

          return networkResponse;
        })
        .catch((error) => {
          console.warn('[Service Worker] Fetch failed:', error);

          // =============================================
          // OFFLINE FALLBACK HANDLING
          // Returns appropriate fallback based on request type
          // =============================================

          // For HTML page requests, return offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            console.log('[Service Worker] Serving offline HTML fallback');
            return caches.match('/offline.html').then((offlineResponse) => {
              if (offlineResponse) {
                return offlineResponse;
              }
              // Ultimate fallback if offline.html isn't cached
              return new Response(
                '<!DOCTYPE html><html><head><title>Offline</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:sans-serif;text-align:center;padding:2rem;background:#f5f5f5}</style></head><body><h1>🔌 You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()">Retry</button></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          }

          // For image requests, return a placeholder image
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            console.log(
              '[Service Worker] Serving image placeholder for offline'
            );
            return caches.match('/logo192.png').then((imageFallback) => {
              if (imageFallback) {
                return imageFallback;
              }
              // Return transparent pixel if no logo cached
              return new Response(
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23cccccc"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666666"%3E📷%3C/text%3E%3C/svg%3E',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
          }

          // For API/fetch requests, return empty JSON
          if (event.request.url.includes('/api/')) {
            console.log(
              '[Service Worker] Returning empty JSON for offline API'
            );
            return new Response(
              JSON.stringify({ offline: true, message: 'You are offline' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }

          // Default fallback - return basic response
          return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// =============================================
// NOTIFICATION CLICK HANDLER
// Handles user interaction with notifications
// =============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);

  // Close the notification
  event.notification.close();

  // Extract data from notification
  const notificationData = event.notification.data || {};
  const clickUrl = notificationData.clickUrl || '/';
  const action = event.action;

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url === clickUrl && 'focus' in client) {
            console.log('[Service Worker] Focusing existing client');
            return client.focus();
          }
        }

        // Handle specific actions
        if (action === 'view') {
          console.log('[Service Worker] Opening view action URL:', clickUrl);
          if (self.clients.openWindow) {
            return self.clients.openWindow(clickUrl);
          }
        } else if (action === 'dismiss') {
          console.log('[Service Worker] Notification dismissed');
          return;
        }

        // Default: open new window
        console.log('[Service Worker] Opening new window to:', clickUrl);
        if (self.clients.openWindow) {
          return self.clients.openWindow(clickUrl);
        }
      })
  );
});

// =============================================
// PUSH EVENT HANDLER
// Handles incoming push notifications from server
// =============================================
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'PWA Update', // Default title
    body: 'New content available',
    icon: '/logo192.png',
    badge: '/logo128.png',
    vibrate: [200, 100, 200],
    data: {
      clickUrl: '/',
      dateOfArrival: Date.now(),
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const parsedData = event.data.json();
      notificationData = { ...notificationData, ...parsedData };
    } catch (e) {
      // If not JSON, treat as plain text
      notificationData.body = event.data.text();
    }
  }

  // Use provided title or fallback to CACHE_NAME derived title
  const title = notificationData.title || 'App Update';

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo512.png',
    badge: notificationData.badge || '/logo128.png',
    vibrate: notificationData.vibrate || [200, 100, 200],
    data: notificationData.data || { clickUrl: '/' },
    // Recommended: Add actions for better UX
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    // Tag groups notifications for replacement
    tag: notificationData.tag || 'pwa-notification',
    // Renotify only if true
    renotify: false,
    // Require interaction keeps notification until user acts
    requireInteraction: false,
    // Silent mode for non-intrusive notifications
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================================
// MESSAGE EVENT HANDLER
// Handles messages from client pages (optional but recommended)
// =============================================
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skipping waiting on client request');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache on client request');
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Cache cleared');
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ status: 'cache_cleared' });
      }
    });
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then((cacheNames) => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          status: 'cache_status',
          caches: cacheNames,
          activeCache: CACHE_NAME,
          version: CACHE_VERSION,
        });
      }
    });
  }
});

// =============================================
// PERIODIC SYNC (Optional - requires additional setup)
// For background sync capabilities
// =============================================
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync triggered:', event.tag);

  if (event.tag === 'update-content') {
    event.waitUntil(
      // Add your background sync logic here
      // Example: fetch latest data and update cache
      fetch('/api/latest')
        .then((response) => response.json())
        .then((data) => {
          console.log('[Service Worker] Background sync completed');
          // Optionally show notification
          self.registration.showNotification('Content Updated', {
            body: 'New content is available',
            icon: '/logo192.png',
          });
        })
        .catch((error) => {
          console.error('[Service Worker] Background sync failed:', error);
        })
    );
  }
});

// =============================================
// BACKGROUND SYNC (Standard)
// For offline actions that need to sync when online
// =============================================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync event:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Add your sync logic here
      // Example: sync offline form submissions
      console.log('[Service Worker] Syncing data...')
    );
  }
});

// =============================================
// ERROR HANDLING & LOGGING
// =============================================
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled rejection:', event.reason);
});

// =============================================
// INSTALLATION STATISTICS (Optional)
// Logs installation for analytics
// =============================================
self.addEventListener('install', (event) => {
  // Analytics ping (optional - uncomment if needed)
  // fetch('/api/sw-installed', {
  //   method: 'POST',
  //   body: JSON.stringify({ version: CACHE_VERSION, timestamp: Date.now() }),
  //   headers: { 'Content-Type': 'application/json' }
  // }).catch(() => {});
});

// =============================================
// EXPOSE CACHE NAME FOR CLIENT COMMUNICATION
// Allows client pages to know current cache name
// =============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_NAME') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        cacheName: CACHE_NAME,
        version: CACHE_VERSION,
      });
    }
  }
});

console.log(
  `[Service Worker] Service Worker v${CACHE_VERSION} initialized with cache: ${CACHE_NAME}`
);
