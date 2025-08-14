const CACHE_NAME = 'hukuk-takip-v1.0.2';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Service Worker kurulumu (hata toleranslı)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async (url) => {
      try {
        const resp = await fetch(url, { cache: 'no-cache' });
        if (resp && resp.ok) {
          await cache.put(url, resp.clone());
        } else {
          console.warn('[SW] Skip caching (bad response):', url, resp && resp.status);
        }
      } catch (err) {
        console.warn('[SW] Skip caching (fetch failed):', url, err);
      }
    }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)));
    await clients.claim();
  })());
});

// Fetch olaylarını yakala (cache-first, sonra network, başarılı GET'i runtime cache'le)
self.addEventListener('fetch', event => {
  const { request } = event;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const networkResp = await fetch(request);
      // Yalnızca başarılı GET isteklerini cache'e koy
      if (request.method === 'GET' && networkResp && networkResp.ok && networkResp.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResp.clone());
      }
      return networkResp;
    } catch (err) {
      // Network hatasında en azından 404 dön
      return new Response('Offline ve içerik önbellekte yok', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});

// Push notification desteği (opsiyonel)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni sınav sonucu eklendi!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png'
  };
  event.waitUntil(self.registration.showNotification('Hukuk Takip Sistemi', options));
});

// Notification tıklama olayı
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
