import { describe, expect, it } from 'vitest'
import { cacheVisitedResources } from './offlineResources'

describe('first-visit offline resources', () => {
  it('includes completed requests and later completions from before worker control', () => {
    const messages: unknown[] = []
    let deliver: PerformanceObserverCallback | undefined
    const Observer = class {
      constructor(callback: PerformanceObserverCallback) { deliver = callback }
      observe(options: PerformanceObserverInit) {
        if (options.type === 'resource' && options.buffered) deliver?.({ getEntries: () => [{ name: 'https://reader.example/assets/reader.js' }] } as PerformanceObserverEntryList, {} as PerformanceObserver)
      }
    } as unknown as typeof PerformanceObserver
    cacheVisitedResources({ controller: { postMessage: message => { messages.push(message) } }, addEventListener() {} }, Observer)
    deliver?.({ getEntries: () => [{ name: 'https://reader.example/data/chapter-2.json' }] } as PerformanceObserverEntryList, {} as PerformanceObserver)
    expect(messages).toEqual([
      { type: 'CACHE_VISITED', urls: ['https://reader.example/assets/reader.js'] },
      { type: 'CACHE_VISITED', urls: ['https://reader.example/data/chapter-2.json'] },
    ])
  })
})

describe('worker updates', () => {
  it('replays visited URLs to the new controller instead of keeping the old worker', () => {
    const oldMessages: unknown[] = []
    const newMessages: unknown[] = []
    let changed: (() => void) | undefined
    let deliver: PerformanceObserverCallback | undefined
    const container = {
      controller: { postMessage: (message: unknown) => oldMessages.push(message) },
      addEventListener: (_name: string, callback: () => void) => { changed = callback },
    }
    const Observer = class {
      constructor(callback: PerformanceObserverCallback) { deliver = callback }
      observe() {}
    } as unknown as typeof PerformanceObserver
    // The container supports v5 while registration.ready is already resolved.
    cacheVisitedResources(container as unknown as ServiceWorkerContainer, Observer)
    deliver?.({ getEntries: () => [{ name: 'https://reader.example/data/chapter-2.json' }] } as PerformanceObserverEntryList, {} as PerformanceObserver)
    container.controller = { postMessage: message => newMessages.push(message) }
    changed?.()
    expect(newMessages).toEqual([{ type: 'CACHE_VISITED', urls: ['https://reader.example/data/chapter-2.json'] }])
    deliver?.({ getEntries: () => [{ name: 'https://reader.example/assets/used-font.woff2' }] } as PerformanceObserverEntryList, {} as PerformanceObserver)
    expect(newMessages[1]).toEqual({ type: 'CACHE_VISITED', urls: ['https://reader.example/assets/used-font.woff2'] })
    expect(oldMessages).toHaveLength(1)
  })
})
