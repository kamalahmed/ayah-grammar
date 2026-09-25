import { describe, expect, it } from 'vitest'
import { clampReaderShare, readFontScale, readReaderShare } from './displayPreferences'

describe('display preferences', () => {
  it('restores the text scale and rejects values below 0.8', () => {
    expect(readFontScale('0.8')).toBe(0.8)
    expect(readFontScale('1.3')).toBe(1.3)
    expect(readFontScale('0.7')).toBe(1)
    expect(readFontScale('oops')).toBe(1)
  })

  it('keeps both desktop panes usable when the divider moves', () => {
    expect(readReaderShare(null)).toBe(0.3)
    expect(clampReaderShare(0.05, 1500)).toBe(0.25)
    expect(clampReaderShare(0.9, 1000)).toBeCloseTo(0.42)
  })
})
