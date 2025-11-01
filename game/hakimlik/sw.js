const CACHE_NAME = 'tyt-takip-v1.0.3'; // Versiyon artırıldı

const CORE_ASSETS = [
  './', // Ana dizin
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-152x152.png',
  './icons/icon-144x144.png',
  './icons/icon-128x128.png',
  './icons/icon-96x96.png',
  './icons/icon-72x72.png'
];

// Service Worker kurulumu (hata toleranslı)
self.addEventListener('install', event => {
  console.log('🚀 Tyt SW kurulumu başlıyor...');
  self.skipWaiting();

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(CORE_ASSETS.map(async (url) => {
      try {
        const resp = await fetch(url, { cache: 'no-cache' });
        if (resp && resp.ok) {
          await cache.put(url, resp.clone());
          console.log('✅ Cache\'lendi:', url);
        } else {
          console.warn('⚠️ Cache atlandı (bad response):', url, resp && resp.status);
        }
      } catch (err) {
        console.warn('⚠️ Cache atlandı (fetch failed):', url, err.message);
      }
    }));

    console.log('🎉 Tyt SW kurulumu tamamlandı!');
  })());
});

self.addEventListener('activate', event => {
  console.log('🔄 Tyt SW aktifleştiriliyor...');

  event.waitUntil((async () => {
    const keys = await caches.keys();

    // Sadece hukuk uygulamasının eski cache'lerini temizle
    await Promise.all(keys.map(key => {
      if (key.startsWith('tyt-takip-') && key !== CACHE_NAME) {
        console.log('🗑️ Eski tyt cache siliniyor:', key);
        return caches.delete(key);
      }
    }));

    await clients.claim();
    console.log('✅ Tyt SW aktifleştirildi!');
  })());
});

// Fetch olaylarını yakala
self.addEventListener('fetch', event => {
  const { request } = event;

  // Sadece GET isteklerini cache'le
  if (request.method !== 'GET') {
    return;
  }

  // Sadece aynı origin isteklerini handle et
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith((async () => {
    // Önce cache'e bak
    const cached = await caches.match(request);
    if (cached) {
      console.log('📦 Cache\'den getiriliyor:', request.url);
      return cached;
    }

    try {
      // Network'ten getir
      const networkResp = await fetch(request);

      // Yalnızca başarılı GET isteklerini cache'e koy
      if (request.method === 'GET' && networkResp && networkResp.ok && networkResp.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResp.clone());
        console.log('🌐 Network\'ten getirildi ve cache\'lendi:', request.url);
      }

      return networkResp;
    } catch (err) {
      console.error('❌ Network hatası:', err.message);
      // Offline sayfası döndürebilirsiniz
      return new Response(
        '<html><body><h1>Offline</h1><p>Bu sayfa çevrimdışı durumda mevcut değil.</p></body></html>',
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
  })());
});

// Push notification desteği
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni sınav sonucu eklendi!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    tag: 'tyt-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Tyt Takip Sistemi', options)
  );
});

// Notification tıklama olayı
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('./index.html')
  );
});