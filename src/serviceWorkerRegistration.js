/* eslint-disable no-restricted-globals */
export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
      var swUrl = process.env.PUBLIC_URL + "/service-worker.js";
      navigator.serviceWorker.register(swUrl).then(function(registration) {
        registration.onupdatefound = function() {
          var installingWorker = registration.installing;
          if (installingWorker == null) return;
          installingWorker.onstatechange = function() {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("New content available, will be used on next reload.");
              } else {
                console.log("Content is cached for offline use.");
              }
            }
          };
        };
      }).catch(function(error) {
        console.error("Error during service worker registration:", error);
      });
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.unregister();
    }).catch(function(error) {
      console.error(error.message);
    });
  }
}
