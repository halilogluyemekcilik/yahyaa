const CACHE_NAME = 'yahya-haliloglu-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Diğer önemli dosyalarınızı buraya ekleyin
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
});

// Fetch olayları - çevrimdışı çalışma
self.addEventListener('fetch', function(event) {
  // *** BURADA EKLEME YAPILDI ***
  // hmgsSinavTakipSistemi klasörüne ait istekleri ana SW'nin dışında tut
  if (event.request.url.includes('/game/hmgsSinavTakipSistemi/')) {
    return; // Bu istekleri atla, ana SW'nin işi değil
  }
  // *** EKLEME SONU ***

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache'de varsa cache'den döndür
        if (response) {
          return response;
        }
        
        // Cache'de yoksa internetten getir
        return fetch(event.request).then(
          function(response) {
            // Geçerli response kontrolü
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Response'u klonla
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

// Eski cache'leri temizle
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
});