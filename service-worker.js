const cacheName = 'imagepip-cache';
const filestoCache = [
    './',
    './index.html',
    './script.js',
    './style.css',
    './icon.png',
    './icon.svg',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap',
    'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.0.375/build/pdf.min.mjs',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.0.375/build/pdf.worker.min.mjs'
];
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(filestoCache))
    );
});
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.url.indexOf("updatecode") !== -1) return fetch(req); else event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
    try {
        const networkResponse = await fetch(req);
        const cache = await caches.open(cacheName);
        await cache.delete(req);
        await cache.put(req, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(req);
        return cachedResponse;
    }
}