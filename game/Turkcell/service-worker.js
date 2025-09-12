const CACHE_NAME = 'cark-pwa-v1';
const OFFLINE_URLS = [
    './',
    './index.html',
    './style.css',
    './arka.css',
    './script.js',
    './arka.js',
    './manifest.webmanifest',
    './assets/center-logo.png',
    './assets/center-logo.webp',
    './assets/qrcode.png',
    './assets/bg-pattern.png',
    './assets/background.mp4',
    './assets/backgroundOrg.mp4',
    './assets/bg-music.mp3',
    './assets/spin-sfx.mp3',
    './assets/tick.mp3',
    './img/image2.png',
    './img/image3.png',
    './img/image4.png'
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


