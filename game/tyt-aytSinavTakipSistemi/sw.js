// TYT-AYT özel cache adı (versiyon numarası ekleyin güncellemelerde)
const CACHE_NAME = 'tytAyt-takip-v2.1';
const CORE_ASSETS = [
  '/game/tyt-aytSinavTakipSistemi/index.html',
  '/game/tyt-aytSinavTakipSistemi/style.css',
  '/game/tyt-aytSinavTakipSistemi/script.js',
  '/game/tyt-aytSinavTakipSistemi/manifest.json',
  '/game/tyt-aytSinavTakipSistemi/icons/icon-192x192.png',
  '/game/tyt-aytSinavTakipSistemi/icons/icon-512x512.png',
  // Diğer kritik dosyalar
];

// Kurulum
self.addEventListener('install', event => {
  self.skipWaiting(); // Hızlı aktivasyon için
  console.log('[TYT-AYT SW] Kurulum başladı');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(CORE_ASSETS)
          .then(() => console.log('[TYT-AYT SW] Temel dosyalar cache\'lendi'))
          .catch(err => console.error('[TYT-AYT SW] Cache hatası:', err));
      })
  );
});

// Aktivasyon
self.addEventListener('activate', event => {
  console.log('[TYT-AYT SW] Aktif');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key.startsWith('tytAyt-takip-')) {
            console.log('[TYT-AYT SW] Eski cache siliniyor:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch İşlemleri
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // SADECE kendi scope'muzdaki istekleri işle
  if (!url.pathname.startsWith('/game/tyt-aytSinavTakipSistemi/')) {
    console.log('[TYT-AYT SW] İşlenmeyen istek:', url.pathname);
    return;
  }

  // API isteklerini doğrudan fetch et
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Ağ isteği yap (stale-while-revalidate stratejisi)
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Sadece geçerli response'ları cache'e ekle
            if (networkResponse.ok && event.request.method === 'GET') {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached || offlineResponse());
        
        return cached || fetchPromise;
      })
  );
});

function offlineResponse() {
  return new Response(
    JSON.stringify({ error: "Çevrimdışı moddasınız" }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Push bildirimleri
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'TYT-AYT', body: 'Yeni güncelleme!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/game/tyt-aytSinavTakipSistemi/icons/icon-192x192.png',
      badge: '/game/tyt-aytSinavTakipSistemi/icons/icon-72x72.png'
    })
  );
});