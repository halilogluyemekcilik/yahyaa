const CACHE_NAME = 'quiz-cache-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './img/Barikatlogo.png'
];

// Soruları ve diğer statik dosyaları da önbelleğe ekle
const QUESTION_FILES = Array.from({ length: 25 }, (_, i) => `./sorular/soru${i + 1}.txt`);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll([...CORE_ASSETS, ...QUESTION_FILES]))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
    );
    self.clients.claim();
});

// Network-first for questions, fallback to cache; Cache-first for core assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.includes('/sorular/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

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


