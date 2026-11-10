const CACHE = "gama-finance-v8";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg", "./assets/logos/bank-00000000.svg", "./assets/logos/bank-00000208.svg", "./assets/logos/bank-00315557.svg", "./assets/logos/bank-00360305.svg", "./assets/logos/bank-00416968.svg", "./assets/logos/bank-01858774.svg", "./assets/logos/bank-03017677.svg", "./assets/logos/bank-03795072.svg", "./assets/logos/bank-04891850.svg", "./assets/logos/bank-04902979.svg", "./assets/logos/bank-04913711.svg", "./assets/logos/bank-05463212.svg", "./assets/logos/bank-07237373.svg", "./assets/logos/bank-08561701.svg", "./assets/logos/bank-10398952.svg", "./assets/logos/bank-10573521.svg", "./assets/logos/bank-10664513.svg", "./assets/logos/bank-13009717.svg", "./assets/logos/bank-16501555.svg", "./assets/logos/bank-18236120.svg", "./assets/logos/bank-20855875.svg", "./assets/logos/bank-22896431.svg", "./assets/logos/bank-28127603.svg", "./assets/logos/bank-28195667.svg", "./assets/logos/bank-30306294.svg", "./assets/logos/bank-31872495.svg", "./assets/logos/bank-31880826.svg", "./assets/logos/bank-45246410.svg", "./assets/logos/bank-58160789.svg", "./assets/logos/bank-59285411.svg", "./assets/logos/bank-59588111.svg", "./assets/logos/bank-60701190.svg", "./assets/logos/bank-60746948.svg", "./assets/logos/bank-61186680.svg", "./assets/logos/bank-68900810.svg", "./assets/logos/bank-90400888.svg", "./assets/logos/bank-92702067.svg", "./assets/logos/bank-92894922.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});