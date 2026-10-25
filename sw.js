const CACHE = "epe-v10";
const PRECACHE = ["/", "/archivo.html", "/404.html", "/estilo.css", "/sitio.js", "/manifest.webmanifest", "/favicon-32.png", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    // páginas: primero la red (para ver textos nuevos), si no hay conexión la copia guardada
    e.respondWith(fetch(r).then(res => {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); return res;
    }).catch(() => caches.match(r).then(m => m || caches.match("/"))));
    return;
  }
  // estilos, scripts e iconos: copia guardada y se actualiza en segundo plano
  e.respondWith(caches.match(r).then(m => {
    const red = fetch(r).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => m);
    return m || red;
  }));
});
