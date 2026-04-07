// ================================================
// サービスワーカー — オフライン対応キャッシュ
// ================================================

const CACHE = "focal-pro-v9";

// HTMLはキャッシュしない（常に最新を取得）
const CACHE_FILES = ["/manifest.json", "/icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CACHE_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTMLはネットワーク優先（失敗時のみキャッシュ）
// その他のリソースはキャッシュ優先
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // APIリクエストはSWを通さない
  if (url.pathname.startsWith("/api/")) return;

  // HTML（ナビゲーション）はネットワーク優先
  if (e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // その他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
