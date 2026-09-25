export function deferModule<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null
  return () => pending ??= load().catch(error => { pending = null; throw error })
}
