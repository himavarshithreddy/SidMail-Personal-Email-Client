// Service Worker for SidMail PWA
const CACHE_VERSION = 'sidmail-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('sidmail-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            return self.clients.claim();
        })
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

    // Skip chrome extensions and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Exclude auth endpoints and attachments from caching
    if (url.pathname.match(/\/api\/auth/i) || url.pathname.match(/\/api\/.*\/attachments/i)) {
        return event.respondWith(fetch(request));
    }

    // Strategy for different resource types
    if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i)) {
        // Images: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    } else if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i) || url.pathname.startsWith('/_next/')) {
        // Static assets: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    } else if (url.pathname.startsWith('/api/')) {
        // API calls: Network First (cache mail headers, not attachments)
        event.respondWith(networkFirst(request, API_CACHE, 5000));
    } else {
        // HTML pages: Network First
        event.respondWith(networkFirst(request, DYNAMIC_CACHE, 3000));
    }
});

// Network First strategy
async function networkFirst(request, cacheName, timeout = 3000) {
    try {
        const networkPromise = fetch(request);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), timeout)
        );

        const response = await Promise.race([networkPromise, timeoutPromise]);

        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network first failed, trying cache:', error);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return new Response(
                `<!DOCTYPE html>
        <html>
          <head>
            <title>Offline - SidMail</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-center;
                min-height: 100vh;
                margin: 0;
                background: #0a0a0a;
                color: #fff;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 { font-size: 2rem; margin-bottom: 1rem; }
              p { color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>You're Offline</h1>
              <p>Please check your internet connection and try again.</p>
            </div>
          </body>
        </html>`,
                {
                    headers: { 'Content-Type': 'text/html' },
                }
            );
        }

        throw error;
    }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
}
