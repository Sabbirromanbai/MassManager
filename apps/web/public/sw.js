/*
 * MassManager service worker.
 *
 * Static assets only. Authentication, API, dashboard HTML and personal data
 * are never cached. Navigations always prefer the network and fall back to a
 * static offline page when the network is unavailable.
 */
const VERSION = "v1";
const CACHE_NAME = `massmanager-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/logo.png",
  "/background.jpg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const STATIC_PATHS = [
  "/logo.png",
  "/background.jpg",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
];

function isCacheableStatic(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    STATIC_PATHS.includes(pathname)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all(
      PRECACHE.map((url) =>
        caches.open(CACHE_NAME).then((cache) => cache.add(url)).catch(() => undefined),
      ),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data === "CLEAR_CACHE") {
    event.waitUntil(caches.delete(CACHE_NAME));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Never touch non-GET requests (POST/PATCH/DELETE, including auth writes).
  if (request.method !== "GET") return;
  // Never touch authenticated/cross-origin requests.
  if (request.headers.has("Authorization")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, never stored. Offline -> static fallback only.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match(OFFLINE_URL);
        return (
          fallback ||
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // Everything else (especially /api/* and /api/auth/*) is left untouched.
  if (!isCacheableStatic(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) {
        // Serve instantly and refresh quietly in the background.
        fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === "basic") {
              return cache.put(request, response.clone());
            }
          })
          .catch(() => undefined);
        return cached;
      }

      const response = await fetch(request);
      if (response && response.ok && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })().catch(
      () => new Response("", { status: 503, statusText: "Offline" }),
    ),
  );
});
