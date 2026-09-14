// Service Worker cho PWA
const CACHE_NAME = 'clb-hub-v4';
const urlsToCache = [
    '/',
    '/static/css/style.css',
    '/static/css/3d-badges.css',
    '/static/js/api.js',
    '/static/js/app.js',
    '/static/js/pages.js',
    '/static/js/ai.js',
    '/static/js/ai-icons.js'
];

self.addEventListener('install', event => {
    // Bỏ qua chờ cache cũ - luôn kích hoạt SW mới ngay
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Không cache cho các request có query string (?v=...) - luôn fetch mới
    if (url.search) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Không cache cho API
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Luôn thử fetch mới trước, fallback cache
                return fetch(event.request)
                    .then(fetchRes => {
                        // Cập nhật cache với phiên bản mới
                        if (fetchRes && fetchRes.status === 200) {
                            const resClone = fetchRes.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, resClone);
                            });
                        }
                        return fetchRes;
                    })
                    .catch(() => response);
            })
    );
});

self.addEventListener('activate', event => {
    // Chiếm quyền kiểm soát ngay lập tức
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});
