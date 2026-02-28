// Minimal Service Worker for PWA compliance - v2
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Required for PWA "install" prompt 
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
  }
});
