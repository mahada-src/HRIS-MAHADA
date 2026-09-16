// Dummy Service Worker to satisfy PWA requirements
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We don't cache anything in this dummy SW.
  // In a real PWA you would implement caching strategies here.
});
