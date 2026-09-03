// Service worker — makes the app installable (Android/Chrome) and work offline.
const CACHE = 'ob-cache-v1';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'icon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Let cross-origin requests (orthocal.info daily readings, Google Fonts) pass
  // straight to the network so they behave exactly as before.
  if (url.origin !== location.origin) return;
  // Same-origin app shell: serve from cache, fall back to network, and
  // runtime-cache anything new. Offline navigations fall back to index.html.
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
