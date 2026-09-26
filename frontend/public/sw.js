/**
 * Service Worker de Vitro — offline básico.
 * Estrategia de actualización: nueva versión en el nombre de caché + skipWaiting al instalarse.
 */
const VERSION = 'vitro-v2';
const STATIC_ASSETS = ['/', '/consulta', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // API: nunca cachear datos (siempre red).
  if (url.pathname.startsWith('/api') || /^(?:[^.]+\.)?localhost/.test(url.hostname) && url.port === '3000') {
    return;
  }

  // Módulos internos de Vite/dev y bundles con hash de versión: siempre red (nunca quedan stale).
  if (
    url.searchParams.has('v') ||
    ['/@', '/src/', '/node_modules/'].some((p) => url.pathname.startsWith(p))
  ) {
    return;
  }

  // Navegación: red primero con fallback a caché.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit ?? caches.match('/consulta'))),
    );
    return;
  }

  // Assets estáticos: cache-first.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
