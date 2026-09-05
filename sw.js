/* Service Worker — офлайн-режим ZShooter.
 *
 * КАК ОБНОВЛЯТЬ ИГРУ ДЛЯ ИГРОКОВ:
 * при каждом обновлении index.html/кода поднимите версию в CACHE_NAME
 * ниже: 'zshooter-v1' → 'zshooter-v2' и т.д. Старый SW при активации удалит
 * все кэши, кроме своего, и закэширует новые файлы. Без бампа игроки
 * останутся на старой версии из кэша!
 */
const CACHE_NAME = 'zshooter-v1';

// Всё, что нужно для полностью офлайн-запуска (three.min.js — локальный!)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './three.min.js',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // новый SW активируется сразу, не дожидаясь закрытия вкладок
  );
});

self.addEventListener('activate', (event) => {
  // удаляем кэши всех старых версий
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache First: сначала кэш, при промахе — сеть, с ответом догоняем кэш
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        if (res && res.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html')); // офлайн и файл не в кэше — отдаём игру
    })
  );
});
