const filesToCache = [
  '/',
  'index.html',
  'style.css',
  'manifest.json',
  // scripts
  'scripts/index.js',
  'scripts/solitaire.js',
];

const staticCacheName = 'cache-v1';

self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  console.log('fetching', event.request.url);
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        console.log('found ', event.request.url, 'in cache');
        return response;
      }
      console.log('network request for ', event.request.url);
      return fetch(event.request);
    })
  );
});