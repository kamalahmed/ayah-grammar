import { describe, expect, it } from 'vitest'
import chapters from '../public/data/chapters.json'
import { DEFAULT_RECITER, readReciter, verseAudioUrl, wordAudioUrl } from './audio'

describe('Quran audio locations', () => {
  it('maps a verse key to its global ayah number for a selected reciter', () => {
    expect(verseAudioUrl('1:1', chapters, 'ar.alafasy')).toBe('https://cdn.islamic.network/quran/audio/64/ar.alafasy/1.mp3')
    expect(verseAudioUrl('67:1', chapters, 'ar.husary')).toBe('https://cdn.islamic.network/quran/audio/64/ar.husary/5242.mp3')
  })

  it('rejects invalid verse locations and unknown reciters', () => {
    expect(verseAudioUrl('67:31', chapters, 'ar.alafasy')).toBeNull()
    expect(verseAudioUrl('0:1', chapters, 'ar.alafasy')).toBeNull()
    expect(readReciter('someone-else')).toBe(DEFAULT_RECITER)
  })

  it('maps a selected Quran word to the documented word audio path', () => {
    expect(wordAudioUrl('67:1', 1)).toBe('https://audio.qurancdn.com/wbw/067_001_001.mp3')
    expect(wordAudioUrl('1:1', 4)).toBe('https://audio.qurancdn.com/wbw/001_001_004.mp3')
    expect(wordAudioUrl('1:1', 0)).toBeNull()
  })
})
