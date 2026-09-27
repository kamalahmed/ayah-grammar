import type { Chapter } from './types'

export const DEFAULT_RECITER = 'ar.alafasy'
export const reciters = [
  { id: 'ar.alafasy', name: 'Mishary Alafasy' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)' },
] as const

export function readReciter(value: string | null): string {
  return reciters.some(reciter => reciter.id === value) ? value! : DEFAULT_RECITER
}

function location(key: string): [number, number] | null {
  if (!/^\d{1,3}:\d{1,3}$/.test(key)) return null
  const [chapter, verse] = key.split(':').map(Number)
  return chapter >= 1 && chapter <= 114 && verse >= 1 ? [chapter, verse] : null
}

export function verseAudioUrl(key: string, chapters: Chapter[], reciter: string): string | null {
  const place = location(key)
  if (!place || !reciters.some(item => item.id === reciter)) return null
  const [chapter, verse] = place
  const index = chapters.findIndex(item => item.number === chapter)
  if (index < 0 || verse > chapters[index].ayahs) return null
  const number = chapters.slice(0, index).reduce((total, item) => total + item.ayahs, 0) + verse
  return `https://cdn.islamic.network/quran/audio/64/${reciter}/${number}.mp3`
}

export function wordAudioUrl(key: string, position: number): string | null {
  const place = location(key)
  if (!place || !Number.isInteger(position) || position < 1 || position > 999) return null
  const [chapter, verse] = place
  return `https://audio.qurancdn.com/wbw/${[chapter, verse, position].map(value => String(value).padStart(3, '0')).join('_')}.mp3`
}
