const CACHE = 'ayah-grammar-v7'
const PACK_PREFIX = 'ayah-grammar-pack-'

const cached = async request => {
  const url = new URL(typeof request === 'string' ? request : request.url, self.location.origin)
  // These public static bytes do not vary by Origin. The parser's crossorigin
  // request must match a shell/first-visit URL seed even when hosting adds Vary.
  try {
    const packs = (await caches.keys()).filter(key => key.startsWith(PACK_PREFIX)).reverse()
    for (const name of packs) {
      const saved = await (await caches.open(name)).match(request, { ignoreVary: isStudyResource(url) })
      if (saved) return saved
    }
    return await (await caches.open(CACHE)).match(request, { ignoreVary: isStudyResource(url) })
  } catch { return undefined }
}
const remember = (request, response) => caches.open(CACHE).then(cache => cache.put(request, response)).catch(() => {})
const isStudyResource = url => url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || /^\/data\/(?:chapters|chapter-\d+)\.json$/.test(url.pathname))

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    // The shell is small. Chapters, root data and fonts are saved only as used.
    await cache.addAll(['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/offline-manifest.json'])
    const html = await (await cache.match('/index.html')).text()
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1])
    await cache.addAll(assets)
    await self.skipWaiting()
  })())
})
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => /^ayah-grammar-v\d+$/.test(key) && key !== CACHE).map(key => caches.delete(key)))
    await self.clients.claim()
  })())
})

// A first page may finish loading before the new worker controls it. Reuse the
// HTTP cache for those already-requested resources; never crawl unused data.
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_VISITED' || !Array.isArray(event.data.urls)) return
  event.waitUntil(Promise.all([...new Set(event.data.urls)].map(async value => {
    try {
      if (typeof value !== 'string') return
      const url = new URL(value, self.location.origin)
      if (!isStudyResource(url) || await cached(url.href)) return
      const response = await fetch(url.href, { cache: 'force-cache' })
      if (response.ok) await remember(url.href, response)
    } catch { /* An offline first visit or denied storage must not break reading. */ }
  })))
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/books/')) return
  if (url.searchParams.has('__offline_pack')) {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith((async () => {
    if (url.pathname.startsWith('/assets/')) {
      const saved = await cached(event.request)
      if (saved) return saved
    }
    try {
      const response = await fetch(event.request)
      if (response.ok) event.waitUntil(remember(event.request, response.clone()))
      else if (response.status >= 500) {
        const saved = await cached(event.request)
        if (saved) return saved
      }
      return response
    } catch {
      const saved = await cached(event.request)
      if (saved) return saved
      if (event.request.mode === 'navigate') {
        const shell = await cached('/index.html')
        if (shell) return shell
      }
      return new Response('This page is not available offline yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    }
  })())
})
