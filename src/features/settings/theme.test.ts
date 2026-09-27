import { describe, expect, it } from 'vitest'
import { readThemePreference, resolveTheme } from './theme'

describe('reading theme', () => {
  it('follows the device appearance by default', () => {
    expect(readThemePreference(null)).toBe('system')
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('keeps an explicit appearance when the device changes', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('ignores an invalid saved preference', () => {
    expect(readThemePreference('unknown')).toBe('system')
    expect(readThemePreference('dark')).toBe('dark')
  })
})
