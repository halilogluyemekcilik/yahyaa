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

self.addEventListener('fetch', function(event) {
    // Hem Hukuk hem de TYT-AYT uygulamalarının isteklerini tamamen dışla
    if (event.request.url.includes('/game/hmgsSinavTakipSistemi/') || 
        event.request.url.includes('/game/tyt-aytSinavTakipSistemi/')) {
        return; // Bu istekleri atla, kendi SW'leri halletsin
    }
    
    // Diğer tüm istekler için cache ve network stratejisi buraya gelecek
});
  
  // Fetch olaylarını yakala
self.addEventListener('fetch', function(event) {
    const requestUrl = event.request.url;

    // PWA kurulum isteklerini ve diğer uygulamaların isteklerini tamamen dışla.
    // Bu SW'nin sadece kendi kapsamındaki istekleri işlemesini sağlıyor.
    if (requestUrl.includes('/game/tyt-aytSinavTakipSistemi/') || 
        requestUrl.includes('/game/hmgsSinavTakipSistemi/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache'de varsa cache'den döndür
                if (response) {
                    console.log('📦 Cache\'den getiriliyor:', requestUrl);
                    return response;
                }
                
                // Cache'de yoksa network'ten getir
                console.log('🌐 Network\'ten getiriliyor:', requestUrl);
                return fetch(event.request).then(
                    function(response) {
                        // Geçerli response kontrolü
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Response'u klonla ve cache'e ekle
                        var responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                                console.log('✅ Network yanıtı cache\'lendi:', requestUrl);
                            });

                        return response;
                    }
                ).catch(function(err) {
                    // Network hatası durumunda yapılacak işlem
                    console.error('❌ Network hatası:', requestUrl, err);
                    // Kullanıcıya bir offline sayfası döndürmek faydalı olabilir
                    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                });
            })
    );
});

// Eski cache'leri temizle
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // Bu koşul, silinecek olan cache'leri belirler.
                    // Kendi uygulamamızın mevcut versiyonu (CACHE_NAME) VE diğer uygulamaların cache'leri hariç her şeyi siler.
                    if (cacheName !== CACHE_NAME && 
                        !cacheName.includes('hukuk-takip') && 
                        !cacheName.includes('deneme-sinav-takip')) { // deneme-sinav-takip'i de ekledim.
                        console.log('Eski cache siliniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                    // Eğer yukarıdaki koşula uymuyorsa, yani korunması gereken bir cache ise, bir şey yapma
                    return Promise.resolve();
                })
            );
        })
    );
});