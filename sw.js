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
  // *** HUKUK UYGULAMASINI TAMAMEN DIŞLA ***
  if (event.request.url.includes('/game/hmgsSinavTakipSistemi/')) {
    return; // Bu istekleri atla, kendi SW'si halletsin
  }
  
  // *** PWA KURULUM İSTEKLERİNİ DIŞLA ***
  if (event.request.url.includes('manifest.json') && 
      event.request.url.includes('/game/hmgsSinavTakipSistemi/')) {
    return; // Hukuk uygulamasının manifest'ini ana SW karışmasın
  }

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

// Fetch olayları - çevrimdışı çalışma
self.addEventListener('fetch', function(event) {
  // *** HUKUK UYGULAMASINI TAMAMEN DIŞLA ***
  if (event.request.url.includes('/game/tyt-aytSinavTakipSistemi/')) {
    return; // Bu istekleri atla, kendi SW'si halletsin
  }
  
  // *** PWA KURULUM İSTEKLERİNİ DIŞLA ***
  if (event.request.url.includes('manifest.json') && 
      event.request.url.includes('/game/tyt-aytSinavTakipSistemi/')) {
    return; // Hukuk uygulamasının manifest'ini ana SW karışmasın
  }

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
                    // Sadece TYT-AYT, hukuk-takip ve deneme-sinav-takip cache'lerini koru
                    if (cacheName !== CACHE_NAME && 
                        !cacheName.includes('hukuk-takip') &&
                        !cacheName.includes('deneme-sinav-takip')) {
                        console.log('Eski cache siliniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});