const CACHE = 'onyx-shell-v62';
const APP_SHELL = [
  './', './index.html?v=62', './styles.css?v=62', './script.js?v=62', './site.webmanifest',
  './assets/gym-hero.webp', './assets/gym-hero-900.webp', './assets/favicon.svg',
  './assets/film/walk-06-wide.jpg?v=62'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  // Don't cache videos in SW — let browser handle range requests and avoid quota issues
  if (event.request.url.includes('.mp4') || event.request.destination === 'video') {
    return;
  }
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


