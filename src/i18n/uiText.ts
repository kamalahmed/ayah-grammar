import { bangla } from './locales/bn'

export type UiLanguage = 'en' | 'bn'

export function readUiLanguage(value: string | null): UiLanguage {
  return value === 'bn' ? 'bn' : 'en'
}


export function uiText(language: UiLanguage, english: string, values: Record<string, string | number> = {}): string {
  const template = language === 'bn' ? bangla[english] ?? english : english
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}
