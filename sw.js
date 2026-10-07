// 発信機チェッカー：圏外でもページを開けるようにする
const CACHE = "checker-v1";
const FILES = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットがあれば新しいページを取りに行き、だめなら（または3秒待っても来なければ）保存してあるページを使う
function fromCache(req) {
  return caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"));
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;

  const network = fetch(e.request).then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return res;
  });
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));

  e.respondWith(
    Promise.race([network.catch(() => null), timeout]).then((res) => res || fromCache(e.request).then((c) => c || network))
  );
});
