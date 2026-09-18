const CACHE = 'onyx-shell-v2';
const APP_SHELL = [
  './', './index.html', './styles.css?v=42', './script.js?v=42', './site.webmanifest',
  './assets/gym-hero.webp', './assets/gym-hero-900.webp', './assets/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  const request = event.request;
  const isDocument = request.mode === 'navigate' || request.destination === 'document';
  event.respondWith(
    isDocument
      ? fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
      : caches.match(request).then(cached => cached || fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        }))
  );
});
