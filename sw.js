const CACHE_VERSION = 'facturacion-cache-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './pages/login.html',
    './pages/admin.html',
    './assets/css/app.css',
    './assets/js/core/password-utils.js',
    './assets/js/core/loading-utils.js',
    './assets/js/core/firebase-utils.js',
    './assets/js/core/theme-utils.js',
    './assets/js/core/session-utils.js',
    './assets/js/core/toast-utils.js',
    './assets/js/core/status-utils.js',
    './assets/js/core/list-utils.js',
    './assets/js/core/performance-utils.js',
    './assets/js/core/sw-register.js',
    './assets/js/admin/main.js',
    './assets/js/login/config.js',
    './assets/js/login/auth.js',
    './assets/js/index/backup-and-shared-utils.js',
    './assets/js/index/invoices-store-and-draft.js',
    './assets/js/index/invoices-form-and-validation.js',
    './assets/js/index/access-control-auth.js',
    './assets/js/index/invoices-list-and-pagination.js',
    './assets/js/index/invoices-actions-and-events.js',
    './assets/js/anti-inspection.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => Promise.resolve())
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    const isNavigation = event.request.mode === 'navigate';

    if (isNavigation) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200) return response;
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
