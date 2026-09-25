import { describe, expect, it } from 'vitest'
import { createJsonCache } from './jsonCache'

describe('requested JSON data', () => {
  it('loads only the requested chapter and reuses completed data on return', async () => {
    const requested: string[] = []
    const cache = createJsonCache(3, async input => {
      requested.push(String(input))
      return Response.json([{ key: '2:1' }])
    })
    expect(await cache.load('/data/chapter-2.json')).toEqual([{ key: '2:1' }])
    expect(await cache.load('/data/chapter-2.json')).toEqual([{ key: '2:1' }])
    expect(requested).toEqual(['/data/chapter-2.json'])
  })

  it('does not retain failed requests and permits an explicit retry', async () => {
    let attempts = 0
    const cache = createJsonCache(3, async () => ++attempts === 1
      ? new Response('Unavailable', { status: 503 }) : Response.json(['ready']))
    await expect(cache.load('/chapter.json')).rejects.toThrow()
    expect(await cache.load('/chapter.json')).toEqual(['ready'])
  })

  it('cancels a discarded chapter and never stores its late response', async () => {
    let complete!: (value: Response) => void
    let receivedSignal: AbortSignal | null | undefined
    let attempts = 0
    const cache = createJsonCache(3, async (_input, init) => {
      attempts++
      receivedSignal = init?.signal
      return attempts === 1 ? new Promise(resolve => { complete = resolve }) : Response.json(['current'])
    })
    const controller = new AbortController()
    const request = cache.load('/old.json', controller.signal)
    controller.abort()
    expect(receivedSignal?.aborted).toBe(true)
    complete(Response.json(['stale']))
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    expect(await cache.load('/old.json')).toEqual(['current'])
  })

  it('bounds retained chapters and evicts the least recently used chapter', async () => {
    const requested: string[] = []
    const cache = createJsonCache(2, async input => {
      requested.push(String(input))
      return Response.json(String(input))
    })
    for (const path of ['/1', '/2', '/1', '/3', '/2']) await cache.load(path)
    expect(requested).toEqual(['/1', '/2', '/3', '/2'])
  })
})
