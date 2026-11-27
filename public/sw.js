// ReelPay BD Service Worker v3 - network-first for manifest/icons & offline fallback
const CACHE_NAME = 'reelpay-shell-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Always fetch manifest & icons fresh from network so logo updates take effect immediately
  if (url.pathname.endsWith('manifest.json') || url.pathname.startsWith('/images/icon-') || url.pathname.endsWith('apple-touch-icon.png')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cachedResp = await cache.match('/index.html');
          return cachedResp || Response.error();
        }
      })()
    );
  }
});
