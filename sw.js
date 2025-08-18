const CACHE_NAME = 'yahya-haliloglu-v2';
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
        console.log('Ana uygulama cache açıldı');
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
  
  // *** TYT UYGULAMASINI TAMAMEN DIŞLA ***
  if (event.request.url.includes('/game/tyt-aytSinavTakipSistemi/')) {
    return; // Bu istekleri atla, kendi SW'si halletsin
  }
  
// *** ALT UYGULAMALARIN MANIFEST VE KAYNAKLARINI DIŞLA ***
const excludedPaths = [
  '/game/hmgsSinavTakipSistemi/',
  '/game/tyt-aytSinavTakipSistemi/'
];

if (excludedPaths.some(path => event.request.url.includes(path))) {
  return;
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
          // Hukuk ve TYT uygulamalarının cache'lerini silme!
          if (cacheName !== CACHE_NAME && 
              !cacheName.includes('hukuk-takip') && 
              !cacheName.includes('tyt-takip')) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});