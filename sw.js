// Import Workbox script
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

// let workbox-cli inject precache manifest
workbox.precaching.precacheAndRoute([
  {
    "url": "images/icon-192.png",
    "revision": "0cf9922dd8d808ca55dec967c5c06503"
  },
  {
    "url": "images/icon-512.png",
    "revision": "fd08e298594221b1f13c3ab114d8cbc1"
  },
  {
    "url": "index.html",
    "revision": "b598621b478667e4ee6a6dcb2e0421a1"
  },
  {
    "url": "manifest.json",
    "revision": "b6a1bfafd4d2f231ca139b822cd9626d"
  },
  {
    "url": "scripts/index.js",
    "revision": "da59019311cf21ef1ace6d7bd0bb71ed"
  },
  {
    "url": "scripts/solitaire.js",
    "revision": "43052b1071cdbbd82fc5add9ff781edd"
  },
  {
    "url": "scripts/solitaire.min.js",
    "revision": "e33a179a52819d0d4cd9ba333253fd1c"
  },
  {
    "url": "service-worker-base.js",
    "revision": "d63fba84e864f9d037161de7de44c7dc"
  },
  {
    "url": "style.css",
    "revision": "2300381f4fa95e00d31ed8778596b5da"
  },
  {
    "url": "workbox-config.js",
    "revision": "27448fcaebbcb239a3608bb08eb79c87"
  }
]);

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
