export type ThemePreference = 'system' | 'light' | 'dark'

export function readThemePreference(saved: string | null): ThemePreference {
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference
}
