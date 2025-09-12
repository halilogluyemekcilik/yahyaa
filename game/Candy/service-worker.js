const CACHE_NAME = 'seker-oyunu-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/', 
  '/index.html',
  '/offline.html',
  '/style.css?v=5.0',
  '/game.js',
  '/favicon-32x32.png',
  '/img/tr_logo.webp',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
  // Eğer img/ içindeki diğer resimler, müzikler veya ek JS varsa buraya ekle:
  // '/img/1.jpg', '/Muzik/bg.mp3', ...
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cachedResp => {
      if (cachedResp) return cachedResp;
      return fetch(req)
        .then(networkResp => {
          // isteğe bağlı: büyük dosyaları cachelememek isteyebilirsin
          return caches.open(CACHE_NAME).then(cache => {
            // klonlayıp cachele (başarısız olursa hata fırlatma)
            try {
              cache.put(req, networkResp.clone());
            } catch (e) { /* ignore */ }
            return networkResp;
          });
        })
        .catch(() => {
          // network yoksa ve istenen şey HTML ise offline fallback göster
          if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
