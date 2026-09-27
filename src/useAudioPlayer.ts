import { useCallback, useEffect, useRef, useState } from 'react'

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused'
type AudioError = 'unavailable' | 'load' | 'play'

export function useAudioPlayer() {
  const element = useRef<HTMLAudioElement | null>(null)
  const activeId = useRef<string | null>(null)
  const [id, setId] = useState<string | null>(null)
  const [status, setStatus] = useState<AudioStatus>('idle')
  const [error, setError] = useState<AudioError | null>(null)

  const audio = useCallback(() => {
    if (element.current) return element.current
    const player = new Audio()
    player.preload = 'none'
    player.addEventListener('playing', () => setStatus('playing'))
    player.addEventListener('pause', () => { if (activeId.current) setStatus('paused') })
    player.addEventListener('ended', () => { activeId.current = null; setId(null); setStatus('idle') })
    player.addEventListener('error', () => {
      activeId.current = null
      setId(null)
      setStatus('idle')
      setError('load')
    })
    element.current = player
    return player
  }, [])

  const stop = useCallback(() => {
    const player = element.current
    if (player) { player.pause(); player.removeAttribute('src'); player.load() }
    activeId.current = null
    setId(null)
    setStatus('idle')
    setError(null)
  }, [])

  const toggle = useCallback((targetId: string, url: string | null) => {
    if (!url) { setError('unavailable'); return }
    const player = audio()
    if (activeId.current === targetId && !player.paused) { player.pause(); return }
    if (activeId.current !== targetId) {
      player.pause()
      player.src = url
      activeId.current = targetId
      setId(targetId)
    }
    setError(null)
    setStatus('loading')
    void player.play().catch(() => {
      if (activeId.current !== targetId) return
      setStatus('paused')
      setError('play')
    })
  }, [audio])

  useEffect(() => () => {
    if (element.current) { element.current.pause(); element.current.removeAttribute('src') }
  }, [])

  return { id, status, error, toggle, stop }
}
