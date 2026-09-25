import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

function worker({ varyOrigin = false } = {}) {
  const origin = 'https://reader.example'
  const absolute = (input: string | { url: string }) => new URL(typeof input === 'string' ? input : input.url, origin).href
  const listeners: Record<string, (event: any) => void> = {}
  type CachedEntry = { response: Response; headers: Headers }
  type Input = string | { url: string; headers?: Headers }
  const stores = new Map<string, Map<string, CachedEntry>>()
  const requestHeaders = (input: Input) => typeof input === 'string' ? new Headers() : input.headers || new Headers()
  const match = (store: Map<string, CachedEntry>, input: Input, options?: CacheQueryOptions) => {
    const entry = store.get(absolute(input))
    if (!entry) return undefined
    const vary = entry.response.headers.get('Vary')?.split(',').map(name => name.trim()) || []
    if (!options?.ignoreVary && vary.some(name => name === '*' || entry.headers.get(name) !== requestHeaders(input).get(name))) return undefined
    return entry.response.clone()
  }
  const requests: string[] = []
  let offline = false
  let quota = false
  const network = async (input: string | { url: string }) => {
    const url = absolute(input)
    requests.push(new URL(url).pathname)
    if (offline) throw new Error('Offline')
    const path = new URL(url).pathname
    return new Response(path === '/index.html' || path === '/' ? '<script src="/assets/reader-abcd.js"></script><link href="/assets/reader-abcd.css" rel="stylesheet">'
      : path.endsWith('.css') ? '@font-face { src:url(/assets/unused-font-abcd.woff2) }'
      : path.endsWith('.json') ? '[{"key":"2:1"}]' : path, { headers: varyOrigin ? { Vary: 'Origin' } : {} })
  }
  const caches = {
    async keys() { return [...stores.keys()] },
    async delete(name: string) { return stores.delete(name) },
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)!
      return {
        async match(input: Input, options?: CacheQueryOptions) { return match(store, input, options) },
        async put(input: Input, response: Response) { if (quota) throw new Error('Quota exceeded'); store.set(absolute(input), { response: response.clone(), headers: requestHeaders(input) }) },
        async addAll(paths: string[]) { for (const path of paths) store.set(absolute(path), { response: await network(path), headers: new Headers() }) },
      }
    },
    async match(input: string | { url: string }) {
      for (const store of stores.values()) { const response = match(store, input); if (response) return response }
    },
  }
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin }, addEventListener: (name: string, handler: (event: any) => void) => { listeners[name] = handler }, skipWaiting() {}, clients: { claim() {} } },
    caches, fetch: network, URL, Response, Set,
  })
  const dispatch = async (name: string, properties: object = {}) => {
    const waits: Promise<unknown>[] = []
    let response: Promise<Response> | undefined
    listeners[name]?.({ ...properties, waitUntil: (promise: Promise<unknown>) => waits.push(promise), respondWith: (promise: Promise<Response>) => { response = promise } })
    const value = await response
    await Promise.all(waits)
    return value
  }
  return {
    requests, stores, caches,
    offline() { offline = true }, quota() { quota = true },
    install: () => dispatch('install'), activate: () => dispatch('activate'),
    message: (urls: string[]) => dispatch('message', { data: { type: 'CACHE_VISITED', urls } }),
    get: (path: string, mode = 'cors', headers: HeadersInit = {}) => dispatch('fetch', { request: { url: absolute(path), method: 'GET', mode, headers: new Headers(headers) } }),
  }
}

describe('on-demand offline caching', () => {
  it('installs the shell without downloading any chapters, study data, or fonts', async () => {
    const sw = worker()
    await sw.install()
    expect(sw.requests).toContain('/assets/reader-abcd.js')
    expect(sw.requests).toContain('/assets/reader-abcd.css')
    expect(sw.requests.filter(path => path.startsWith('/data/') || /\.woff2?$/.test(path))).toEqual([])
  })

  it('reuses visited hashed assets without another network request', async () => {
    const sw = worker()
    expect(await (await sw.get('/assets/verb-686479-abcd.json'))?.json()).toEqual([{ key: '2:1' }])
    expect(await (await sw.get('/assets/verb-686479-abcd.json'))?.json()).toEqual([{ key: '2:1' }])
    expect(sw.requests).toEqual(['/assets/verb-686479-abcd.json'])
  })

  it('refreshes a selected chapter online and falls back to it offline', async () => {
    const sw = worker()
    await sw.get('/data/chapter-2.json')
    await sw.get('/data/chapter-2.json')
    expect(sw.requests).toEqual(['/data/chapter-2.json', '/data/chapter-2.json'])
    sw.offline()
    expect(await (await sw.get('/data/chapter-2.json'))?.json()).toEqual([{ key: '2:1' }])
  })

  it('seeds only first-visit resources actually requested by the reader', async () => {
    const sw = worker()
    await sw.message(['/data/chapter-2.json', '/assets/used-font-abcd.woff2', 'https://other.example/private.json', '/books/level-1.pdf'])
    expect(sw.requests).toEqual(['/data/chapter-2.json', '/assets/used-font-abcd.woff2'])
    sw.offline()
    expect(await (await sw.get('/data/chapter-2.json'))?.json()).toEqual([{ key: '2:1' }])
  })

  it('still delivers a network response when cache storage is full', async () => {
    const sw = worker()
    sw.quota()
    expect(await (await sw.get('/data/chapter-2.json'))?.json()).toEqual([{ key: '2:1' }])
  })

  it('cleans up only obsolete caches belonging to this app', async () => {
    const sw = worker()
    await sw.caches.open('unrelated-app')
    await sw.caches.open('ayah-grammar-v5')
    await sw.install()
    await sw.activate()
    expect(sw.stores.has('unrelated-app')).toBe(true)
    expect(sw.stores.has('ayah-grammar-v5')).toBe(false)
  })
})


describe('public static resource variants', () => {
  it('serves precached JS and CSS offline when the browser adds Origin', async () => {
    const sw = worker({ varyOrigin: true })
    await sw.install()
    sw.offline()
    for (const path of ['/assets/reader-abcd.js', '/assets/reader-abcd.css']) {
      const response = await sw.get(path, 'cors', { Origin: 'https://reader.example' })
      expect(response?.status).toBe(200)
      expect(await response?.text()).not.toContain('not available offline')
    }
  })

  it('serves a URL-seeded public chapter despite an Origin header difference', async () => {
    const sw = worker({ varyOrigin: true })
    await sw.message(['/data/chapter-2.json'])
    sw.offline()
    const response = await sw.get('/data/chapter-2.json', 'cors', { Origin: 'https://reader.example' })
    expect(response?.status).toBe(200)
    expect(await response?.json()).toEqual([{ key: '2:1' }])
  })

  it('does not ignore Vary for unrelated same-origin responses', async () => {
    const sw = worker({ varyOrigin: true })
    await sw.get('/account', 'cors', { Origin: 'https://one.example' })
    sw.offline()
    const response = await sw.get('/account', 'cors', { Origin: 'https://two.example' })
    expect(response?.status).toBe(503)
  })
})
