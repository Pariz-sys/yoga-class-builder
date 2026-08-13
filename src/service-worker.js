/* eslint-disable no-restricted-globals */

self.__WB_MANIFEST;

var CACHE_NAME = "yoga-builder-v1";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(["/", "/index.html"]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (!response || response.status !== 200 || response.type !== "basic") {
        return response;
      }
      var responseToCache = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, responseToCache);
      });
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
