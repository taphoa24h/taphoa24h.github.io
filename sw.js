const BAN = "tth-v3.13.2";
const VO = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const NGOAI = "tth-ngoai", HOST = ["cdn.jsdelivr.net", "fastly.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(BAN).then(c => c.addAll(VO.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== BAN && k !== NGOAI).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;                                            // API Google (POST): luôn đi mạng
  const u = new URL(e.request.url);
  if (u.origin === location.origin && (e.request.mode === "navigate" || /\/$|index\.html$/.test(u.pathname))) {   // trang app: bản mới trên mạng trước, chậm quá 2,5 s thì dùng bản đã lưu
    e.respondWith(caches.open(BAN).then(c => new Promise(ok => {
      let xong = false; const tra = r => { if (!xong && r) { xong = true; ok(r); } };
      const cu = () => c.match(e.request, {ignoreSearch: true}).then(r => r || c.match("index.html"));
      const het = setTimeout(() => cu().then(tra), 2500);
      fetch(e.request).then(x => { if (x.ok) c.put(e.request, x.clone()); clearTimeout(het); if (xong) return; if (x.ok) tra(x); else cu().then(r => tra(r || x)); })
        .catch(() => { clearTimeout(het); cu().then(r => { if (r) tra(r); else if (!xong) { xong = true; ok(Response.error()); } }); });
    })));
    return;
  }
  if (u.origin === location.origin) {   // tiếng đọc, biểu tượng: mở ngay từ máy, tải bản mới ngầm cho lần sau
    e.respondWith(caches.open(BAN).then(c => c.match(e.request, {ignoreSearch: true}).then(r => {
      const moi = fetch(e.request).then(x => { if (x.ok) c.put(e.request, x.clone()); return x; });
      if (r) { e.waitUntil(moi.catch(() => {})); return r; }
      return moi.catch(() => c.match("index.html"));
    })));
    return;
  }
  if (HOST.indexOf(u.hostname) >= 0)   // bộ quét mã vạch, phông chữ: lưu hẳn trên máy, lần sau mở camera không phải tải lại
    e.respondWith(caches.open(NGOAI).then(c => c.match(e.request).then(r => r || fetch(e.request).then(x => { if (x.ok || x.type === "opaque") c.put(e.request, x.clone()); return x; }))));
});
