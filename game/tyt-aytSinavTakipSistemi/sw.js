const CACHE_NAME = 'tyt-ayt-takip-v1.0.3'; // Versiyon artırıldı
const APP_SCOPE = new URL('./', self.location).pathname; // Dinamik olarak ana dizini belirle

const CORE_ASSETS = [
    APP_SCOPE, // Ana dizin
    APP_SCOPE + 'index.html',
    APP_SCOPE + 'style.css',
    APP_SCOPE + 'script.js',
    APP_SCOPE + 'manifest.json',
    APP_SCOPE + 'icons/icon-192x192.png',
    APP_SCOPE + 'icons/icon-512x512.png',
    APP_SCOPE + 'icons/icon-152x152.png',
    APP_SCOPE + 'icons/icon-144x144.png',
    APP_SCOPE + 'icons/icon-128x128.png',
    APP_SCOPE + 'icons/icon-96x96.png',
    APP_SCOPE + 'icons/icon-72x72.png'
];

// Service Worker kurulumu (hata toleranslı)
self.addEventListener('install', event => {
    console.log('🚀 TYT-AYT SW kurulumu başlıyor...');
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
        
        console.log('🎉 TYT-AYT SW kurulumu tamamlandı!');
    })());
});

self.addEventListener('activate', event => {
    console.log('🔄 TYT-AYT SW aktifleştiriliyor...');
    
    event.waitUntil((async () => {
        const keys = await caches.keys();
        
        await Promise.all(keys.map(key => {
            if (key.startsWith('tyt-ayt-') && key !== CACHE_NAME) {
                console.log('🗑️ Eski TYT-AYT cache siliniyor:', key);
                return caches.delete(key);
            }
        }));
        
        await clients.claim();
        console.log('✅ TYT-AYT SW aktifleştirildi!');
    })());
});

// Fetch olaylarını yakala
self.addEventListener('fetch', event => {
    const { request } = event;
    
    // Yalnızca aynı origin ve scope içindeki istekleri handle et
    if (!request.url.startsWith(self.location.origin + APP_SCOPE)) {
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
            // Offline sayfası döndür
            return new Response(
                '<html><head><meta charset="UTF-8"></head><body><h1>Çevrimdışı</h1><p>Bu sayfa çevrimdışı durumda mevcut değil. Lütfen internet bağlantınızı kontrol edin.</p></body></html>', 
                { 
                    status: 503, 
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                }
            );
        }
    })());
});

// Push notification desteği
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Yeni sınav sonucu eklendi!',
        icon: APP_SCOPE + 'icons/icon-192x192.png',
        badge: APP_SCOPE + 'icons/icon-72x72.png',
        tag: 'tyt-ayt-notification'
    };
    
    event.waitUntil(
        self.registration.showNotification('TYT-AYT Takip Sistemi', options)
    );
});

// Notification tıklama olayı
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(APP_SCOPE + 'index.html')
    );
});