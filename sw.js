/* DiagLab Pro — service worker : application disponible hors connexion */
const VERSION = "diaglab-2.5.0";
const CORE = [
  "./", "./index.html", "./style.css", "./data.js", "./data-plus.js", "./data-faults.js", "./app.js", "./board.js", "./tests.js", "./phone.js", "./ia.js", "./iso.js",
  "./rescue.js", "./drivers.js", "./brands.js", "./disques.js", "./academy.js", "./academy-data.js", "./academy-net.js", "./academy-figs.js", "./outils/DiagLab-Cle-Secours.zip",
  "./vendor/anthropic-sdk-1.3.0.js", "./manifest.webmanifest",
  "./icons/favicon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png",
  "./outils/DiagLab-Rapport.ps1", "./outils/Lancer-DiagLab.bat", "./outils/DiagLab-Rapport.zip"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== "diaglab-fonts").map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Polices Google : cache d'abord, réseau ensuite
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("diaglab-fonts").then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }
      catch (err) { return new Response("", { status: 503 }); }
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord (pour recevoir les mises à jour), cache si hors connexion
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Fichiers : cache immédiat, rafraîchi en arrière-plan
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response("Hors connexion", { status: 503 });
  }));
});
