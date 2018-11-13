// Import Workbox script
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

// let workbox-cli inject precache manifest
workbox.precaching.precacheAndRoute([]);

// Route resource requests with different caching strategies

// Workbox recommendation for Google Fonts
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  workbox.strategies.cacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.Plugin({ statuses: [0, 200], }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 3, // few entries is enough for this small app
      })
    ]
  })
);

// Static files e.g. HTML, JS, CSS, PNG
workbox.routing.registerRoute(
  /\.(?:html|js|css|png)$/,
  // use cache first
  workbox.strategies.cacheFirst({ cacheName: 'static-resources' })
);

// App manifest JSON file
workbox.routing.registerRoute(
  '/manifest.json',
  // manifest.json has little to no change since init app launch
  workbox.strategies.cacheFirst({ cacheName: 'app-manifest' })
);

//wait for service work to be installed
self.addEventListener('install', event => {
  console.log('service worker installed');
});

self.addEventListener('activate', event => {
  console.log('service worker activated');
});
