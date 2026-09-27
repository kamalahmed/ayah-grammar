import { useCallback, useEffect, useState } from 'react'
import { createJsonCache } from './jsonCache'

export const chapterCache = createJsonCache(4)
export const studyCache = createJsonCache(24)

type DataState<T> = { url: string | null; data: T | null; error: boolean }

export function useJsonData<T>(url: string | null, cache = chapterCache) {
  const [state, setState] = useState<DataState<T>>({ url: null, data: null, error: false })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    setState({ url, data: null, error: false })
    cache.load<T>(url, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ url, data, error: false })
    }).catch(() => {
      if (!controller.signal.aborted) setState({ url, data: null, error: true })
    })
    return () => controller.abort()
  }, [url, cache, attempt])
  const current = state.url === url ? state : { data: null, error: false }
  return { ...current, loading: !!url && !current.data && !current.error, retry }
}
