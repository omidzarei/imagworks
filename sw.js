/* Omitsu Studio service worker — offline cache for the standalone editor */
const CACHE = 'omitsu-studio-v2';
// Resolve assets relative to the SW's own scope so it works under any sub-path
const SCOPE = self.registration ? self.registration.scope : (self.location.origin + '/');
const ASSETS = [
  'app.html',
  'manifest.webmanifest',
  'pwa-icon-192.png',
  'pwa-icon-512.png',
  'apple-touch-icon.png',
  'favicon.ico'
].map((p) => new URL(p, SCOPE).toString());

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match(new URL('app.html', SCOPE).toString())))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
