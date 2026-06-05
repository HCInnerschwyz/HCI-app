const CACHE = "hci-v3";

// On install: skip waiting so new SW activates immediately
self.addEventListener("install", e => {
  self.skipWaiting();
});

// On activate: delete ALL old caches and claim clients immediately
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network first for everything
// Cache is only used as fallback when offline
self.addEventListener("fetch", e => {
  // Skip non-GET and browser-extension requests
  if(e.request.method !== "GET") return;
  if(!e.request.url.startsWith("http")) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for offline fallback
        if(response && response.status === 200 && response.type !== "opaque"){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(e.request);
      })
  );
});
