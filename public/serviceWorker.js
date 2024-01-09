const CHATGPT_NEXT_WEB_CACHE = "奥图智能客服";

self.addEventListener("activate", function (event) {
  //console.log("ServiceWorker activated.");
});

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CHATGPT_NEXT_WEB_CACHE).then(function (cache) {
      return cache.addAll([]);
    }),
  );
});

self.addEventListener("fetch", (e) => {});
