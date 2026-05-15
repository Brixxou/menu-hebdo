const CACHE_VERSION = 'menu-hebdo-v1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './js/state.js',
  './js/data.js',
  './js/utils.js',
  './js/scaling.js',
  './js/keys.js',
  './js/shopping.js',
  './js/seasonality.js',
  './js/ui/tabs.js',
  './js/ui/timer.js',
  './js/ui/share.js',
  './js/ui/shopping-mode.js',
  './js/views/semaine.js',
  './js/views/courses.js',
  './js/views/recettes.js',
  './js/views/recipe-modal.js',
  './js/views/wizard.js',
  './js/views/swap-modal.js',
  './data/recipes.json',
  './data/menus.json',
  './data/seasonality.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
