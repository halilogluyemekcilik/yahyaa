const CACHE_NAME = 'quiz-cache-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './img/BarikatLogo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
    );
    self.clients.claim();
});

// Cache-first for core assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return (
                cached ||
                fetch(event.request)
                    .then((response) => {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                        return response;
                    })
                    .catch(() => caches.match('./index.html'))
            );
        })
    );
});


