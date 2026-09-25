type WorkerController = Pick<ServiceWorker, 'postMessage'>
type WorkerContainer = {
  readonly controller: WorkerController | null
  addEventListener: (name: 'controllerchange', callback: () => void) => void
}

export function cacheVisitedResources(workers: WorkerContainer, Observer: typeof PerformanceObserver | undefined = globalThis.PerformanceObserver) {
  const visited = new Set<string>()
  const send = (urls: string[]) => workers.controller?.postMessage({ type: 'CACHE_VISITED', urls })
  const record = (entries: PerformanceEntry[]) => {
    const urls = entries.map(entry => entry.name)
    urls.forEach(url => visited.add(url))
    send(urls)
  }
  // ready may resolve to the previous worker during an update. Replay the
  // current visit to whichever worker takes control, including first install.
  workers.addEventListener('controllerchange', () => send([...visited]))
  if (Observer) {
    // Buffered entries include the first visit; future entries close the gap for
    // chapter/font requests already in flight when the worker claimed us.
    new Observer(list => record(list.getEntries())).observe({ type: 'resource', buffered: true })
  } else {
    record(performance.getEntriesByType('resource'))
  }
}
