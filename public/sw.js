// Service Worker for SLASH PWA
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'slash-pwa-v1'
const STATIC_CACHE = 'slash-static-v1'
const DYNAMIC_CACHE = 'slash-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add more static assets as needed
]

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/forms/,
  /^\/api\/sample-types/,
  /^\/api\/projects/,
  /^\/api\/participants/,
  /^\/api\/households/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('SW: Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('SW: Error caching static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('SW: Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  // Handle static assets
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request))
    return
  }

  // Handle other requests (images, scripts, etc.)
  event.respondWith(handleAssetRequest(request))
})

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone())
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
      
      if (shouldCache) {
        const cache = await caches.open(DYNAMIC_CACHE)
        cache.put(request.clone(), networkResponse.clone())
      }
    }
    
    return networkResponse
  } catch (error) {
    console.log('SW: Network failed for API request, trying cache:', url.pathname)
    
    // If network fails and it's a GET request, try cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - Unable to complete request',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle document requests with cache-first strategy
async function handleDocumentRequest(request) {
  try {
    // Try network first for documents
    const networkResponse = await fetch(request)
    
    // Cache the response
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request.clone(), networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page if available
    const offlineResponse = await caches.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Fallback response
    return new Response(
      '<h1>Offline</h1><p>You are currently offline. Please check your connection.</p>',
      {
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Handle asset requests with cache-first strategy
async function handleAssetRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request)
    
    // Cache the response
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request.clone(), networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    // Return a fallback for failed asset requests
    return new Response('Asset not available offline', {
      status: 404,
      statusText: 'Not Found'
    })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag)
  
  if (event.tag === 'data-sync') {
    event.waitUntil(syncOfflineData())
  }
})

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('SW: Starting offline data sync')
    
    // Notify the main thread to start sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'START_SYNC'
      })
    })
    
    return true
  } catch (error) {
    console.error('SW: Background sync failed:', error)
    return false
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const { action, data } = event
  
  event.waitUntil(
    clients.openWindow(data.url || '/')
  )
})

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { data } = event
  
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (data.type === 'CACHE_UPDATE') {
    // Handle cache updates from main thread
    updateCache(data.urls)
  }
})

// Update cache with new URLs
async function updateCache(urls) {
  if (!Array.isArray(urls)) return
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    await cache.addAll(urls)
    console.log('SW: Cache updated with new URLs')
  } catch (error) {
    console.error('SW: Error updating cache:', error)
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'data-backup') {
    event.waitUntil(performDataBackup())
  }
})

async function performDataBackup() {
  try {
    console.log('SW: Performing periodic data backup')
    
    // Notify main thread to backup data
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_BACKUP',
        action: 'START_BACKUP'
      })
    })
  } catch (error) {
    console.error('SW: Periodic backup failed:', error)
  }
}

console.log('SW: Service worker script loaded')
