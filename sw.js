const CACHE = 'onyx-shell-v94';
const APP_SHELL = [
  './', './index.html?v=94', './styles.css?v=94', './script.js?v=94', './site.webmanifest',
  './assets/gym-hero.webp?v=90', './assets/gym-hero-900.webp?v=90', './assets/favicon.svg',
  './assets/film/walk-06-wide.jpg?v=90'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('.mp4') || event.request.destination === 'video') return;
  const request = event.request;
  const isDocument = request.mode === 'navigate' || request.destination === 'document';
  event.respondWith(
    isDocument
      ? fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
          return response;
        }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
      : caches.match(request).then(cached => cached || fetch(request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }).catch(() => cached))
  );
});
