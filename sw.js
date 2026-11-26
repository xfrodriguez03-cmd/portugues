/*
 * sw.js — service worker: guarda una copia de la app en el teléfono
 * para que abra sin internet.
 *
 * Estrategia: muestra siempre lo guardado (rápido y sin internet) y, si hay
 * conexión, baja la versión nueva por atrás. Si cambiás algo y lo publicás,
 * la versión nueva aparece la SEGUNDA vez que abrís la app.
 * Si cambiás la lista de ARCHIVOS, subí el número de VERSION.
 */
importScripts('audio/indice.js'); // trae self.AUDIOS: la lista de audios grabados

const VERSION = 'v6';
const CACHE = 'tarjetas-portugues-' + VERSION;
const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './srs.js',
  './app.js',
  './audio/indice.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
].concat((self.AUDIOS || []).map(n => './audio/' + n + '.mp3'));

self.addEventListener('install', event => {
  // cache: 'reload' = bajarlos de nuevo de verdad, no de una copia vieja del navegador
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k.startsWith('tarjetas-portugues-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const guardada = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);

      const deLaRed = fetch(req).then(resp => {
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => undefined);

      if (guardada) {
        event.waitUntil(deLaRed); // actualiza por atrás
        return guardada;
      }
      return (await deLaRed) || new Response('Sin conexión', { status: 503, statusText: 'Sin conexión' });
    })
  );
});
