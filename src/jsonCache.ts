// Keep recently visited data in memory without retaining the entire Quran.
export function createJsonCache(limit: number, fetcher: typeof fetch = fetch) {
  const completed = new Map<string, unknown>()
  return {
    async load<T>(url: string, signal?: AbortSignal): Promise<T> {
      signal?.throwIfAborted()
      if (completed.has(url)) {
        const data = completed.get(url)
        completed.delete(url)
        completed.set(url, data)
        return data as T
      }
      const response = await fetcher(url, { signal })
      if (!response.ok) throw new Error(`Data unavailable (${response.status})`)
      const data = await response.json() as T
      signal?.throwIfAborted()
      completed.set(url, data)
      while (completed.size > limit) completed.delete(completed.keys().next().value!)
      return data
    },
  }
}
