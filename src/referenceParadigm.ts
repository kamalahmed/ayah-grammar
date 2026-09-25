import paradigms from './referenceParadigms.json'
import type { Paradigm } from './paradigms'
const data: Record<string, Record<string, Paradigm>> = paradigms

export function referenceParadigm(form: string, rootLength: number): Paradigm | null {
  const family = rootLength === 3 ? 'triliteral' : rootLength === 4 ? 'quadriliteral' : ''
  return data[family]?.[form] ?? null
}
