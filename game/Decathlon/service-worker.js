const CACHE_NAME = 'cark-pwa-v1';
const OFFLINE_URLS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.webmanifest',
    './assets/bg-pattern.png',
    './assets/spin-sfx.mp3',
    './assets/tick.mp3',
    './assets/decathlon.png',
    './assets/GencYetenek.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => { if (k !== CACHE_NAME) return caches.delete(k); }))).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((networkRes) => {
                const copy = networkRes.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => { });
                return networkRes;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});


