const CACHE_NAME = 'galeri-temizleyici-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Service Worker kurulumu
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Önbellekten dosya servisi
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Önbellekte varsa döndür
        if (response) {
          return response;
        }
        // Yoksa internetten çek
        return fetch(event.request).then(
          function(response) {
            // Geçerli yanıt mı kontrol et
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Yanıtı klonla ve önbelleğe ekle
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Eski önbellekleri temizle
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});