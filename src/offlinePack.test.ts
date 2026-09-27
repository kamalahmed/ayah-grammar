import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { offlinePackStatus, saveOfflinePack, type OfflineManifest } from './offlinePack'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')

function fixture() {
  const stores = new Map<string, Map<string, Response>>()
  const storage = {
    async keys() { return [...stores.keys()] },
    async delete(name: string) { return stores.delete(name) },
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map())
      const entries = stores.get(name)!
      return {
        async match(url: string) { return entries.get(url)?.clone() },
        async put(url: string, response: Response) { entries.set(url, response.clone()) },
        async keys() { return [...entries.keys()].map(url => new Request(`https://reader.example${url}`)) },
      }
    },
  } as unknown as CacheStorage
  const fetched: string[] = []
  let fail = ''
  const fetcher = async (input: RequestInfo | URL) => {
    const url = String(input)
    fetched.push(url)
    if (url.includes(fail) && fail) throw new Error('Connection lost')
    return new Response(url.includes('chapter-') ? 'chapter' : 'study')
  }
  return { storage, stores, fetched, fetcher: fetcher as typeof fetch, failOn(value: string) { fail = value } }
}

const initial: OfflineManifest = {
  version: 'a'.repeat(64), totalBytes: 12,
  files: [
    { url: '/data/chapter-1.json', bytes: 7, sha256: sha('chapter') },
    { url: '/assets/study.js', bytes: 5, sha256: sha('study') },
  ],
}

describe('complete offline pack', () => {
  it('downloads every file before reporting ready and resumes without another download', async () => {
    const fake = fixture()
    expect((await offlinePackStatus(initial, fake.storage)).ready).toBe(false)
    const progress: number[] = []
    await saveOfflinePack(initial, value => progress.push(value.saved), fake.storage, fake.fetcher)
    expect(progress.at(-1)).toBe(2)
    expect(fake.fetched).toHaveLength(2)
    expect((await offlinePackStatus(initial, fake.storage)).ready).toBe(true)
    await saveOfflinePack(initial, () => {}, fake.storage, fake.fetcher)
    expect(fake.fetched).toHaveLength(2)
  })

  it('keeps an older complete pack when an update fails, then reuses unchanged files', async () => {
    const fake = fixture()
    await saveOfflinePack(initial, () => {}, fake.storage, fake.fetcher)
    const update: OfflineManifest = {
      ...initial, version: 'b'.repeat(64),
      files: [...initial.files, { url: '/data/chapter-2.json', bytes: 7, sha256: sha('chapter') }],
    }
    fake.failOn('chapter-2')
    await expect(saveOfflinePack(update, () => {}, fake.storage, fake.fetcher)).rejects.toThrow('Connection lost')
    expect((await offlinePackStatus(initial, fake.storage)).ready).toBe(true)
    expect((await offlinePackStatus(update, fake.storage)).ready).toBe(false)
    fake.failOn('')
    await saveOfflinePack(update, () => {}, fake.storage, fake.fetcher)
    expect(fake.fetched.filter(url => url.includes('study.js'))).toHaveLength(1)
    expect((await offlinePackStatus(update, fake.storage)).ready).toBe(true)
    expect(fake.stores.has(`ayah-grammar-pack-${initial.version}`)).toBe(false)
  })

  it('rejects a successful HTTP response whose bytes do not match the release manifest', async () => {
    const fake = fixture()
    const corrupted = { ...initial, files: [{ ...initial.files[0], sha256: 'f'.repeat(64) }] }
    await expect(saveOfflinePack(corrupted, () => {}, fake.storage, fake.fetcher)).rejects.toThrow('checksum')
    expect((await offlinePackStatus(corrupted, fake.storage)).ready).toBe(false)
  })
})
