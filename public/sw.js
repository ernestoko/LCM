/*
 * Liberty & Liberty Logistics — service worker.
 * Dependency-free, vanilla JS. Bump CACHE_VERSION to invalidate old caches.
 *
 * Strategy:
 *   - install : precache the app shell entry points, then skipWaiting().
 *   - activate: delete caches from older versions, then clients.claim().
 *   - fetch   : network-first for navigations (HTML), cache-first for static
 *               assets. API requests (/api/*) are NEVER cached — always network.
 */

const CACHE_VERSION = "liberty-v2";
const CACHE_NAME = CACHE_VERSION;

// Minimal app shell to keep core pages available offline.
const PRECACHE_URLS = ["/", "/track"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests; let the network deal with everything else.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // Only same-origin requests are cached; cross-origin goes straight through.
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic — always hit the network so data stays fresh.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for navigations (HTML documents), fall back to cache, then
  // to the precached shell root so the app still renders offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Cache-first for static assets (scripts, styles, images, fonts).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache valid, basic (same-origin) responses.
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
