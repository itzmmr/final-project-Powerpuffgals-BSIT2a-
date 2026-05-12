const CACHE_NAME = 'nexuswrites-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/signup.html',
  '/settings.html',
  '/profile.html',
  '/following.html',
  '/github.html',
  '/homesearch.html',
  '/notification.html',
  '/features.html',
  '/overview.html',
  '/styles/styles.css',
  '/styles/dashboard.css',
  '/styles/settings.css',
  '/styles/following.css',
  '/styles/github.css',
  '/styles/homesearch.css',
  '/styles/profile.css',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/settings.js',
  '/js/following.js',
  '/js/github.js',
  '/js/homesearch.js',
  '/js/notification.js',
  '/js/profile.js',
  '/js/login.js',
  '/js/signup.js',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});