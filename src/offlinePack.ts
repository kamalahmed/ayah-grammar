export type OfflineManifest = {
  version: string
  totalBytes: number
  files: { url: string; bytes: number; sha256: string }[]
}

export type OfflinePackProgress = { saved: number; total: number }

const PREFIX = 'ayah-grammar-pack-'
const COMPLETE = '/__offline-pack-complete__'
const MANIFEST = '/__offline-pack-manifest__'

export async function getOfflineManifest(fetcher: typeof fetch = fetch): Promise<OfflineManifest> {
  const response = await fetcher('/offline-manifest.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('Offline file list is unavailable')
  const manifest = await response.json() as OfflineManifest
  if (!/^[a-f0-9]{64}$/.test(manifest.version) || !Array.isArray(manifest.files) || !Number.isFinite(manifest.totalBytes)
    || !manifest.files.every(file => /^\/(?!books\/|__)[^?#]+$/.test(file.url) && !file.url.endsWith('.pdf') && /^[a-f0-9]{64}$/.test(file.sha256))) {
    throw new Error('Invalid offline file list')
  }
  return manifest
}

export async function offlinePackStatus(manifest: OfflineManifest, storage: CacheStorage = caches): Promise<OfflinePackProgress & { ready: boolean }> {
  const cache = await storage.open(PREFIX + manifest.version)
  let saved = 0
  for (let index = 0; index < manifest.files.length; index += 24) {
    const batch = manifest.files.slice(index, index + 24)
    const found = await Promise.all(batch.map(file => cache.match(file.url, { ignoreVary: true })))
    saved += found.filter(Boolean).length
  }
  const marker = await cache.match(COMPLETE)
  return { saved, total: manifest.files.length, ready: saved === manifest.files.length && (await marker?.text()) === manifest.version }
}

export async function saveOfflinePack(
  manifest: OfflineManifest,
  onProgress: (progress: OfflinePackProgress) => void,
  storage: CacheStorage = caches,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const currentName = PREFIX + manifest.version
  const current = await storage.open(currentName)
  const oldNames = (await storage.keys()).filter(name => name.startsWith(PREFIX) && name !== currentName)
  const old = await Promise.all(oldNames.map(async name => {
    const cache = await storage.open(name)
    const response = await cache.match(MANIFEST)
    if (!response) return null
    try { return { cache, manifest: await response.json() as OfflineManifest } }
    catch { return null }
  }))
  const reusable = old.filter(item => item !== null)
  let saved = 0
  onProgress({ saved, total: manifest.files.length })

  for (let index = 0; index < manifest.files.length; index += 4) {
    await Promise.all(manifest.files.slice(index, index + 4).map(async file => {
      if (!await current.match(file.url, { ignoreVary: true })) {
        let response: Response | undefined
        for (const previous of reusable) {
          if (previous.manifest.files.some(entry => entry.url === file.url && entry.sha256 === file.sha256)) {
            response = await previous.cache.match(file.url, { ignoreVary: true }) || undefined
            if (response) break
          }
        }
        if (!response) {
          // The worker bypasses its runtime cache for this query. A stale cached
          // response must never be mistaken for a successful online download.
          response = await fetcher(`${file.url}?__offline_pack=${manifest.version}`, { cache: 'no-store' })
          if (!response.ok) throw new Error(`Could not save ${file.url} (${response.status})`)
        }
        const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer())
        const checksum = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
        if (checksum !== file.sha256) throw new Error(`Offline checksum mismatch for ${file.url}`)
        await current.put(file.url, response)
      }
      saved += 1
      onProgress({ saved, total: manifest.files.length })
    }))
  }

  const status = await offlinePackStatus(manifest, storage)
  if (status.saved !== status.total) throw new Error('Offline files were not all stored')
  await current.put(MANIFEST, new Response(JSON.stringify(manifest)))
  await current.put(COMPLETE, new Response(manifest.version))
  await Promise.all(oldNames.map(name => storage.delete(name)))
}
