// Ana site için özel cache adı
const CACHE_NAME = 'yahya-haliloglu-main-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Diğer önemli dosyalar
];

// Kurulum
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Main SW] Cache açıldı:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch İşlemleri
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Alt uygulamaların isteklerini kesinlikle engelle
  if (requestUrl.pathname.startsWith('/game/')) {
    console.log('[Main SW] Alt uygulama isteği engellendi:', requestUrl.pathname);
    return;
  }
  
  // Sadece aynı origin'den gelen istekleri işle
  if (requestUrl.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache'te varsa
        if (response) {
          console.log('[Main SW] Cache\'den servis ediliyor:', requestUrl.pathname);
          return response;
        }
        
        // Network'ten getir ve cache'e ekle
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            return new Response('<h1>Çevrimdışı Mod</h1>', {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
  );
});

// Eski Cache'leri Temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              !cacheName.startsWith('tytAyt-takip-') && 
              !cacheName.startsWith('hmgs-takip-')) {
            console.log('[Main SW] Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});