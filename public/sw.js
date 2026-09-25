const CACHE = 'ayah-grammar-v5'
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/data/chapters.json', '/data/chapter-1.json'])
    const html = await (await cache.match('/index.html')).text()
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1])
    await cache.addAll(assets)
    for (const cssPath of assets.filter(path => path.endsWith('.css'))) {
      const css = await (await cache.match(cssPath)).text()
      const fonts = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].replace(/["']/g, ''))
        .filter(path => path.startsWith('/assets/'))
      await cache.addAll(fonts)
    }
  })())
  self.skipWaiting()
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))))
  self.clients.claim()
})
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)))
    }
    return response
  }).catch(() => caches.match(event.request, { ignoreVary: true })))
})
